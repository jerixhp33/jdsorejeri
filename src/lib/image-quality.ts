// src/lib/image-quality.ts
// Print Quality Engine for Custom Photo Posters

export interface SizeQualityRating {
  sizeId: 'A5' | 'A4' | 'A3';
  sizeLabel: string;
  dimensionsMm: string;
  dpi: number;
  status: 'excellent' | 'good' | 'acceptable' | 'low';
  badgeLabel: string;
  isRecommended: boolean;
}

export interface ImageQualityAnalysis {
  width: number;
  height: number;
  aspectRatioStr: string;
  aspectRatioNum: number;
  fileSizeMb: number;
  overallStatus: 'excellent' | 'good' | 'acceptable' | 'low';
  sizeRatings: Record<'A5' | 'A4' | 'A3', SizeQualityRating>;
  warnings: string[];
}

const POSTER_DIMS_INCHES = {
  A5: { width: 5.8, height: 8.3, mm: '148 × 210 mm' },
  A4: { width: 8.3, height: 11.7, mm: '210 × 297 mm' },
  A3: { width: 11.7, height: 16.5, mm: '297 × 420 mm' }
};

export function analyzeImageQuality(
  width: number,
  height: number,
  fileSizeBytes: number
): ImageQualityAnalysis {
  const fileSizeMb = parseFloat((fileSizeBytes / (1024 * 1024)).toFixed(2));
  
  // Aspect ratio calculation
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const aspectW = Math.round(width / divisor);
  const aspectH = Math.round(height / divisor);
  const aspectRatioNum = parseFloat((width / height).toFixed(2));
  
  // Common aspect ratio strings
  let aspectRatioStr = `${aspectW}:${aspectH}`;
  if (Math.abs(aspectRatioNum - 1.0) < 0.05) aspectRatioStr = '1:1 (Square)';
  else if (Math.abs(aspectRatioNum - 1.33) < 0.05) aspectRatioStr = '4:3 (Standard)';
  else if (Math.abs(aspectRatioNum - 1.5) < 0.05) aspectRatioStr = '3:2 (Classic Photo)';
  else if (Math.abs(aspectRatioNum - 1.41) < 0.05) aspectRatioStr = '1:1.41 (A-Series Standard)';
  else if (Math.abs(aspectRatioNum - 1.78) < 0.05) aspectRatioStr = '16:9 (Widescreen)';

  // Calculate DPI for A5, A4, A3
  const isLandscape = width > height;
  
  const calculateDpi = (targetInchesWidth: number, targetInchesHeight: number) => {
    const wDpi = (isLandscape ? height : width) / targetInchesWidth;
    const hDpi = (isLandscape ? width : height) / targetInchesHeight;
    return Math.round(Math.min(wDpi, hDpi));
  };

  const getDpiStatus = (dpi: number): 'excellent' | 'good' | 'acceptable' | 'low' => {
    if (dpi >= 250) return 'excellent';
    if (dpi >= 180) return 'good';
    if (dpi >= 120) return 'acceptable';
    return 'low';
  };

  const getBadgeLabel = (status: 'excellent' | 'good' | 'acceptable' | 'low', sizeLabel: string): string => {
    switch (status) {
      case 'excellent': return `${sizeLabel} — Excellent Quality ✓`;
      case 'good': return `${sizeLabel} — Good Quality ✓`;
      case 'acceptable': return `${sizeLabel} — Acceptable Quality ⚠️`;
      case 'low': return `${sizeLabel} — Low Resolution ❌`;
    }
  };

  const sizeRatings: Record<'A5' | 'A4' | 'A3', SizeQualityRating> = {
    A5: {
      sizeId: 'A5',
      sizeLabel: 'A5',
      dimensionsMm: POSTER_DIMS_INCHES.A5.mm,
      dpi: calculateDpi(POSTER_DIMS_INCHES.A5.width, POSTER_DIMS_INCHES.A5.height),
      status: 'excellent',
      badgeLabel: '',
      isRecommended: true
    },
    A4: {
      sizeId: 'A4',
      sizeLabel: 'A4',
      dimensionsMm: POSTER_DIMS_INCHES.A4.mm,
      dpi: calculateDpi(POSTER_DIMS_INCHES.A4.width, POSTER_DIMS_INCHES.A4.height),
      status: 'excellent',
      badgeLabel: '',
      isRecommended: true
    },
    A3: {
      sizeId: 'A3',
      sizeLabel: 'A3',
      dimensionsMm: POSTER_DIMS_INCHES.A3.mm,
      dpi: calculateDpi(POSTER_DIMS_INCHES.A3.width, POSTER_DIMS_INCHES.A3.height),
      status: 'excellent',
      badgeLabel: '',
      isRecommended: true
    }
  };

  (['A5', 'A4', 'A3'] as const).forEach((s) => {
    const dpi = sizeRatings[s].dpi;
    const status = getDpiStatus(dpi);
    sizeRatings[s].status = status;
    sizeRatings[s].badgeLabel = getBadgeLabel(status, s);
    sizeRatings[s].isRecommended = status === 'excellent' || status === 'good';
  });

  // Overall status based on A4
  const overallStatus = sizeRatings.A4.status;
  const warnings: string[] = [];

  if (sizeRatings.A3.status === 'low') {
    warnings.push('⚠️ Low resolution for A3 printing. Your photo may appear less sharp at larger sizes. We recommend A4 or A5.');
  }
  if (width < 800 || height < 800) {
    warnings.push('⚠️ Small image dimensions. Uploading a higher resolution photo ensures maximum print clarity.');
  }

  return {
    width,
    height,
    aspectRatioStr,
    aspectRatioNum,
    fileSizeMb,
    overallStatus,
    sizeRatings,
    warnings
  };
}
