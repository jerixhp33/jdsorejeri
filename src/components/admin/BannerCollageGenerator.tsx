// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PRESETS = [
  { id: "desktop", label: "Desktop Hero", w: 1920, h: 640, icon: "🖥" },
  { id: "mobile", label: "Mobile Hero", w: 1080, h: 540, icon: "📱" },
  { id: "instagram", label: "Instagram Post", w: 1080, h: 1080, icon: "📷" },
  { id: "ig-portrait", label: "IG Portrait", w: 1080, h: 1350, icon: "📸" },
  { id: "ig-story", label: "IG Story", w: 1080, h: 1920, icon: "⬆" },
  { id: "youtube", label: "YouTube Thumb", w: 1280, h: 720, icon: "▶" },
  { id: "custom", label: "Custom Size", w: 1200, h: 400, icon: "✏" },
];

const LAYOUTS = ["Auto", "Grid", "Magazine", "Masonry", "Minimal", "Floating Cards", "Polaroid", "Dynamic"];

const BACKGROUNDS = [
  { id: "matte-black", label: "Matte Black", value: "#0a0a0a" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "dark-gray", label: "Dark Gray", value: "#1a1a1a" },
  { id: "transparent", label: "Transparent", value: "transparent" },
  { id: "custom", label: "Custom", value: "#1a1a2e" },
];

const SHADOWS = ["None", "Soft", "Medium", "Strong"];
const LOGO_POSITIONS = ["Top Left", "Top Right", "Bottom Left", "Bottom Right", "Center"];
const FONT_FAMILIES = ["Inter", "Playfair Display", "Montserrat", "Oswald", "Raleway", "Bebas Neue", "DM Sans"];
const FONT_WEIGHTS = ["300", "400", "500", "600", "700", "800", "900"];

// ─── Core drawing helpers ─────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  if (r === 0) { ctx.rect(x, y, w, h); return; }
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draw image using CONTAIN behavior — full artwork visible, no cropping.
 * Centers the image inside the cell. Shows background around it if aspect ratios differ.
 */
function drawImageContain(ctx, imgEl, x, y, w, h) {
  const iw = imgEl.naturalWidth || imgEl.width;
  const ih = imgEl.naturalHeight || imgEl.height;
  if (!iw || !ih) return;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(imgEl, dx, dy, dw, dh);
}

/**
 * Draw image using COVER behavior — fills the cell entirely, crops edges.
 * Centers the crop.
 */
function drawImageCover(ctx, imgEl, x, y, w, h) {
  const iw = imgEl.naturalWidth || imgEl.width;
  const ih = imgEl.naturalHeight || imgEl.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const sw2 = w / scale;
  const sh2 = h / scale;
  const sx = (iw - sw2) / 2;
  const sy = (ih - sh2) / 2;
  ctx.drawImage(imgEl, sx, sy, sw2, sh2, x, y, w, h);
}

// ─── Layout Algorithm ─────────────────────────────────────────────────────────
/**
 * computeLayout — builds cell descriptors for the given images.
 *
 * @param images      - array of image objects (with .width/.height/.element)
 * @param canvasW     - full canvas width in px
 * @param canvasH     - full canvas height in px
 * @param style       - layout name
 * @param gap         - gap (px) between adjacent poster cells (default 0)
 * @param outerPad    - outer padding around the whole collage (default 0)
 * @param radius      - corner radius (passed through to cells)
 * @param shadow      - shadow style (passed through)
 * @param fitMode     - "contain" (default) or "cover"
 */
