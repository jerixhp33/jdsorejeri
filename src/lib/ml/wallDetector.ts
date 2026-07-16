import { pipeline, env, RawImage } from '@xenova/transformers';

// Skip local model check since we're in the browser
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = 'Xenova/segformer-b0-finetuned-ade-512-512';

let segmenterInstance: any = null;

export async function detectWallBounds(imageUrl: string): Promise<{x: number, y: number, width: number, height: number} | null> {
  try {
    if (!segmenterInstance) {
      // Load model on demand
      segmenterInstance = await pipeline('image-segmentation', MODEL_ID);
    }
    
    const output = await segmenterInstance(imageUrl);
    
    // The model returns an array of segments: { label: string, mask: RawImage }
    const wallSegment = output.find((o: any) => o.label === 'wall');
    
    if (!wallSegment) {
      console.warn("No wall detected in the image.");
      return null;
    }
    
    // We need to calculate the bounding box of the wall mask
    const { width, height, data } = wallSegment.mask;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = data[y * width + x];
        // If the pixel belongs to the wall (threshold > 128 for grayscale mask)
        if (val > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (minX > maxX || minY > maxY) {
      return null;
    }
    
    // We shrink the bounding box slightly (10%) to provide a safety margin away from edges
    const marginX = (maxX - minX) * 0.1;
    const marginY = (maxY - minY) * 0.1;
    
    minX = Math.max(0, minX + marginX);
    maxX = Math.min(width, maxX - marginX);
    minY = Math.max(0, minY + marginY);
    maxY = Math.min(height, maxY - marginY);
    
    // Return relative bounding box (0.0 to 1.0)
    return {
      x: minX / width,
      y: minY / height,
      width: (maxX - minX) / width,
      height: (maxY - minY) / height
    };
  } catch (err) {
    console.error("ML Wall detection failed:", err);
    return null;
  }
}
