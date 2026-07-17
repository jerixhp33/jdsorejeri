import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.proxy = true;

const MODEL_ID = 'Xenova/segformer-b0-finetuned-ade-512-512';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CACHE_MAX_SIZE = 100;

// 1×1 transparent PNG for warm-up inference
const WARMUP_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ── Types ────────────────────────────────────────────────────────────────────

export type ImageInput = string | Blob | File | HTMLImageElement;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WallDetectionResult {
  bounds: BoundingBox;
  coverage: number;
  bboxCoverage: number;
  confidence: number;
  label: string;
  maskWidth: number;
  maskHeight: number;
  mask?: Uint8Array;
}

export interface WallDetectionOptions {
  insetFactor?: number;
  minCoverageRatio?: number;
  minBboxCoverage?: number;
  minConfidence?: number;
  targetLabel?: string;
  timeoutMs?: number;
  warmup?: boolean;
  debug?: boolean;
  signal?: AbortSignal;
  onProgress?: (stage: ProgressStage, fraction: number) => void;
}

export type ProgressStage = 'loading' | 'inference';

interface SegmentResult {
  label: string;
  score: number;
  mask: {
    width: number;
    height: number;
    data: Uint8Array;
  };
}

type SegmentationPipeline = (input: string) => Promise<SegmentResult[]>;

// ── AbortSignal compat helper ────────────────────────────────────────────────

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

// ── Pipeline state machine ───────────────────────────────────────────────────

type PipelineState =
  | { status: 'idle' }
  | { status: 'loading'; promise: Promise<SegmentationPipeline> }
  | { status: 'ready'; instance: SegmentationPipeline }
  | { status: 'failed'; error: unknown };

let pipelineState: PipelineState = { status: 'idle' };

async function getSegmenter(
  warmup: boolean,
  onProgress?: WallDetectionOptions['onProgress'],
): Promise<SegmentationPipeline> {
  if (pipelineState.status === 'ready') return pipelineState.instance;
  if (pipelineState.status === 'loading') return pipelineState.promise;
  if (pipelineState.status === 'failed') pipelineState = { status: 'idle' };

  const loadPromise = (
    pipeline('image-segmentation', MODEL_ID, {
      progress_callback: (p: { progress?: number }) => {
        if (typeof p.progress === 'number') {
          onProgress?.('loading', p.progress / 100);
        }
      },
    }) as Promise<unknown>
  )
    .then(async (instance) => {
      const seg = instance as SegmentationPipeline;
      if (warmup) {
        try { await seg(WARMUP_IMAGE); } catch { /* ignore warm-up failures */ }
      }
      pipelineState = { status: 'ready', instance: seg };
      return seg;
    })
    .catch((error: unknown) => {
      pipelineState = { status: 'failed', error };
      throw error;
    });

  pipelineState = { status: 'loading', promise: loadPromise };
  return loadPromise;
}

export async function releaseSegmenter(): Promise<void> {
  if (pipelineState.status === 'ready') {
    const instance = pipelineState.instance as SegmentationPipeline & {
      dispose?: () => Promise<void>;
    };
    await instance.dispose?.();
  }
  pipelineState = { status: 'idle' };
}

// ── LRU cache ────────────────────────────────────────────────────────────────

class LRUCache<V> {
  private readonly map = new Map<string, V>();

  constructor(private readonly maxSize: number) {}

  get(key: string): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) {
      this.map.delete(this.map.keys().next().value!);
    }
    this.map.set(key, value);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  clear(): void {
    this.map.clear();
  }
}

const detectionCache = new LRUCache<WallDetectionResult | null>(DEFAULT_CACHE_MAX_SIZE);

export function clearDetectionCache(): void {
  detectionCache.clear();
}

// ── Image normalization ──────────────────────────────────────────────────────

function normalizeInput(input: ImageInput): { url: string; isObjectUrl: boolean } {
  if (typeof input === 'string') {
    if (!input.trim()) throw new Error('Image URL must not be empty.');
    return { url: input, isObjectUrl: false };
  }
  if (input instanceof Blob || input instanceof File) {
    return { url: URL.createObjectURL(input), isObjectUrl: true };
  }
  if (input instanceof HTMLImageElement) {
    if (!input.src) throw new Error('HTMLImageElement has no src.');
    return { url: input.src, isObjectUrl: false };
  }
  throw new Error('Unsupported image input type.');
}

// ── Timeout helper ───────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error(`Wall detection timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

// ── Connected-component labeling (BFS) ──────────────────────────────────────

interface ComponentBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixelCount: number;
}