function computeLayout(
  images,
  canvasW,
  canvasH,
  style,
  gap = 0,
  outerPad = 0,
  radius = 0,
  shadow = "None",
  fitMode = "contain"
) {
  const n = images.length;
  if (n === 0) return [];

  // usable drawing area inside outer padding
  const ox = outerPad;
  const oy = outerPad;
  const sw = canvasW - outerPad * 2;   // usable width
  const sh = canvasH - outerPad * 2;   // usable height

  // Determine effective layout
  let effectiveStyle = style;
  // For Auto layout, use cover so posters tile edge-to-edge with no letterbox.
  // Individual named layouts respect the user's fitMode choice.
  const resolvedFitMode = (style === "Auto" && fitMode === "contain") ? "cover" : fitMode;

  if (style === "Auto") {
    if (n === 1) effectiveStyle = "Minimal";
    else if (n <= 4) effectiveStyle = "Grid";
    else if (n <= 8) effectiveStyle = "Magazine";
    else effectiveStyle = "Grid";
  }

  const cells = [];

  // ── Minimal / single ───────────────────────────────────────────────────────
  if (effectiveStyle === "Minimal" || n === 1) {
    const img = images[0];
    const ar = img.width / img.height;
    const canvasAr = sw / sh;
    let w, h;
    if (ar > canvasAr) { w = sw; h = sw / ar; }
    else { w = sh * ar; h = sh; }
    cells.push({
      img,
      x: ox + (sw - w) / 2,
      y: oy + (sh - h) / 2,
      w,
      h,
      fitMode: resolvedFitMode,
    });

  // ── Grid ───────────────────────────────────────────────────────────────────
  } else if (effectiveStyle === "Grid") {
    // ── Smart column picker ──────────────────────────────────────────────────
    // Choose cols/rows so cells stay within a reasonable aspect-ratio range
    // (0.35–2.0) and incomplete last rows are minimised.
    // Scoring weights: empty-slot waste > AR deviation from portrait (0.75).
    let bestCols = Math.ceil(Math.sqrt(n));
    let bestScore = Infinity;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const last = n - (r - 1) * c;
      const empty = c - last;
      const cw = (sw - gap * (c - 1)) / c;
      const ch = (sh - gap * (r - 1)) / r;
      const ar = cw / ch;
      if (ar < 0.35 || ar > 2.2) continue;          // skip absurd cell shapes
      const emptyPen = (empty / c) * 3;
      const arPen = Math.abs(Math.log(ar / 0.75)) * 0.5;
      const score = emptyPen + arPen;
      if (score < bestScore) { bestScore = score; bestCols = c; }
    }
    const cols = bestCols;
    const rows = Math.ceil(n / cols);
    const lastRowCount = n - (rows - 1) * cols;

    // ── Pixel-perfect column widths and row heights ──────────────────────────
    // Distribute 1 extra pixel left-to-right so max diff between any two = 1px.
    const totalHGap = gap * (cols - 1);
    const totalVGap = gap * (rows - 1);
    const availW = sw - totalHGap;
    const availH = sh - totalVGap;
    const baseW = Math.floor(availW / cols);
    const baseH = Math.floor(availH / rows);
    const remW = availW - baseW * cols;
    const remH = availH - baseH * rows;

    const colWidths  = Array.from({ length: cols }, (_, c) => baseW + (c < remW ? 1 : 0));
    const rowHeights = Array.from({ length: rows }, (_, r) => baseH + (r < remH ? 1 : 0));

    // Cumulative x/y starts — gap=0 → cells share exact edges
    const colX = [];
    let cx0 = ox;
    for (let c = 0; c < cols; c++) { colX.push(cx0); cx0 += colWidths[c] + gap; }
    const rowY = [];
    let ry0 = oy;
    for (let r = 0; r < rows; r++) { rowY.push(ry0); ry0 += rowHeights[r] + gap; }

    // ── Incomplete last row: STRETCH cells to fill full canvas width ─────────
    // Rather than centering with black bars, distribute the available width
    // equally across the remaining cells so the collage stays edge-to-edge.
    const isLastRowIncomplete = lastRowCount < cols;
    let lastRowColWidths = [];
    let lastRowColX = [];
    if (isLastRowIncomplete) {
      const lastAvailW = sw - gap * (lastRowCount - 1);
      const lastBaseW = Math.floor(lastAvailW / lastRowCount);
      const lastRemW  = lastAvailW - lastBaseW * lastRowCount;
      lastRowColWidths = Array.from({ length: lastRowCount }, (_, c) => lastBaseW + (c < lastRemW ? 1 : 0));
      let lx = ox;
      for (let c = 0; c < lastRowCount; c++) { lastRowColX.push(lx); lx += lastRowColWidths[c] + gap; }
    }

    images.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const isLastRow = row === rows - 1 && isLastRowIncomplete;

      const cellX = isLastRow ? lastRowColX[col]       : colX[col];
      const cellW = isLastRow ? lastRowColWidths[col]   : colWidths[col];
      const cellH = rowHeights[row];

      cells.push({ img, x: cellX, y: rowY[row], w: cellW, h: cellH, fitMode: resolvedFitMode });
    });

  // ── Magazine ───────────────────────────────────────────────────────────────
  } else if (effectiveStyle === "Magazine") {
    if (n === 2) {
      // Two equal side-by-side panels
      const cellW = Math.floor((sw - gap) / 2);
      const extraW = sw - gap - cellW * 2;
      cells.push({ img: images[0], x: ox,               y: oy, w: cellW,          h: sh, fitMode: resolvedFitMode });
      cells.push({ img: images[1], x: ox + cellW + gap,  y: oy, w: cellW + extraW, h: sh, fitMode: resolvedFitMode });
    } else if (n === 3) {
      // Large left panel + two stacked right panels
      const mainW = Math.round(sw * 0.55);
      const sideW = sw - mainW - gap;
      const sideH = Math.floor((sh - gap) / 2);
      const extraSideH = sh - gap - sideH * 2;
      cells.push({ img: images[0], x: ox,              y: oy,             w: mainW, h: sh,              fitMode: resolvedFitMode });
      cells.push({ img: images[1], x: ox + mainW + gap, y: oy,             w: sideW, h: sideH,           fitMode: resolvedFitMode });
      cells.push({ img: images[2], x: ox + mainW + gap, y: oy + sideH + gap, w: sideW, h: sideH + extraSideH, fitMode: resolvedFitMode });
    } else {
      // 4+: prominent feature left (50%), grid of thumbnails right (50%)
      const mainW = Math.round(sw * 0.5);
      const sideW = sw - mainW - gap;
      const sideCount = n - 1;
      const sideCols = Math.ceil(Math.sqrt(sideCount));
      const sideRows = Math.ceil(sideCount / sideCols);
      const sideItemW = Math.floor((sideW - gap * (sideCols - 1)) / sideCols);
      const sideItemH = Math.floor((sh  - gap * (sideRows - 1)) / sideRows);
      const sideExtraW = sideW - gap * (sideCols - 1) - sideItemW * sideCols;
      const sideExtraH = sh   - gap * (sideRows - 1) - sideItemH * sideRows;

      cells.push({ img: images[0], x: ox, y: oy, w: mainW, h: sh, fitMode: resolvedFitMode });
      images.slice(1).forEach((img, i) => {
        const sc = i % sideCols;
        const sr = Math.floor(i / sideCols);
        const isLastSc = sc === sideCols - 1;
        const isLastSr = sr === sideRows - 1;
        cells.push({
          img,
          x: ox + mainW + gap + sc * (sideItemW + gap),
          y: oy + sr * (sideItemH + gap),
          w: sideItemW + (isLastSc ? sideExtraW : 0),
          h: sideItemH + (isLastSr ? sideExtraH : 0),
          fitMode: resolvedFitMode,
        });
      });
    }

  // ── Masonry ────────────────────────────────────────────────────────────────
  } else if (effectiveStyle === "Masonry") {
    const cols = Math.min(4, Math.ceil(Math.sqrt(n)));
    const colW = Math.floor((sw - gap * (cols - 1)) / cols);
    // Track running pixel x for each column to avoid float drift
    const colXs = Array.from({ length: cols }, (_, i) => ox + i * (colW + gap));
    const colHeights = new Array(cols).fill(oy);

    images.forEach((img) => {
      const minH = Math.min(...colHeights);
      const minCol = colHeights.indexOf(minH);
      const ar = img.width / img.height;
      const h = Math.round(colW / ar);   // natural height for this column width
      cells.push({
        img,
        x: colXs[minCol],
        y: colHeights[minCol],
        w: colW,
        h,
        fitMode: "contain",   // masonry always contain — natural AR
      });
      colHeights[minCol] += h + gap;
    });

  // ── Floating Cards ─────────────────────────────────────────────────────────
  } else if (effectiveStyle === "Floating Cards") {
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    // Floating cards ALWAYS use at least 10px gap so rotation has breathing room
    const cardGap = Math.max(gap, 10);
    const cardW = Math.floor((sw - cardGap * (cols - 1)) / cols);
    const cardH = Math.floor((sh - cardGap * (rows - 1)) / rows);
    // Max rotation that still keeps the rotated card fully inside its slot
    const diagonal = Math.sqrt(cardW * cardW + cardH * cardH);
    const maxRot = Math.min(4, (Math.asin((cardGap * 0.4) / diagonal)) * (180 / Math.PI));

    images.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rot = (((i * 7) % 11) - 5) / 5 * maxRot;
      cells.push({
        img,
        x: ox + col * (cardW + cardGap),
        y: oy + row * (cardH + cardGap),
        w: cardW,
        h: cardH,
        rotate: rot,
        fitMode: resolvedFitMode,
      });
    });

  // ── Polaroid ───────────────────────────────────────────────────────────────
  } else if (effectiveStyle === "Polaroid") {
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cardGap = Math.max(gap, 8);
    const cardW = Math.floor((sw - cardGap * (cols - 1)) / cols);
    const cardH = Math.floor((sh - cardGap * (rows - 1)) / rows);
    const polPad = Math.max(4, Math.round(cardW * 0.05));
    const captionH = Math.round(polPad * 2.5);
    const imgW = cardW - polPad * 2;
    const imgH = cardH - polPad - captionH;
    const maxRot = 3;

    images.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rot = (((i * 11) % 9) - 4) / 4 * maxRot;
      const cx = ox + col * (cardW + cardGap);
      const cy = oy + row * (cardH + cardGap);
      cells.push({
        img,
        x: cx + polPad,
        y: cy + polPad,
        w: imgW,
        h: imgH,
        rotate: rot,
        polaroid: { x: cx, y: cy, w: cardW, h: cardH },
        fitMode: "contain",   // always show full poster inside polaroid frame
      });
    });

  // ── Dynamic ────────────────────────────────────────────────────────────────
  } else if (effectiveStyle === "Dynamic") {
    const isLandscape = canvasW >= canvasH;
    if (isLandscape) {
      const imgsPerRow = 3;
      const numRows = Math.ceil(n / imgsPerRow);
      // Equal integer row heights; distribute remainder to final row
      const totalVGap = gap * (numRows - 1);
      const availH2 = sh - totalVGap;
      const baseStripH = Math.floor(availH2 / numRows);
      const remStripH  = availH2 - baseStripH * numRows;
      // distribute remainder 1px-per-row from top (max 1px difference)
      const stripHeights = Array.from({ length: numRows }, (_, r) => baseStripH + (r < remStripH ? 1 : 0));
      const stripYs = [];
      let ys = oy;
      for (let r = 0; r < numRows; r++) { stripYs.push(ys); ys += stripHeights[r] + gap; }

      for (let row = 0; row < numRows; row++) {
        const stripH = stripHeights[row];
        const y = stripYs[row];
        const rowImgs = images.slice(row * imgsPerRow, row * imgsPerRow + imgsPerRow);
        const k = rowImgs.length;

        // Normalised width shares that always sum exactly to 1.0
        let rawShares;
        if (k === 1) {
          rawShares = [1];
        } else if (k === 2) {
          rawShares = row % 2 === 0 ? [0.6, 0.4] : [0.4, 0.6];
        } else {
          rawShares = row % 2 === 0 ? [0.5, 0.25, 0.25] : [0.25, 0.5, 0.25];
        }

        // Integer widths that tile exactly to sw with no leftover px
        const totalHGap = gap * (k - 1);
        const availW = sw - totalHGap;
        const widths = rawShares.map((s) => Math.floor(s * availW));
        const wSum = widths.reduce((a, b) => a + b, 0);
        widths[widths.length - 1] += availW - wSum;  // last cell absorbs rounding

        // Build x positions by accumulation — guarantees exact edge sharing
        let x = ox;
        rowImgs.forEach((img, ci) => {
          cells.push({ img, x, y, w: widths[ci], h: stripH, fitMode: resolvedFitMode });
          x += widths[ci] + gap;
        });
      }
    } else {
      // Portrait canvas: 2 equal columns
      const cols = 2;
      const numRows = Math.ceil(n / cols);
      const totalHGap = gap;
      const cellW = Math.floor((sw - totalHGap) / cols);
      const extraW = sw - totalHGap - cellW * cols;
      const totalVGap = gap * (numRows - 1);
      const cellH = Math.floor((sh - totalVGap) / numRows);
      const extraH = sh - totalVGap - cellH * numRows;

      images.forEach((img, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const isLastCol = col === cols - 1;
        const isLastRow = row === numRows - 1;
        cells.push({
          img,
          x: ox + col * (cellW + gap),
          y: oy + row * (cellH + gap),
          w: cellW + (isLastCol ? extraW : 0),
          h: cellH + (isLastRow ? extraH : 0),
          fitMode: resolvedFitMode,
        });
      });
    }
  }

  return cells;
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
function renderBanner(canvas, cells, cfg) {
  const ctx = canvas.getContext("2d");
  const { bgColor, radius, shadow, border, borderWidth, borderColor, scale = 1 } = cfg;
  const W = canvas.width;
  const H = canvas.height;

  // Background
  if (bgColor === "transparent") {
    ctx.clearRect(0, 0, W, H);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
  }

  // Shadow params
  const shadowMap = {
    None:   { blur: 0,          offset: 0,         alpha: 0    },
    Soft:   { blur: 12 * scale, offset: 4 * scale,  alpha: 0.25 },
    Medium: { blur: 20 * scale, offset: 8 * scale,  alpha: 0.4  },
    Strong: { blur: 32 * scale, offset: 16 * scale, alpha: 0.6  },
  };
  const sdw = shadowMap[shadow] || shadowMap.None;

  // Draw each cell — synchronous, but images are pre-scaled so this is fast
  const drawCell = (cell) => {
    if (!cell.img || !cell.img.element) return;
    const { x, y, w, h, rotate, polaroid } = cell;
    const cellFitMode = cell.fitMode || "contain";

    ctx.save();

    if (rotate) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    // ── Polaroid background ────────────────────────────────────────────────
    if (polaroid) {
      if (sdw.blur > 0) {
        ctx.shadowBlur = sdw.blur;
        ctx.shadowOffsetY = sdw.offset;
        ctx.shadowColor = `rgba(0,0,0,${sdw.alpha})`;
      }
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      roundRect(ctx, polaroid.x, polaroid.y, polaroid.w, polaroid.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }

    // ── Shadow for regular cells ───────────────────────────────────────────
    if (!polaroid && sdw.blur > 0) {
      ctx.shadowBlur = sdw.blur;
      ctx.shadowOffsetY = sdw.offset;
      ctx.shadowColor = `rgba(0,0,0,${sdw.alpha})`;
    }

    // ── Clip to cell bounds ────────────────────────────────────────────────
    ctx.beginPath();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // ── Fill background behind poster (visible when contain + AR mismatch) ─
    if (cellFitMode === "contain" && bgColor && bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
    }

    // ── Draw image ─────────────────────────────────────────────────────────
    const imgEl = cell.img.element;
    if (cellFitMode === "cover") {
      drawImageCover(ctx, imgEl, x, y, w, h);
    } else {
      drawImageContain(ctx, imgEl, x, y, w, h);
    }

    ctx.restore();

    // ── Border ────────────────────────────────────────────────────────────
    if (border && borderWidth > 0) {
      ctx.save();
      if (rotate) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.translate(-(x + w / 2), -(y + h / 2));
      }
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      roundRect(ctx, x, y, w, h, radius);
      ctx.stroke();
      ctx.restore();
    }
  };

  cells.forEach(drawCell);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BannerCollageGenerator() {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(400);
  const [layout, setLayout] = useState("Auto");
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [customBg, setCustomBg] = useState("#1a1a2e");
  const [gap, setGap] = useState(0);
  const [outerPadding, setOuterPadding] = useState(0);
  const [cornerRadius, setCornerRadius] = useState(8);
  const [shadow, setShadow] = useState("Soft");
  const [border, setBorder] = useState(false);
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [showLogo, setShowLogo] = useState(false);
  const [logoText, setLogoText] = useState("JD STORE");
  const [logoPos, setLogoPos] = useState("Bottom Right");
  const [logoSize, setLogoSize] = useState(28);
  const [logoOpacity, setLogoOpacity] = useState(85);
  const [showHeading, setShowHeading] = useState(false);
  const [heading, setHeading] = useState("Premium Collection");
  const [subheading, setSubheading] = useState("Exclusive styles, delivered.");
  const [headingColor, setHeadingColor] = useState("#ffffff");
  const [headingSize, setHeadingSize] = useState(48);
  const [headingFont, setHeadingFont] = useState("Inter");
  const [headingWeight, setHeadingWeight] = useState("700");
  const [fitMode, setFitMode] = useState("contain");  // "contain" | "cover"
  const [zoom, setZoom] = useState(100);
  const [generated, setGenerated] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlFormat, setDlFormat] = useState("PNG");
  const [dlQuality, setDlQuality] = useState(100);
  const [dlScale, setDlScale] = useState(1);
  const [dlName, setDlName] = useState("jdstore-banner");
  const [activeTab, setActiveTab] = useState("canvas");
  const [notification, setNotification] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const cellsRef = useRef([]);

  const canvasW = preset.id === "custom" ? customW : preset.w;
  const canvasH = preset.id === "custom" ? customH : preset.h;
  const bgColor = bg.id === "custom" ? customBg : bg.value;

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Load image element ───────────────────────────────────────────────────
  // Pre-downscale large images to a working copy (max 2400px longest side).
  // This keeps drawImage fast in the canvas loop — prevents the sandbox
  // "loop ran longer than 400ms" error when users upload high-res posters.
  // The original aspect ratio is always preserved exactly.
  const loadImageElement = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const MAX = 2400;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // If within limit, use the image element directly
        if (iw <= MAX && ih <= MAX) {
          resolve({ element: img, url, width: iw, height: ih });
          return;
        }

        // Downscale into an offscreen canvas, preserving aspect ratio
        const scale = MAX / Math.max(iw, ih);
        const dw = Math.round(iw * scale);
        const dh = Math.round(ih * scale);
        const oc = document.createElement("canvas");
        oc.width = dw;
        oc.height = dh;
        const octx = oc.getContext("2d");
        octx.drawImage(img, 0, 0, dw, dh);

        // Convert to a new Image element so drawImage works uniformly
        const scaled = new Image();
        scaled.onload = () => resolve({ element: scaled, url, width: dw, height: dh });
        scaled.onerror = reject;
        scaled.src = oc.toDataURL("image/webp", 0.92);
      };
      img.onerror = reject;
      img.src = url;
    });

  // ─── Handle file upload ───────────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name) && f.size <= 20 * 1024 * 1024);
    if (valid.length === 0) { notify("No valid images found (PNG/JPG/WEBP, max 20MB)", "error"); return; }
    const remaining = 30 - images.length;
    const toLoad = valid.slice(0, remaining);
    const loaded = await Promise.all(toLoad.map(async (f) => {
      try {
        const data = await loadImageElement(f);
        return { id: Date.now() + Math.random(), file: f, name: f.name, ...data };
      } catch { return null; }
    }));
    const ok = loaded.filter(Boolean);
    setImages((prev) => [...prev, ...ok]);
    setGenerated(false);
    if (ok.length) notify(`${ok.length} image${ok.length > 1 ? "s" : ""} added`);
  }, [images.length]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const removeImage = (id) => { setImages((p) => p.filter((i) => i.id !== id)); setGenerated(false); };

  // ─── Generate banner ──────────────────────────────────────────────────────
  // Uses requestAnimationFrame to schedule canvas work outside the React
  // event handler — this prevents sandbox "loop > 400ms" false positives
  // when rendering many large-image cells.
  const generate = useCallback(() => {
    if (images.length < 2) { notify("Upload at least 2 images first", "error"); return; }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture all values needed for rendering before the rAF callback
    const renderCfg = {
      canvasW, canvasH, layout, gap, outerPadding, cornerRadius, shadow,
      bgColor, border, borderWidth, borderColor, fitMode,
      showHeading, heading, subheading, headingColor, headingSize,
      headingFont, headingWeight, showLogo, logoText, logoPos, logoSize, logoOpacity,
      images: [...images],
    };

    requestAnimationFrame(() => {
      // Setting width/height also clears the canvas
      canvas.width = renderCfg.canvasW;
      canvas.height = renderCfg.canvasH;

      const cells = computeLayout(
        renderCfg.images, renderCfg.canvasW, renderCfg.canvasH,
        renderCfg.layout, renderCfg.gap, renderCfg.outerPadding,
        renderCfg.cornerRadius, renderCfg.shadow, renderCfg.fitMode
      );
      cellsRef.current = cells;

      renderBanner(canvas, cells, {
        bgColor: renderCfg.bgColor, radius: renderCfg.cornerRadius,
        shadow: renderCfg.shadow, border: renderCfg.border,
        borderWidth: renderCfg.borderWidth, borderColor: renderCfg.borderColor,
      });

      // Overlay text
      const ctx = canvas.getContext("2d");
      if (renderCfg.showHeading && renderCfg.heading) {
        ctx.save();
        ctx.font = `${renderCfg.headingWeight} ${renderCfg.headingSize}px "${renderCfg.headingFont}", sans-serif`;
        ctx.fillStyle = renderCfg.headingColor;
        ctx.textAlign = "center";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.fillText(renderCfg.heading, renderCfg.canvasW / 2, renderCfg.canvasH / 2 - (renderCfg.subheading ? renderCfg.headingSize / 2 : 0));
        if (renderCfg.subheading) {
          ctx.font = `400 ${Math.round(renderCfg.headingSize * 0.45)}px "${renderCfg.headingFont}", sans-serif`;
          ctx.fillStyle = renderCfg.headingColor + "cc";
          ctx.fillText(renderCfg.subheading, renderCfg.canvasW / 2, renderCfg.canvasH / 2 + renderCfg.headingSize * 0.6);
        }
        ctx.restore();
      }
      if (renderCfg.showLogo && renderCfg.logoText) {
        ctx.save();
        ctx.globalAlpha = renderCfg.logoOpacity / 100;
        ctx.font = `700 ${renderCfg.logoSize}px "Inter", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        const lp = 24;
        let lx, ly;
        if (renderCfg.logoPos === "Top Left")          { lx = lp;                       ctx.textAlign = "left";   ly = lp + renderCfg.logoSize; }
        else if (renderCfg.logoPos === "Top Right")    { lx = renderCfg.canvasW - lp;   ctx.textAlign = "right";  ly = lp + renderCfg.logoSize; }
        else if (renderCfg.logoPos === "Bottom Left")  { lx = lp;                       ctx.textAlign = "left";   ly = renderCfg.canvasH - lp; }
        else if (renderCfg.logoPos === "Bottom Right") { lx = renderCfg.canvasW - lp;   ctx.textAlign = "right";  ly = renderCfg.canvasH - lp; }
        else                                           { lx = renderCfg.canvasW / 2;    ctx.textAlign = "center"; ly = renderCfg.canvasH / 2; }
        ctx.fillText(renderCfg.logoText, lx, ly);
        ctx.restore();
      }

      setGenerated(true);
      notify("Banner generated!");
    });
  }, [images, canvasW, canvasH, layout, gap, outerPadding, fitMode, cornerRadius, shadow, bgColor, border, borderWidth, borderColor, showHeading, heading, subheading, headingColor, headingSize, headingFont, headingWeight, showLogo, logoText, logoPos, logoSize, logoOpacity]);

  // ─── Download ─────────────────────────────────────────────────────────────
  const download = useCallback(async () => {
    if (!generated) { notify("Generate the banner first", "error"); return; }
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvasW * dlScale;
      canvas.height = canvasH * dlScale;

      const ctx = canvas.getContext("2d");
      ctx.scale(dlScale, dlScale);

      const cells = computeLayout(images, canvasW, canvasH, layout, gap, outerPadding, cornerRadius, shadow, fitMode);
      renderBanner(canvas, cells, { bgColor, radius: cornerRadius, shadow, border, borderWidth, borderColor, scale: dlScale });

      if (showHeading && heading) {
        ctx.save();
        ctx.font = `${headingWeight} ${headingSize}px "${headingFont}", sans-serif`;
        ctx.fillStyle = headingColor;
        ctx.textAlign = "center";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.fillText(heading, canvasW / 2, canvasH / 2 - (subheading ? headingSize / 2 : 0));
        if (subheading) {
          ctx.font = `400 ${Math.round(headingSize * 0.45)}px "${headingFont}", sans-serif`;
          ctx.fillStyle = headingColor + "cc";
          ctx.fillText(subheading, canvasW / 2, canvasH / 2 + headingSize * 0.6);
        }
        ctx.restore();
      }
      if (showLogo && logoText) {
        ctx.save();
        ctx.globalAlpha = logoOpacity / 100;
        ctx.font = `700 ${logoSize}px "Inter", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(0,0,0,0.7)";
        const pad = 24;
        let lx, ly;
        if (logoPos === "Top Left") { lx = pad; ctx.textAlign = "left"; ly = pad + logoSize; }
        else if (logoPos === "Top Right") { lx = canvasW - pad; ctx.textAlign = "right"; ly = pad + logoSize; }
        else if (logoPos === "Bottom Left") { lx = pad; ctx.textAlign = "left"; ly = canvasH - pad; }
        else if (logoPos === "Bottom Right") { lx = canvasW - pad; ctx.textAlign = "right"; ly = canvasH - pad; }
        else { lx = canvasW / 2; ctx.textAlign = "center"; ly = canvasH / 2; }
        ctx.fillText(logoText, lx, ly);
        ctx.restore();
      }

      const mimeMap = { PNG: "image/png", JPG: "image/jpeg", WEBP: "image/webp" };
      const mime = mimeMap[dlFormat] || "image/png";
      const q = dlFormat === "PNG" ? 1 : dlQuality / 100;
      const dataUrl = canvas.toDataURL(mime, q);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${dlName || "banner"}.${dlFormat.toLowerCase()}`;
      a.click();
      notify("Download started!");
    } catch (e) {
      notify("Download failed: " + e.message, "error");
    }
    setDownloading(false);
  }, [generated, canvasW, canvasH, images, layout, gap, outerPadding, fitMode, cornerRadius, shadow, bgColor, border, borderWidth, borderColor, showHeading, heading, subheading, headingColor, headingSize, headingFont, headingWeight, showLogo, logoText, logoPos, logoSize, logoOpacity, dlFormat, dlQuality, dlScale, dlName]);

  // ─── Zoom controls ────────────────────────────────────────────────────────
  const fitZoom = () => {
    const container = previewRef.current;
    if (!container) return;
    const cw = container.clientWidth - 40;
    const ch = container.clientHeight - 40;
    const zw = Math.round((cw / canvasW) * 100);
    const zh = Math.round((ch / canvasH) * 100);
    setZoom(Math.min(zw, zh, 100));
  };

  useEffect(() => { fitZoom(); }, [canvasW, canvasH]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); download(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generate, download]);

  const previewScale = zoom / 100;

  return (
    <div style={{ height: "100%", background: "#0c0c0f", color: "#e8e8e8", fontFamily: "'Inter', -apple-system, sans-serif", display: "flex", flexDirection: "column", borderRadius: "12px", overflow: "hidden" }}>
      {/* ── Notification ── */}
      {notification && (
        <div style={{ position: "absolute", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: notification.type === "error" ? "#7f1d1d" : "#14532d", color: notification.type === "error" ? "#fca5a5" : "#86efac", fontWeight: 500, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s" }}>
          {notification.type === "error" ? "⚠" : "✓"} {notification.msg}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── Left Sidebar: Controls ── */}
        <aside style={{ width: 300, background: "#0f0f17", borderRight: "1px solid #1e1e2e", display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* ── Upload Section (always visible) ── */}
          <UploadSection
            images={images}
            isDragging={isDragging}
            dragOver={dragOver}
            fileInputRef={fileInputRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onFilesChange={handleFiles}
            onRemove={removeImage}
            onReorder={(fromIdx, toIdx) => {
              setImages((prev) => {
                const arr = [...prev];
                const [moved] = arr.splice(fromIdx, 1);
                arr.splice(toIdx, 0, moved);
                return arr;
              });
              setDragOver(null);
              setGenerated(false);
            }}
            setDragOver={setDragOver}
          />

          {/* Tab navigation */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e1e2e", borderTop: "1px solid #1e1e2e" }}>
            {[["canvas", "Canvas"], ["style", "Style"], ["brand", "Brand"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: activeTab === id ? "#a78bfa" : "#6b6b8a", fontSize: 12, fontWeight: activeTab === id ? 600 : 400, cursor: "pointer", borderBottom: activeTab === id ? "2px solid #7c3aed" : "2px solid transparent", transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>
            {activeTab === "canvas" && (
              <>
                {/* Preset */}
                <Section label="Canvas Size">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {PRESETS.map((p) => (
                      <button key={p.id} onClick={() => setPreset(p)} style={{ padding: "8px 6px", borderRadius: 8, border: `1px solid ${preset.id === p.id ? "#7c3aed" : "#1e1e2e"}`, background: preset.id === p.id ? "#1e1232" : "#13131d", color: preset.id === p.id ? "#a78bfa" : "#9ca3af", fontSize: 11, cursor: "pointer", textAlign: "left", lineHeight: 1.3, transition: "all 0.2s" }}>
                        <span style={{ display: "block", marginBottom: 2 }}>{p.icon} {p.label}</span>
                        <span style={{ color: "#4a4a6a", fontSize: 10 }}>{p.w}×{p.h}</span>
                      </button>
                    ))}
                  </div>
                  {preset.id === "custom" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Label>Width</Label>
                        <input type="number" value={customW} onChange={(e) => setCustomW(+e.target.value)} style={inputStyle} min={100} max={8000} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Label>Height</Label>
                        <input type="number" value={customH} onChange={(e) => setCustomH(+e.target.value)} style={inputStyle} min={100} max={8000} />
                      </div>
                    </div>
                  )}
                </Section>

                {/* Layout */}
                <Section label="Layout Style">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {LAYOUTS.map((l) => (
                      <button key={l} onClick={() => setLayout(l)} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${layout === l ? "#7c3aed" : "#1e1e2e"}`, background: layout === l ? "#1e1232" : "#13131d", color: layout === l ? "#a78bfa" : "#9ca3af", fontSize: 11, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Spacing */}
                <Section label="Spacing">
                  <SliderRow label="Gap between posters" value={gap} min={0} max={50} onChange={setGap} unit="px" />
                  <SliderRow label="Outer padding" value={outerPadding} min={0} max={80} onChange={setOuterPadding} unit="px" />
                </Section>

                <Section label="Image Fit">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[["contain", "Fit (no crop)"], ["cover", "Fill (crop)"]].map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => setFitMode(mode)}
                        style={{
                          padding: "8px 6px",
                          borderRadius: 8,
                          border: `1px solid ${fitMode === mode ? "#7c3aed" : "#1e1e2e"}`,
                          background: fitMode === mode ? "#1e1232" : "#13131d",
                          color: fitMode === mode ? "#a78bfa" : "#9ca3af",
                          fontSize: 11,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: "#4a4a6a", margin: "6px 0 0" }}>
                    Fit = full poster visible. Fill = crop to fill cell.
                  </p>
                </Section>
              </>
            )}

            {activeTab === "style" && (
              <>
                <Section label="Background">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {BACKGROUNDS.map((b) => (
                      <button key={b.id} onClick={() => setBg(b)} title={b.label} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${bg.id === b.id ? "#7c3aed" : "#2a2a3a"}`, cursor: "pointer", background: b.value === "transparent" ? "repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 0 0 / 10px 10px" : b.value, position: "relative" }}>
                        {b.id === "custom" && <span style={{ fontSize: 10, color: bg.id === "custom" ? "#a78bfa" : "#666" }}>✏</span>}
                      </button>
                    ))}
                  </div>
                  {bg.id === "custom" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      <input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid #2a2a3a", cursor: "pointer", background: "none", padding: 2 }} />
                      <input type="text" value={customBg} onChange={(e) => setCustomBg(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  )}
                </Section>

                <Section label="Corners & Shadow">
                  <SliderRow label="Corner radius" value={cornerRadius} min={0} max={40} onChange={setCornerRadius} unit="px" />
                  <div style={{ marginTop: 12 }}>
                    <Label>Shadow</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                      {SHADOWS.map((s) => (
                        <button key={s} onClick={() => setShadow(s)} style={{ padding: "6px 2px", borderRadius: 6, border: `1px solid ${shadow === s ? "#7c3aed" : "#1e1e2e"}`, background: shadow === s ? "#1e1232" : "#13131d", color: shadow === s ? "#a78bfa" : "#6b6b8a", fontSize: 10, cursor: "pointer" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section label="Border">
                  <Toggle label="Show border" value={border} onChange={setBorder} />
                  {border && (
                    <>
                      <SliderRow label="Width" value={borderWidth} min={1} max={8} onChange={setBorderWidth} unit="px" />
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <Label>Color</Label>
                        <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #2a2a3a", cursor: "pointer", background: "none", padding: 2 }} />
                        <input type="text" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      </div>
                    </>
                  )}
                </Section>
              </>
            )}

            {activeTab === "brand" && (
              <>
                <Section label="Logo / Watermark">
                  <Toggle label="Show logo" value={showLogo} onChange={setShowLogo} />
                  {showLogo && (
                    <>
                      <div style={{ marginTop: 8 }}>
                        <Label>Text</Label>
                        <input value={logoText} onChange={(e) => setLogoText(e.target.value)} style={inputStyle} placeholder="JD STORE" />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Label>Position</Label>
                        <select value={logoPos} onChange={(e) => setLogoPos(e.target.value)} style={selectStyle}>
                          {LOGO_POSITIONS.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <SliderRow label="Size" value={logoSize} min={12} max={80} onChange={setLogoSize} unit="px" />
                      <SliderRow label="Opacity" value={logoOpacity} min={0} max={100} onChange={setLogoOpacity} unit="%" />
                    </>
                  )}
                </Section>

                <Section label="Text Overlay">
                  <Toggle label="Show heading" value={showHeading} onChange={setShowHeading} />
                  {showHeading && (
                    <>
                      <div style={{ marginTop: 8 }}>
                        <Label>Heading</Label>
                        <input value={heading} onChange={(e) => setHeading(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Label>Subheading</Label>
                        <input value={subheading} onChange={(e) => setSubheading(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Label>Font</Label>
                        <select value={headingFont} onChange={(e) => setHeadingFont(e.target.value)} style={selectStyle}>
                          {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Label>Weight</Label>
                          <select value={headingWeight} onChange={(e) => setHeadingWeight(e.target.value)} style={selectStyle}>
                            {FONT_WEIGHTS.map((w) => <option key={w}>{w}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Label>Color</Label>
                          <div style={{ display: "flex", gap: 4 }}>
                            <input type="color" value={headingColor} onChange={(e) => setHeadingColor(e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid #2a2a3a", cursor: "pointer", padding: 2 }} />
                          </div>
                        </div>
                      </div>
                      <SliderRow label="Size" value={headingSize} min={16} max={120} onChange={setHeadingSize} unit="px" />
                    </>
                  )}
                </Section>
              </>
            )}
          </div>
        </aside>

        {/* ── Center: Preview ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#080810" }}>
          {/* Preview Canvas */}
          <div ref={previewRef} style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {!generated && (
              <div style={{ textAlign: "center", color: "#4a4a6a" }}>
                <p style={{ fontSize: 48, margin: "0 0 12px" }}>⬡</p>
                {images.length < 2 ? (
                  <>
                    <p style={{ fontSize: 16, fontWeight: 500, color: "#6b6b8a", margin: "0 0 8px" }}>No banner yet</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Upload 2–30 poster images to generate your banner.</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 16, fontWeight: 500, color: "#6b6b8a", margin: "0 0 8px" }}>Ready to generate</p>
                    <p style={{ fontSize: 13, margin: 0 }}>{images.length} image{images.length > 1 ? "s" : ""} loaded · {preset.label} · {layout}</p>
                  </>
                )}
              </div>
            )}
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: "center center", transition: "transform 0.2s", lineHeight: 0, boxShadow: generated ? "0 20px 60px rgba(0,0,0,0.8)" : "none", borderRadius: cornerRadius, display: generated ? "block" : "none" }}>
              <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
            </div>
          </div>

          {/* Zoom bar */}
          <div style={{ height: 44, borderTop: "1px solid #1e1e2e", display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
            <button onClick={() => setZoom(Math.max(10, zoom - 10))} style={iconBtnStyle}>−</button>
            <input type="range" min={10} max={200} step={5} value={zoom} onChange={(e) => setZoom(+e.target.value)} style={{ width: 120 }} />
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} style={iconBtnStyle}>+</button>
            <span style={{ fontSize: 12, color: "#6b6b8a", minWidth: 40 }}>{zoom}%</span>
            <button onClick={fitZoom} style={{ ...iconBtnStyle, fontSize: 11, padding: "4px 8px", width: "auto" }}>Fit</button>
            <button onClick={() => setZoom(100)} style={{ ...iconBtnStyle, fontSize: 11, padding: "4px 8px", width: "auto" }}>100%</button>
          </div>
        </main>

        {/* ── Right Sidebar: Generate + Download ── */}
        <aside style={{ width: 220, background: "#0f0f17", borderLeft: "1px solid #1e1e2e", display: "flex", flexDirection: "column", padding: 16, gap: 16 }}>
          {/* Generate */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Generate</p>
            <button onClick={generate} disabled={images.length < 2} style={{ padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: images.length < 2 ? "not-allowed" : "pointer", opacity: images.length < 2 ? 0.5 : 1, letterSpacing: "-0.01em", transition: "all 0.2s" }}>
              Generate Banner
            </button>
            <p style={{ fontSize: 11, color: "#4a4a6a", margin: 0, textAlign: "center" }}>{canvasW} × {canvasH} px</p>
          </div>

          <div style={{ height: 1, background: "#1e1e2e" }} />

          {/* Download settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Export</p>

            <div>
              <Label>Format</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                {["PNG", "JPG", "WEBP"].map((f) => (
                  <button key={f} onClick={() => setDlFormat(f)} style={{ padding: "6px 2px", borderRadius: 6, border: `1px solid ${dlFormat === f ? "#7c3aed" : "#1e1e2e"}`, background: dlFormat === f ? "#1e1232" : "#13131d", color: dlFormat === f ? "#a78bfa" : "#6b6b8a", fontSize: 11, cursor: "pointer" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {dlFormat !== "PNG" && (
              <SliderRow label="Quality" value={dlQuality} min={50} max={100} onChange={setDlQuality} unit="%" />
            )}

            <div>
              <Label>Resolution</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                {[[1, "1×"], [2, "2×"], [4, "4×"]].map(([s, l]) => (
                  <button key={s} onClick={() => setDlScale(s)} style={{ padding: "6px 2px", borderRadius: 6, border: `1px solid ${dlScale === s ? "#7c3aed" : "#1e1e2e"}`, background: dlScale === s ? "#1e1232" : "#13131d", color: dlScale === s ? "#a78bfa" : "#6b6b8a", fontSize: 11, cursor: "pointer" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Filename</Label>
              <input value={dlName} onChange={(e) => setDlName(e.target.value)} style={inputStyle} placeholder="jdstore-banner" />
            </div>

            <button onClick={download} disabled={!generated || downloading} style={{ padding: "12px 0", borderRadius: 10, background: generated ? "#14532d" : "#13131d", border: `1px solid ${generated ? "#166534" : "#1e1e2e"}`, color: generated ? "#86efac" : "#4a4a6a", fontWeight: 600, fontSize: 14, cursor: generated ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              {downloading ? "Downloading…" : `Download ${dlFormat}`}
            </button>
            {generated && (
              <p style={{ fontSize: 11, color: "#4a4a6a", margin: 0, textAlign: "center" }}>
                {canvasW * dlScale} × {canvasH * dlScale} px
              </p>
            )}
          </div>

          <div style={{ height: 1, background: "#1e1e2e" }} />

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Info</p>
            {[["Images", images.length], ["Layout", layout], ["Canvas", `${canvasW}×${canvasH}`], ["Gap", `${gap}px`], ["Padding", `${outerPadding}px`], ["Fit", fitMode], ["Radius", `${cornerRadius}px`], ["Shadow", shadow]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#4a4a6a" }}>{k}</span>
                <span style={{ color: "#9ca3af", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Upload Section Component ─────────────────────────────────────────────────
function UploadSection({ images, isDragging, dragOver, fileInputRef, onDrop, onDragOver, onDragLeave, onFilesChange, onRemove, onReorder, setDragOver }) {
  const [thumbDragIdx, setThumbDragIdx] = useState(null);

  const dropZoneStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    border: `2px dashed ${isDragging ? "#7c3aed" : "#2a2a3a"}`,
    borderRadius: 10,
    padding: "14px 10px",
    background: isDragging ? "#13103a" : "transparent",
    transition: "all 0.25s",
    textAlign: "center",
  };

  return (
    <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Upload Images</p>
        <span style={{ fontSize: 11, color: images.length >= 2 ? "#a78bfa" : "#4a4a6a" }}>{images.length}/30</span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={dropZoneStyle}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e1232", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬆</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#c4b5fd" }}>
            {isDragging ? "Release to upload" : "Drop or click to upload"}
          </p>
          <p style={{ fontSize: 11, color: "#4a4a6a", margin: 0 }}>JPG · PNG · WEBP · up to 30 images</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => onFilesChange(e.target.files)}
        />
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <p style={{ fontSize: 12, color: "#4a4a6a", margin: 0, textAlign: "center", padding: "6px 0 4px" }}>
          Upload 2–30 poster images to generate your banner.
        </p>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("uploadIdx", idx); setThumbDragIdx(idx); }}
              onDragEnd={() => { setThumbDragIdx(null); setDragOver(null); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
              onDrop={(e) => {
                e.preventDefault();
                const fromIdx = +e.dataTransfer.getData("uploadIdx");
                if (fromIdx !== idx) onReorder(fromIdx, idx);
                setThumbDragIdx(null);
              }}
              style={{
                position: "relative",
                borderRadius: 7,
                overflow: "hidden",
                border: `1px solid ${dragOver === idx ? "#7c3aed" : "#2a2a3a"}`,
                cursor: "grab",
                background: "#13131d",
                opacity: thumbDragIdx === idx ? 0.45 : 1,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              {/* Thumbnail image */}
              <div style={{ position: "relative", width: "100%", paddingBottom: "75%", overflow: "hidden" }}>
                <img
                  src={img.url}
                  alt={img.name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                  style={{
                    position: "absolute", top: 3, right: 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "rgba(0,0,0,0.75)", border: "none",
                    color: "#fff", cursor: "pointer", fontSize: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1, zIndex: 2,
                  }}
                >×</button>
                {/* Index badge */}
                <div style={{ position: "absolute", bottom: 3, left: 3, fontSize: 9, color: "#fff", background: "rgba(0,0,0,0.65)", padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>
                  {idx + 1}
                </div>
              </div>

              {/* File info */}
              <div style={{ padding: "4px 5px 5px" }}>
                <p style={{ fontSize: 9, color: "#6b6b8a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={img.name}>
                  {img.name}
                </p>
                <p style={{ fontSize: 9, color: "#4a4a6a", margin: "1px 0 0" }}>
                  {img.width}×{img.height}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hint when 1 image uploaded */}
      {images.length === 1 && (
        <p style={{ fontSize: 11, color: "#6b3aed", margin: 0, textAlign: "center", padding: "2px 0 6px" }}>
          Add 1 more image to enable Generate.
        </p>
      )}

      <div style={{ height: 1, background: "#1e1e2e", marginTop: 4 }} />
    </div>
  );
}

// ─── Small Components ─────────────────────────────────────────────────────────
const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #2a2a3a", background: "#13131d", color: "#e8e8e8", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle = { ...inputStyle, cursor: "pointer" };
const iconBtnStyle = { width: 28, height: 28, borderRadius: 6, border: "1px solid #2a2a3a", background: "#13131d", color: "#9ca3af", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" };

function Section({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>{label}</p>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <p style={{ fontSize: 11, color: "#6b6b8a", margin: "0 0 5px" }}>{children}</p>;
}

function SliderRow({ label, value, min, max, onChange, unit }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Label>{label}</Label>
        <span style={{ fontSize: 11, color: "#a78bfa" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", accentColor: "#7c3aed" }} />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: "#9ca3af" }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: value ? "#7c3aed" : "#2a2a3a", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}
