export type TargetOS = "windows" | "mac" | "linux" | "all";
export type IconSize = 32 | 64 | 256 | 512;
export type Step = "upload" | "editor" | "results";
export type Shape = "square" | "rounded" | "circle";

// ---- Constantes ----

export const PLATFORMS = [
  { id: "windows" as TargetOS, label: "Windows (.ico)" },
  { id: "mac" as TargetOS, label: "Mac (.icns)" },
  { id: "linux" as TargetOS, label: "Linux (.png)" },
  { id: "all" as TargetOS, label: "Todos" },
] as const;

export const SIZES: IconSize[] = [32, 64, 256, 512];

export const PRESET_COLORS: string[] = [
  "#FFFFFF",
  "#000000",
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#EAB308",
  "#9333EA",
];

export interface ResultIcon {
  os: string;
  format: string;
  url: string;
  filename: string;
}

// ---- Algoritmos puros ----

/**
 * Recorta una imagen dado su URL y las coordenadas del área de recorte.
 * Devuelve un Blob PNG.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/png");
  });
}

/**
 * Crea un PNG final con recorte + forma + fondo + padding.
 */
export async function createFinalIconBlob(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  size: number,
  bgShape: Shape,
  bgColor: string,
  isTransparent: boolean,
  padding: number,
): Promise<Blob> {
  const croppedBlob = await getCroppedImg(imageSrc, pixelCrop);
  const img = new Image();
  img.src = URL.createObjectURL(croppedBlob);
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  if (bgShape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else if (bgShape === "rounded") {
    const r = size * 0.22;
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, r);
    else ctx.rect(0, 0, size, size);
  } else {
    ctx.rect(0, 0, size, size);
  }
  ctx.closePath();

  if (!isTransparent) {
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  ctx.clip();

  const padPx = (padding / 100) * size;
  const innerSize = size - padPx * 2;
  ctx.drawImage(img, padPx, padPx, innerSize, innerSize);
  URL.revokeObjectURL(img.src);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas empty"));
    }, "image/png");
  });
}

/**
 * Genera un archivo .ico con un único tamaño.
 */
export async function generateIco(pngBlob: Blob, size: number): Promise<Blob> {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngSize = pngBuffer.byteLength;
  const buffer = new ArrayBuffer(22 + pngSize);
  const view = new DataView(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);

  view.setUint8(6, size === 256 ? 0 : size > 255 ? 0 : size);
  view.setUint8(7, size === 256 ? 0 : size > 255 ? 0 : size);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngSize, true);
  view.setUint32(18, 22, true);

  new Uint8Array(buffer, 22).set(new Uint8Array(pngBuffer));
  return new Blob([buffer], { type: "image/x-icon" });
}

function getIcnsMagic(size: number): string {
  if (size === 32) return "icp5";
  if (size === 64) return "icp6";
  if (size === 512) return "ic09";
  return "ic08";
}

/**
 * Genera un archivo .icns básico.
 */
export async function generateIcns(pngBlob: Blob, size: number): Promise<Blob> {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngSize = pngBuffer.byteLength;
  const buffer = new ArrayBuffer(16 + pngSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "icns");
  view.setUint32(4, 16 + pngSize, false);
  writeString(8, getIcnsMagic(size));
  view.setUint32(12, 8 + pngSize, false);

  new Uint8Array(buffer, 16).set(new Uint8Array(pngBuffer));
  return new Blob([buffer], { type: "application/x-apple-icons" });
}
