export type Step = "upload" | "processing" | "result";
export type BgMode = "transparent" | "color" | "blur";

export const PRESET_COLORS: string[] = [
  "#FFFFFF",
  "#000000",
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#EAB308",
  "#9333EA",
];

export interface BackgroundRemoverState {
  step: Step;
  isDragging: boolean;
  originalImage: string | null;
  resultImage: string | null;
  fileName: string;
  sliderPos: number;
  bgMode: BgMode;
  bgColor: string;
}

export const initialState: BackgroundRemoverState = {
  step: "upload",
  isDragging: false,
  originalImage: null,
  resultImage: null,
  fileName: "imagen",
  sliderPos: 50,
  bgMode: "transparent",
  bgColor: "#ffffff",
};

// --------------- Lógica pura (sin efectos) ---------------

/**
 * Aplica una máscara circular simulando la eliminación de fondo con IA.
 * Devuelve el dataURL PNG de la imagen resultante.
 */
export async function simulateBackgroundRemoval(
  originalUrl: string,
): Promise<string> {
  const img = new Image();
  img.src = originalUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.drawImage(img, 0, 0);

  ctx.globalCompositeOperation = "destination-in";
  const centerX = img.width / 2;
  const centerY = img.height / 2;
  const radius = Math.min(img.width, img.height) * 0.45;

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.5,
    centerX,
    centerY,
    radius,
  );
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(0.8, "rgba(0,0,0,0.8)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, img.width, img.height);

  return canvas.toDataURL("image/png");
}

/**
 * Compone la imagen recortada sobre el fondo elegido y devuelve el dataURL PNG.
 */
export async function composeWithBackground(
  resultImage: string,
  originalImage: string,
  bgMode: BgMode,
  bgColor: string,
): Promise<string> {
  const img = new Image();
  img.src = resultImage;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  if (bgMode === "color") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (bgMode === "blur") {
    const orig = new Image();
    orig.src = originalImage;
    await new Promise<void>((resolve) => {
      orig.onload = () => resolve();
    });
    ctx.filter = "blur(20px)";
    ctx.drawImage(orig, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
  }

  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}
