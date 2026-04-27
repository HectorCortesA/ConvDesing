// ============================================================
// MODEL: PaletteExtractorModel.ts
// Responsabilidad: Tipos y algoritmos puros de extracción
//                  de colores (sin efectos, sin estado React).
// ============================================================

export type Step = "upload" | "processing" | "result";

export interface ColorInfo {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export interface PaletteExtractorState {
  step: Step;
  isDragging: boolean;
  imageSrc: string | null;
  palette: ColorInfo[];
  pickedColor: ColorInfo | null;
  isPicking: boolean;
  copiedHex: string | null;
}

export const initialState: PaletteExtractorState = {
  step: "upload",
  isDragging: false,
  imageSrc: null,
  palette: [],
  pickedColor: null,
  isPicking: false,
  copiedHex: null,
};

// --------------- Utilidades puras ---------------

export const getLuminance = (r: number, g: number, b: number): number =>
  0.299 * r + 0.587 * g + 0.114 * b;

export const rgbToHex = (r: number, g: number, b: number): string =>
  "#" +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("")
    .toUpperCase();

/**
 * Extrae una paleta de hasta 6 colores dominantes y distintos
 * a partir del dataURL de una imagen.
 */
export async function extractDominantColors(
  imageUrl: string,
): Promise<ColorInfo[]> {
  const img = new Image();
  img.src = imageUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  const MAX_DIM = 200;
  let width = img.width;
  let height = img.height;

  if (width > height && width > MAX_DIM) {
    height *= MAX_DIM / width;
    width = MAX_DIM;
  } else if (height > MAX_DIM) {
    width *= MAX_DIM / height;
    height = MAX_DIM;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const colorCounts: Record<string, number> = {};

  for (let i = 0; i < imageData.length; i += 16) {
    const r = Math.round(imageData[i] / 16) * 16;
    const g = Math.round(imageData[i + 1] / 16) * 16;
    const b = Math.round(imageData[i + 2] / 16) * 16;
    const a = imageData[i + 3];
    if (a < 128) continue;

    const rgb = `${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)}`;
    colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
  }

  const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);

  const finalPalette: ColorInfo[] = [];
  const MIN_DISTANCE = 50;

  for (const [rgbStr] of sortedColors) {
    if (finalPalette.length >= 6) break;
    const [r, g, b] = rgbStr.split(",").map(Number);

    let isDistinct = true;
    for (const existing of finalPalette) {
      const dist = Math.sqrt(
        Math.pow(r - existing.r, 2) +
          Math.pow(g - existing.g, 2) +
          Math.pow(b - existing.b, 2),
      );
      if (dist < MIN_DISTANCE) {
        isDistinct = false;
        break;
      }
    }

    if (isDistinct) {
      finalPalette.push({ r, g, b, hex: rgbToHex(r, g, b) });
    }
  }

  // Rellenar hasta 6 si hay pocos colores distintos
  if (finalPalette.length < 6) {
    for (const [rgbStr] of sortedColors) {
      if (finalPalette.length >= 6) break;
      const [r, g, b] = rgbStr.split(",").map(Number);
      const hex = rgbToHex(r, g, b);
      if (!finalPalette.some((c) => c.hex === hex)) {
        finalPalette.push({ r, g, b, hex });
      }
    }
  }

  finalPalette.sort(
    (a, b) => getLuminance(b.r, b.g, b.b) - getLuminance(a.r, a.g, a.b),
  );

  return finalPalette;
}

/**
 * Obtiene el color de un píxel dado un elemento <img> y las coordenadas
 * del evento de clic (relativas al viewport).
 */
export function pickColorFromImage(
  imgElement: HTMLImageElement,
  clientX: number,
  clientY: number,
): ColorInfo | null {
  const rect = imgElement.getBoundingClientRect();
  const scale = Math.min(
    rect.width / imgElement.naturalWidth,
    rect.height / imgElement.naturalHeight,
  );
  const renderedWidth = imgElement.naturalWidth * scale;
  const renderedHeight = imgElement.naturalHeight * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;
  const clickX = clientX - rect.left - offsetX;
  const clickY = clientY - rect.top - offsetY;

  if (
    clickX < 0 ||
    clickX > renderedWidth ||
    clickY < 0 ||
    clickY > renderedHeight
  ) {
    return null;
  }

  const realX = Math.floor(clickX / scale);
  const realY = Math.floor(clickY / scale);

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(imgElement, realX, realY, 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b, hex: rgbToHex(r, g, b) };
}
