import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  RefreshCw,
  Download,
  Code,
  Settings2,
  Target,
  Zap,
  Image as ImageIcon,
  Check,
  Loader2,
} from "lucide-react";
// @ts-ignore
import ImageTracer from "imagetracerjs";

type Step = "upload" | "processing" | "result";

type Preset = "fullcolor" | "grayscale" | "bw";

const PRESETS: { id: Preset; label: string; desc: string }[] = [
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

const generateGrayPalette = (count: number) => {
  const pal = [];
  for (let i = 0; i < count; i++) {
    const val = count <= 1 ? 0 : Math.floor((i / (count - 1)) * 255);
    pal.push({ r: val, g: val, b: val, a: 255 });
  }
  return pal;
};

const getOptions = (presetId: Preset, v: number) => {
  // v: 1 to 100

  let colorCount = 16;
  if (presetId === "fullcolor") {
    colorCount = Math.floor(16 + (v / 100) * 112); // 16 to 128 colors
  } else if (presetId === "grayscale") {
    colorCount = Math.floor(4 + (v / 100) * 28); // 4 to 32 grays
  } else {
    colorCount = 2; // 2 colors
  }

  const omit = Math.floor(8 - (v / 100) * 8); // 8 down to 0
  const threshold = 1.2 - (v / 100) * 0.8; // 1.2 down to 0.4

  const baseOpts = {
    ltres: threshold,
    qtres: threshold,
    pathomit: omit,
    scale: 1,
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
        blurradius: 0,
      };
    case "grayscale":
      return {
        ...baseOpts,
        colorsampling: 0,
        pal: generateGrayPalette(colorCount),
        numberofcolors: colorCount,
        blurradius: 0,
      };
    case "fullcolor":
    default:
      return {
        ...baseOpts,
        colorsampling: 2, // Color sampling method 2 is more accurate
        numberofcolors: colorCount,
        blurradius: 0,
      };
  }
};