function largestConnectedComponent(
  data: Uint8Array,
  width: number,
  height: number,
): ComponentBounds | null {
  const visited = new Uint8Array(data.length);
  const queue = new Int32Array(data.length);
  let best: ComponentBounds | null = null;

  for (let startIdx = 0; startIdx < data.length; startIdx++) {
    if (data[startIdx] === 0 || visited[startIdx]) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = startIdx;
    visited[startIdx] = 1;

    let minX = width, minY = height, maxX = -1, maxY = -1, pixelCount = 0;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx - x) / width;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      pixelCount++;

      let n: number;

      n = idx - 1;
      if (x > 0 && data[n] > 0 && !visited[n]) { visited[n] = 1; queue[tail++] = n; }

      n = idx + 1;
      if (x < width - 1 && data[n] > 0 && !visited[n]) { visited[n] = 1; queue[tail++] = n; }

      n = idx - width;
      if (y > 0 && data[n] > 0 && !visited[n]) { visited[n] = 1; queue[tail++] = n; }

      n = idx + width;
      if (y < height - 1 && data[n] > 0 && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
    }

    if (!best || pixelCount > best.pixelCount) {
      best = { minX, minY, maxX, maxY, pixelCount };
    }
  }

  return best;
}

// ── Inset + normalize ────────────────────────────────────────────────────────

function applyInset(
  bounds: ComponentBounds,
  insetFactor: number,
  imageWidth: number,
  imageHeight: number,
): BoundingBox | null {
  const insetX = (bounds.maxX - bounds.minX) * insetFactor;
  const insetY = (bounds.maxY - bounds.minY) * insetFactor;

  const x0 = Math.max(0, bounds.minX + insetX);
  const x1 = Math.min(imageWidth - 1, bounds.maxX - insetX);
  const y0 = Math.max(0, bounds.minY + insetY);
  const y1 = Math.min(imageHeight - 1, bounds.maxY - insetY);

  if (x1 <= x0 || y1 <= y0) return null;

  return {
    x: x0 / imageWidth,
    y: y0 / imageHeight,
    width: (x1 - x0) / imageWidth,
    height: (y1 - y0) / imageHeight,
  };
}

// ── Best-segment selection ───────────────────────────────────────────────────

function pickBestSegment(
  segments: SegmentResult[],
  targetLabel: string,
): SegmentResult | null {
  const label = targetLabel.toLowerCase();
  return segments.reduce<SegmentResult | null>((best, current) => {
    if (current.label.toLowerCase() !== label) return best;
    return !best || current.score > best.score ? current : best;
  }, null);
}

// ── Cache key ────────────────────────────────────────────────────────────────

function buildCacheKey(url: string, opts: Required<Omit<WallDetectionOptions, 'signal' | 'onProgress' | 'debug'>>): string {
  return [
    url,
    opts.targetLabel,
    opts.insetFactor,
    opts.minCoverageRatio,
    opts.minBboxCoverage,
    opts.minConfidence,
  ].join('::');
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function detectWallBounds(
  input: ImageInput,
  options: WallDetectionOptions = {},
): Promise<WallDetectionResult | null> {
  const {
    insetFactor = 0.10,
    minCoverageRatio = 0.01,
    minBboxCoverage = 0.05,
    minConfidence = 0.50,
    targetLabel = 'wall',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    warmup = true,
    debug = false,
    signal,
    onProgress,
  } = options;

  throwIfAborted(signal);

  const { url: imageUrl, isObjectUrl } = normalizeInput(input);

  const cacheKey = buildCacheKey(imageUrl, {
    insetFactor, minCoverageRatio, minBboxCoverage,
    minConfidence, targetLabel, timeoutMs, warmup,
  });

  if (detectionCache.has(cacheKey)) {
    return detectionCache.get(cacheKey) ?? null;
  }

  try {
    const segmenter = await getSegmenter(warmup, onProgress);

    throwIfAborted(signal);

    onProgress?.('inference', 0);
    const segments = await withTimeout(segmenter(imageUrl), timeoutMs);
    onProgress?.('inference', 1);

    throwIfAborted(signal);

    const wallSegment = pickBestSegment(segments, targetLabel);
    if (!wallSegment || wallSegment.score < minConfidence) {
      detectionCache.set(cacheKey, null);
      return null;
    }

    const { width, height, data } = wallSegment.mask;

    const component = largestConnectedComponent(data, width, height);
    if (!component) {
      detectionCache.set(cacheKey, null);
      return null;
    }

    const coverage = component.pixelCount / (width * height);
    if (coverage < minCoverageRatio) {
      detectionCache.set(cacheKey, null);
      return null;
    }

    const bounds = applyInset(component, insetFactor, width, height);
    if (!bounds) {
      detectionCache.set(cacheKey, null);
      return null;
    }

    const bboxCoverage = bounds.width * bounds.height;
    if (bboxCoverage < minBboxCoverage) {
      detectionCache.set(cacheKey, null);
      return null;
    }

    const result: WallDetectionResult = {
      bounds,
      coverage,
      bboxCoverage,
      confidence: wallSegment.score,
      label: wallSegment.label,
      maskWidth: width,
      maskHeight: height,
      ...(debug && { mask: data }),
    };

    detectionCache.set(cacheKey, result);
    return result;

  } finally {
    if (isObjectUrl) URL.revokeObjectURL(imageUrl);
  }
}

export async function detectWallBoundsSafe(
  input: ImageInput,
  options?: WallDetectionOptions,
): Promise<BoundingBox | null> {
  try {
    const result = await detectWallBounds(input, options);
    return result?.bounds ?? null;
  } catch {
    return null;
  }
}
