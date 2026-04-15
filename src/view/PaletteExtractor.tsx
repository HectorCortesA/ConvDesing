import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette,
  Copy,
  Check,
  RefreshCw,
  Droplet,
  Pipette,
  Target,
} from "lucide-react";

type Step = "upload" | "processing" | "result";

type ColorInfo = {
  r: number;
  g: number;
  b: number;
  hex: string;
};

// Función auxiliar para calcular luminiscencia (útil para ordenar colores)
const getLuminance = (r: number, g: number, b: number) =>
  0.299 * r + 0.587 * g + 0.114 * b;

// Función para convertir RGB a HEX
const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
};

export function PaletteExtractor() {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorInfo[]>([]);

  // Nuevos estados para el selector manual
  const [pickedColor, setPickedColor] = useState<ColorInfo | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractColors = async (imageUrl: string) => {
    try {
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      // Redimensionar para procesar más rápido sin perder colores representativos
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

      // Muestrear píxeles (saltamos de 4 en 4 píxeles para velocidad)
      for (let i = 0; i < imageData.length; i += 16) {
        const r = Math.round(imageData[i] / 16) * 16;
        const g = Math.round(imageData[i + 1] / 16) * 16;
        const b = Math.round(imageData[i + 2] / 16) * 16;
        const a = imageData[i + 3];

        if (a < 128) continue; // Ignorar píxeles casi transparentes

        const rgb = `${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)}`;
        colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
      }

      // Ordenar colores por frecuencia de aparición
      const sortedColors = Object.entries(colorCounts).sort(
        (a, b) => b[1] - a[1],
      );

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

      setPalette(finalPalette);
      setStep("result");
    } catch (err) {
      console.error("Error extrayendo colores:", err);
      alert("Hubo un error al procesar la imagen.");
      setStep("upload");
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    setStep("processing");
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    setTimeout(() => {
      extractColors(url);
    }, 500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPicking) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    // Calcular las dimensiones reales renderizadas con object-fit: contain
    const scale = Math.min(
      rect.width / img.naturalWidth,
      rect.height / img.naturalHeight,
    );
    const renderedWidth = img.naturalWidth * scale;
    const renderedHeight = img.naturalHeight * scale;

    // Calcular el offset interno de la imagen dentro del contenedor
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    // Coordenadas del clic relativas a la imagen renderizada
    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;

    // Si hizo clic fuera de la imagen (en las bandas negras del object-fit)
    if (
      clickX < 0 ||
      clickX > renderedWidth ||
      clickY < 0 ||
      clickY > renderedHeight
    ) {
      return;
    }

    // Mapear al tamaño original de la imagen
    const realX = Math.floor(clickX / scale);
    const realY = Math.floor(clickY / scale);

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, realX, realY, 1, 1, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const hex = rgbToHex(r, g, b);
      setPickedColor({ r, g, b, hex });
      setIsPicking(false); // Desactivar el modo picker tras seleccionar
    }
  };

  const copyToClipboard = (hex: string) => {
    try {
      // Método seguro de fallback para entornos sin permisos de Clipboard API
      const el = document.createElement("textarea");
      el.value = hex;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const reset = () => {
    setStep("upload");
    setImageSrc(null);
    setPalette([]);
    setPickedColor(null);
    setIsPicking(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {/* Encabezado */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
          Paleta de Colores
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto md:mx-0">
          Sube una imagen y extrae automáticamente sus colores dominantes o
          selecciona colores específicos manualmente.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full h-[400px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group overflow-hidden ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/10"
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
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all"></div>

            <div className="w-24 h-24 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6 shadow-2xl text-zinc-400 group-hover:scale-110 group-hover:text-emerald-400 transition-all relative z-10">
              <Droplet size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white relative z-10">
              Arrastra una imagen
            </h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md relative z-10">
              Fotografías, ilustraciones o capturas de pantalla. Identificaremos
              los colores más relevantes.
            </p>
            <div className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors shadow-lg relative z-10">
              Seleccionar Imagen
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
              <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <Palette
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse"
                size={24}
              />
            </div>
            <h2 className="text-xl font-bold text-white mt-6 mb-2">
              Analizando píxeles...
            </h2>
            <p className="text-zinc-500 font-medium text-center">
              Extrayendo la paleta perfecta para tu diseño.
            </p>
          </motion.div>
        )}

        {step === "result" && imageSrc && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Panel Principal */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-8">
              {/* Imagen Original */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div
                  className={`h-[300px] md:h-[450px] rounded-2xl overflow-hidden bg-black/50 border border-zinc-800 flex items-center justify-center relative transition-all ${isPicking ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : ""}`}
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20"></div>

                  {isPicking && (
                    <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold z-20 flex items-center gap-2 shadow-lg animate-pulse">
                      <Target size={14} /> Haz clic en cualquier parte de la
                      imagen
                    </div>
                  )}

                  <img
                    src={imageSrc}
                    alt="Original"
                    onClick={handleImageClick}
                    className={`max-w-full max-h-full object-contain relative z-10 transition-all ${isPicking ? "cursor-crosshair" : ""}`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPicking(!isPicking)}
                    className={`flex-1 py-3 px-4 border font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isPicking
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <Pipette size={18} />
                    {isPicking ? "Cancelar" : "Extraer color"}
                  </button>

                  <button
                    onClick={reset}
                    className="flex-1 py-3 px-4 bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold rounded-xl hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Subir otra
                  </button>
                </div>
              </div>

              {/* Resultados de la Paleta y Color Específico */}
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="text-emerald-400" size={20} />
                    Colores Dominantes
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {palette.map((color, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1"
                      onClick={() => copyToClipboard(color.hex)}
                    >
                      <div
                        className="h-20 w-full relative"
                        style={{ backgroundColor: color.hex }}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                          {copiedHex === color.hex ? (
                            <div className="bg-white/90 text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-xl">
                              <Check size={14} /> ¡Copiado!
                            </div>
                          ) : (
                            <div className="bg-black/60 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-xl border border-white/10">
                              <Copy size={14} /> Copiar
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-3 flex flex-col">
                        <span className="text-sm font-bold text-white mb-0.5 uppercase tracking-wide">
                          {color.hex}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          rgb({color.r}, {color.g}, {color.b})
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Sección del Color Seleccionado Manualmente */}
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Pipette className="text-emerald-400" size={18} />
                    Color Específico
                  </h3>

                  {pickedColor ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group cursor-pointer flex rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      onClick={() => copyToClipboard(pickedColor.hex)}
                    >
                      <div
                        className="w-24 h-full min-h-[80px] relative flex-shrink-0"
                        style={{ backgroundColor: pickedColor.hex }}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                          {copiedHex === pickedColor.hex ? (
                            <div className="bg-white/90 text-black p-2 rounded-full shadow-xl">
                              <Check size={16} />
                            </div>
                          ) : (
                            <div className="bg-black/60 text-white p-2 rounded-full shadow-xl border border-white/10">
                              <Copy size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col justify-center flex-1">
                        <span className="text-lg font-bold text-white mb-1 uppercase tracking-wide">
                          {pickedColor.hex}
                        </span>
                        <span className="text-sm text-zinc-500 font-mono">
                          rgb({pickedColor.r}, {pickedColor.g}, {pickedColor.b})
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-zinc-950/50 border border-zinc-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-zinc-900/50">
                      <Target className="text-zinc-600" size={24} />
                      <p className="text-sm text-zinc-400">
                        Pulsa{" "}
                        <strong className="text-zinc-300">Extraer color</strong>{" "}
                        y haz clic en cualquier parte de la foto para extraer su
                        color exacto.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Combinado (Preview estético) */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">
                Vista Previa de la Paleta
              </h3>
              <div className="h-16 rounded-2xl overflow-hidden flex w-full">
                {palette.map((color, idx) => (
                  <div
                    key={idx}
                    className="h-full flex-1 group relative transition-all duration-300 hover:flex-[1.5]"
                    style={{ backgroundColor: color.hex }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-all">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {color.hex}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Añadir el color manual al banner si existe */}
                {pickedColor && (
                  <div
                    className="h-full flex-1 group relative transition-all duration-300 hover:flex-[1.5] border-l-4 border-zinc-900"
                    style={{ backgroundColor: pickedColor.hex }}
                  >
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">
                      <Target size={12} className="text-white drop-shadow-md" />
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-all">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {pickedColor.hex}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
