// @ts-ignore
import ImageTracer from "imagetracerjs";

export type Step = "upload" | "processing" | "result";
export type Preset = "fullcolor" | "grayscale" | "bw";

export const PRESETS: { id: Preset; label: string; desc: string }[] = [
  {
    id: "fullcolor",
    label: "Full Color",
    desc: "Alta fidelidad con colores exactos al original.",
  },
  {
    id: "grayscale",
    label: "Escala de Grises",
    desc: "Vectoriza usando tonos de gris puro.",
  },
  {
    id: "bw",
    label: "Blanco y Negro",
    desc: "Estricto monocromático (Ideal para logos).",
  },
];

export interface VectorizerState {
  step: Step;
  isDragging: boolean;
  originalImage: string | null;
  svgResult: string | null;
  activePreset: Preset;
  displayValue: number;
  detailValue: number;
  isProcessing: boolean;
  isCopied: boolean;
  errorMessage: string | null;
}

export const initialState: VectorizerState = {
  step: "upload",
  isDragging: false,
  originalImage: null,
  svgResult: null,
  activePreset: "fullcolor",
  displayValue: 65,
  detailValue: 65,
  isProcessing: false,
  isCopied: false,
  errorMessage: null,
};

const generateGrayPalette = (count: number) => {
  const pal = [];
  for (let i = 0; i < count; i++) {
    const val = count <= 1 ? 0 : Math.floor((i / (count - 1)) * 255);
    pal.push({ r: val, g: val, b: val, a: 255 });
  }
  return pal;
};

const getOptions = (presetId: Preset, v: number) => {
  const t = v / 100;
  const omit = Math.round(15 - 15 * t);
  const threshold = 2.5 - 2.4 * t;
  const baseBlur = Math.round(2 - 2 * t);

  let colorCount = 16;
  if (presetId === "fullcolor") {
    colorCount = Math.floor(8 + t * 40);
  } else if (presetId === "grayscale") {
    colorCount = Math.floor(4 + t * 20);
  } else {
    colorCount = 2;
  }

  const baseOpts = {
    ltres: threshold,
    qtres: threshold,
    pathomit: omit,
    scale: 1,
    blurradius: presetId === "bw" ? baseBlur + 1 : baseBlur,
  };

  switch (presetId) {
    case "bw":
      return {
        ...baseOpts,
        colorsampling: 0,
        pal: [
          { r: 0, g: 0, b: 0, a: 255 },
          { r: 255, g: 255, b: 255, a: 255 },
        ],
        numberofcolors: 2,
      };
    case "grayscale":
      return {
        ...baseOpts,
        colorsampling: 0,
        pal: generateGrayPalette(colorCount),
        numberofcolors: colorCount,
      };
    case "fullcolor":
    default:
      return { ...baseOpts, colorsampling: 2, numberofcolors: colorCount };
  }
};

// EXTRACCIÓN DE PÍXELES DIRECTOS (ImageData)
// Evitamos Base64 para que la librería no colapse la memoria
async function getOptimizedImageData(
  imageUrl: string,
  maxSize = 600,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D context"));

      // Fondo blanco para evitar errores de transparencias
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Retornamos la matriz de píxeles directa
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = () => reject(new Error("Error al cargar la imagen."));
    img.src = imageUrl;
  });
}

export async function vectorizeImageProcess(
  url: string,
  preset: Preset,
  detail: number,
): Promise<string> {
  const imgData = await getOptimizedImageData(url);
  const options = getOptions(preset, detail);

  return new Promise((resolve, reject) => {
    // Retraso de 100ms exclusivo para asegurar que React alcance a pintar el "Cargando..."
    setTimeout(() => {
      try {
        // Usamos la versión síncrona ImageDataToSVG: 100% segura contra bugs de carga
        let finalSvg = ImageTracer.imagedataToSVG(imgData, options);

        const wMatch = finalSvg.match(/width="(\d+(\.\d+)?)"/);
        const hMatch = finalSvg.match(/height="(\d+(\.\d+)?)"/);

        if (wMatch && hMatch && !finalSvg.includes("viewBox=")) {
          finalSvg = finalSvg.replace(
            "<svg ",
            `<svg viewBox="0 0 ${wMatch[1]} ${hMatch[1]}" `,
          );
        }
        if (!finalSvg.includes("xmlns=")) {
          finalSvg = finalSvg.replace(
            "<svg ",
            '<svg xmlns="http://www.w3.org/2000/svg" ',
          );
        }

        finalSvg = finalSvg.replace(/width="[^"]+"/, 'width="100%"');
        finalSvg = finalSvg.replace(/height="[^"]+"/, 'height="100%"');

        resolve(finalSvg);
      } catch (err) {
        reject(err);
      }
    }, 100);
  });
}