export default function Vectorizer() {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<Preset>("fullcolor");
  const [displayValue, setDisplayValue] = useState(65);
  const [detailValue, setDetailValue] = useState(65);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const vectorizeImage = (
    url: string,
    preset: Preset,
    detail: number,
    silent = false,
  ) => {
    if (!silent) setStep("processing");
    else setIsProcessing(true);

    // Pequeño timeout para que se renderice la UI de "Procesando"
    setTimeout(() => {
      try {
        const options = getOptions(preset, detail);
        ImageTracer.imageToSVG(
          url,
          (svgString: string) => {
            let finalSvg = svgString;

            // Extraer dimensiones para generar un viewBox si la librería no lo incluye
            const wMatch = finalSvg.match(/width="(\d+(\.\d+)?)"/);
            const hMatch = finalSvg.match(/height="(\d+(\.\d+)?)"/);

            if (wMatch && hMatch && !finalSvg.includes("viewBox=")) {
              finalSvg = finalSvg.replace(
                "<svg ",
                `<svg viewBox="0 0 ${wMatch[1]} ${hMatch[1]}" `,
              );
            }

            // Asegurarnos de que el namespace XML exista
            if (!finalSvg.includes("xmlns=")) {
              finalSvg = finalSvg.replace(
                "<svg ",
                '<svg xmlns="http://www.w3.org/2000/svg" ',
              );
            }

            // Reemplazar dimensiones absolutas por porcentajes para que la imagen se escale al contenedor
            finalSvg = finalSvg.replace(/width="[^"]+"/, 'width="100%"');
            finalSvg = finalSvg.replace(/height="[^"]+"/, 'height="100%"');

            setSvgResult(finalSvg);
            if (!silent) setStep("result");
            setIsProcessing(false);
          },
          options,
        );
      } catch (err) {
        console.error("Error al vectorizar:", err);
        alert("Hubo un problema al procesar la imagen con ImageTracer.");
        setStep("upload");
        setIsProcessing(false);
      }
    }, 50);
  };

  useEffect(() => {
    if (imageSrc && step === "result") {
      vectorizeImage(imageSrc, activePreset, detailValue, true);
    }
  }, [detailValue, activePreset]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(
        "Por favor, selecciona un archivo de imagen válido (PNG, JPG, etc).",
      );
      return;
    }

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    vectorizeImage(url, activePreset, detailValue);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetChange = (preset: Preset) => {
    setActivePreset(preset);
  };

  const reset = () => {
    setStep("upload");
    setImageSrc(null);
    setSvgResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSvg = () => {
    if (!svgResult) return;
    const blob = new Blob([svgResult], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vectorizado.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copySvgCode = () => {
    if (!svgResult) return;
    try {
      const el = document.createElement("textarea");
      el.value = svgResult;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Error copiando:", err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Encabezado */}
      <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            Vectorize AI
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto md:mx-0">
            Inspirado en Vectorize de Storyship. Convierte cualquier imagen en
            un trazado SVG de alta precisión al instante.
          </p>
        </div>
      </header>

      {/* Ajustes Globales (Visibles incluso antes de subir para preparar la magia) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Settings2 size={16} /> Perfiles de Trazado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                disabled={step === "processing"}
                className={`flex flex-col p-3 rounded-2xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activePreset === p.id
                    ? "bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "bg-zinc-950 border-zinc-800 hover:border-purple-500/30 hover:bg-zinc-900"
                }`}
              >
                <span
                  className={`text-sm font-bold mb-1 ${activePreset === p.id ? "text-purple-300" : "text-zinc-200"}`}
                >
                  {p.label}
                </span>
                <span className="text-[10px] text-zinc-500 leading-tight">
                  {p.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {step === "result" && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              Nivel de Detalle
            </h3>
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 24px;
                height: 24px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              }
              input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                border: none;
              }
            `}</style>
            <div className="flex flex-col md:flex-row items-center gap-3 relative z-10">
              <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5 w-full">
                <div className="px-4 py-2 text-lg font-semibold text-zinc-300 min-w-[4rem] text-center border-r border-zinc-800">
                  {displayValue}
                </div>
                <div className="flex-1 px-4 flex items-center py-3">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={displayValue}
                    onChange={(e) => setDisplayValue(parseInt(e.target.value))}
                    onMouseUp={() => setDetailValue(displayValue)}
                    onTouchEnd={() => setDetailValue(displayValue)}
                    className="w-full accent-blue-500 cursor-pointer h-[10px] bg-zinc-800 rounded-full appearance-none outline-none"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${displayValue}%, #27272a ${displayValue}%, #27272a 100%)`,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setDetailValue(displayValue)}
                disabled={isProcessing}
                className="h-[52px] w-full md:w-[52px] flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Aplicar cambios ahora"
              >
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Check size={24} strokeWidth={3} />
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Ajusta la tolerancia y la cantidad de colores (se actualiza
              automáticamente al soltar).
            </p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full h-[400px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group overflow-hidden ${
              isDragging
                ? "border-purple-500 bg-purple-500/10"
                : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/30 hover:bg-zinc-900/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>

            <div className="w-24 h-24 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6 shadow-2xl text-zinc-400 group-hover:scale-110 group-hover:text-purple-400 transition-all relative z-10">
              <UploadCloud size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white relative z-10">
              Sube una imagen para vectorizar
            </h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md relative z-10">
              Selecciona cualquier archivo PNG o JPG. Lo convertiremos a
              vectores en segundos con nuestra IA simulada.
            </p>
            <div className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors shadow-lg relative z-10">
              Seleccionar Archivo
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) processFile(e.target.files[0]);
              }}
              accept="image/*"
              className="hidden"
            />
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full h-[400px] bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <Zap
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-pulse"
                size={28}
              />
            </div>
            <h2 className="text-xl font-bold text-white mt-6 mb-2">
              Trazando vectores...
            </h2>
            <p className="text-zinc-500 font-medium text-center">
              Calculando curvas, esquinas y bloques de color.
            </p>
            <p className="text-xs text-zinc-600 mt-4">
              (Esto puede tomar unos segundos dependiendo de la complejidad)
            </p>
          </motion.div>
        )}

        {step === "result" && svgResult && imageSrc && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Panel Principal */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6">
              {/* Imagen Original */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} /> Rasterizado Original
                  </span>
                </div>
                <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20"></div>
                  <img
                    src={imageSrc}
                    alt="Original"
                    className="max-w-full max-h-full object-contain relative z-10"
                  />
                </div>
                <button
                  onClick={reset}
                  className="py-3 px-4 bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold rounded-xl hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Procesar otra imagen
                </button>
              </div>

              {/* Resultado Vectorizado */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target size={14} /> Resultado SVG
                  </span>
                </div>
                <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-zinc-950 border border-purple-500/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20"></div>
                  {/* Renderizamos el SVG generado inyectándolo directamente */}
                  <div
                    className="relative z-10 w-full h-full flex items-center justify-center p-4 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:object-contain"
                    dangerouslySetInnerHTML={{ __html: svgResult }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadSvg}
                    className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Descargar SVG
                  </button>
                  <button
                    onClick={copySvgCode}
                    className="flex-1 py-3 px-4 bg-zinc-900 border border-zinc-700 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Code size={18} />
                    {isCopied ? "¡Copiado!" : "Copiar Código"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
