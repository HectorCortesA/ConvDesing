// Tipos y constantes
export const FORMATS = [
  {
    id: "image/png",
    label: "PNG",
    ext: "png",
    color: "text-orange-400",
    hover: "hover:bg-orange-500/20 hover:border-orange-500",
  },
  {
    id: "image/jpeg",
    label: "JPG",
    ext: "jpg",
    color: "text-blue-400",
    hover: "hover:bg-blue-500/20 hover:border-blue-500",
  },
  {
    id: "image/webp",
    label: "WEBP",
    ext: "webp",
    color: "text-green-400",
    hover: "hover:bg-green-500/20 hover:border-green-500",
  },
  {
    id: "image/svg+xml",
    label: "SVG",
    ext: "svg",
    color: "text-yellow-400",
    hover: "hover:bg-yellow-500/20 hover:border-yellow-500",
  },
] as const;

export type FormatId = (typeof FORMATS)[number]["id"];

export type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  dimensions: { w: number; h: number } | null;
  targetFormat: FormatId;
  quality: number;
  convertedUrl: string | null;
  convertedSize: number;
  isConverting: boolean;
};

// Utilidades puras
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFormatExtension(formatId: FormatId): string {
  const format = FORMATS.find((f) => f.id === formatId);
  return format?.ext || "png";
}

export function getFormatLabel(formatId: FormatId): string {
  const format = FORMATS.find((f) => f.id === formatId);
  return format?.label || "PNG";
}

// Conversión de imagen (función pura)
export async function convertImageBlob(
  previewUrl: string,
  targetFormat: FormatId,
  quality: number,
): Promise<{ dataUrl: string; size: number }> {
  const img = new Image();
  img.src = previewUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  if (targetFormat === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  let dataUrl = "";
  let decodedSize = 0;

  if (targetFormat === "image/svg+xml") {
    const pngDataUrl = canvas.toDataURL("image/png");
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}"><image href="${pngDataUrl}" width="${img.width}" height="${img.height}" /></svg>`;
    dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    decodedSize = svgString.length;
  } else {
    dataUrl = canvas.toDataURL(targetFormat, quality / 100);
    const base64str = dataUrl.split("base64,")[1];
    decodedSize = (base64str.length * 3) / 4;
  }

  return { dataUrl, size: decodedSize };
}

// Procesamiento de archivos (función pura)
export async function processImageFile(
  file: File,
  globalFormat: FormatId,
  globalQuality: number,
): Promise<Omit<ImageItem, "id"> & { id?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        resolve({
          file,
          previewUrl: url,
          originalSize: file.size,
          dimensions: { w: img.width, h: img.height },
          targetFormat: globalFormat,
          quality: globalQuality,
          convertedUrl: null,
          convertedSize: 0,
          isConverting: false,
        });
      };

      img.onerror = reject;
      img.src = url;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Filtrar archivos válidos
export function filterValidImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}
