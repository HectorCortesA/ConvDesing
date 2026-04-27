export type Step = "upload" | "processing" | "editor" | "result";
export type BgMode = "transparent" | "color" | "blur";
export type Tool = "keep" | "remove" | "pan";

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
  isProcessing: boolean;
  aiProgress: number;
  errorMessage: string | null;

  // Tamaño real de la foto para el Canvas
  imageSize: { width: number; height: number } | null;

  tool: Tool;
  brushSize: number;
  showMask: boolean;
  zoom: number;
  pan: { x: number; y: number };
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
  isProcessing: false,
  aiProgress: 0,
  errorMessage: null,
  imageSize: null, // Inicialmente vacío
  tool: "keep",
  brushSize: 60,
  showMask: true,
  zoom: 1,
  pan: { x: 0, y: 0 },
};

export async function composeWithBackground(
  resultImage: string,
  originalImage: string,
  bgMode: BgMode,
  bgColor: string,
): Promise<string> {
  const img = new Image();
  img.src = resultImage;
  await new Promise((resolve) => {
    img.onload = resolve;
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
    await new Promise((resolve) => {
      orig.onload = resolve;
    });
    ctx.filter = "blur(20px)";
    ctx.drawImage(orig, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
  }

  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}
