import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Cropper from "react-easy-crop";
import {
  Download,
  RefreshCw,
  Command,
  Apple,
  Monitor,
  LayoutGrid,
  FileBox,
  Crop as CropIcon,
  Palette,
  Circle,
  Square,
  AppWindow,
  Droplet,
} from "lucide-react";

const PLATFORMS = [
  {
    id: "windows",
    label: "Windows (.ico)",
    icon: LayoutGrid,
    color: "text-blue-400",
    hover: "hover:bg-blue-500/20 hover:border-blue-500",
  },
  {
    id: "mac",
    label: "Mac (.icns)",
    icon: Apple,
    color: "text-zinc-300",
    hover: "hover:bg-zinc-500/20 hover:border-zinc-500",
  },
  {
    id: "linux",
    label: "Linux (.png)",
    icon: Monitor,
    color: "text-orange-400",
    hover: "hover:bg-orange-500/20 hover:border-orange-500",
  },
  {
    id: "all",
    label: "Todos",
    icon: Command,
    color: "text-indigo-400",
    hover: "hover:bg-indigo-500/20 hover:border-indigo-500",
  },
] as const;

const SIZES = [
  { id: 32, label: "32 x 32" },
  { id: 64, label: "64 x 64" },
  { id: 256, label: "256 x 256" },
  { id: 512, label: "512 x 512" },
] as const;

const PRESET_COLORS = [
  "#FFFFFF",
  "#000000",
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#EAB308",
  "#9333EA",
];

type TargetOS = (typeof PLATFORMS)[number]["id"];
type IconSize = (typeof SIZES)[number]["id"];
type Step = "upload" | "editor" | "results";
type Shape = "square" | "rounded" | "circle";

type ResultIcon = {
  os: string;
  format: string;
  url: string;
  filename: string;
  iconComponent: React.ElementType;
  colorClass: string;
};

// --- Utilidades de Generación de Archivos Binarios ---

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

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

async function createFinalIconBlob(
  imageSrc: string,
  pixelCrop: any,
  size: number,
  bgShape: Shape,
  bgColor: string,
  isTransparent: boolean,
  padding: number,
): Promise<Blob> {
  const croppedBlob = await getCroppedImg(imageSrc, pixelCrop);
  const img = new Image();
  img.src = URL.createObjectURL(croppedBlob);
  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.clearRect(0, 0, size, size);

  // Draw shape
  ctx.beginPath();
  if (bgShape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else if (bgShape === "rounded") {
    const r = size * 0.22; // 22% radius for natural squircle look
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, size, size, r);
    } else {
      ctx.rect(0, 0, size, size); // fallback
    }
  } else {
    ctx.rect(0, 0, size, size);
  }
  ctx.closePath();

  // Fill background
  if (!isTransparent) {
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  // Clip content to shape
  ctx.clip();

  // Calculate padding
  const padPx = (padding / 100) * size;
  const innerSize = size - padPx * 2;

  // Draw cropped image
  ctx.drawImage(img, padPx, padPx, innerSize, innerSize);

  URL.revokeObjectURL(img.src);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas empty"));
    }, "image/png");
  });
}

async function generateIco(pngBlob: Blob, size: number): Promise<Blob> {
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

function getIcnsMagic(size: number) {
  if (size === 32) return "icp5";
  if (size === 64) return "icp6";
  if (size === 512) return "ic09";
  return "ic08";
}

async function generateIcns(pngBlob: Blob, size: number): Promise<Blob> {
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

export default function IconGenerator() {
  const [step, setStep] = useState<Step>("upload");
  const [targetOS, setTargetOS] = useState<TargetOS>("all");
  const [targetSize, setTargetSize] = useState<IconSize>(256);

  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("icon");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Styling State
  const [bgShape, setBgShape] = useState<Shape>("rounded");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [padding, setPadding] = useState<number>(10);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);

  // Results State
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ResultIcon[]>([]);
  const [finalPreviewSrc, setFinalPreviewSrc] = useState<string | null>(null);

  // Updates the live preview image strictly for the cropped area
  useEffect(() => {
    if (!imageToCrop || !croppedAreaPixels || step !== "editor") return;

    let active = true;
    const timer = setTimeout(() => {
      getCroppedImg(imageToCrop, croppedAreaPixels)
        .then((blob) => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          setLivePreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch(console.error);
    }, 100); // Small debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [imageToCrop, croppedAreaPixels, step]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido.");
      return;
    }
    setFileName(file.name.split(".")[0] || "icon");
    setImageToCrop(URL.createObjectURL(file));
    setStep("editor");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setIsProcessing(true);
    setStep("results");

    try {
      // 1. Create the final unified PNG combining crop + styles
      const finalPngBlob = await createFinalIconBlob(
        imageToCrop,
        croppedAreaPixels,
        targetSize,
        bgShape,
        bgColor,
        isTransparent,
        padding,
      );

      const finalUrl = URL.createObjectURL(finalPngBlob);
      setFinalPreviewSrc(finalUrl);

      const newResults: ResultIcon[] = [];

      // 2. Generate OS specific formats
      if (targetOS === "windows" || targetOS === "all") {
        const icoBlob = await generateIco(finalPngBlob, targetSize);
        newResults.push({
          os: "Windows",
          format: ".ico",
          url: URL.createObjectURL(icoBlob),
          filename: `${fileName}_${targetSize}.ico`,
          iconComponent: LayoutGrid,
          colorClass: "text-blue-400",
        });
      }

      if (targetOS === "mac" || targetOS === "all") {
        const icnsBlob = await generateIcns(finalPngBlob, targetSize);
        newResults.push({
          os: "Mac OS",
          format: ".icns",
          url: URL.createObjectURL(icnsBlob),
          filename: `${fileName}_${targetSize}.icns`,
          iconComponent: Apple,
          colorClass: "text-zinc-300",
        });
      }

      if (targetOS === "linux" || targetOS === "all") {
        newResults.push({
          os: "Linux / Web",
          format: ".png",
          url: finalUrl, // Just reuse the generated PNG
          filename: `${fileName}_${targetSize}.png`,
          iconComponent: Monitor,
          colorClass: "text-orange-400",
        });
      }

      setResults(newResults);
    } catch (err) {
      console.error(err);
      alert("Error al generar los iconos.");
      setStep("editor");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setResults([]);
    setImageToCrop(null);
    setLivePreviewUrl(null);
    setFinalPreviewSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOSChange = (id: TargetOS) => {
    setTargetOS(id);
    if (step === "results") reset();
  };

  const handleSizeChange = (id: IconSize) => {
    setTargetSize(id);
    if (step === "results") reset();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="backdrop-blur-lg bg-white/8  rounded-3xl p-6 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
              Plataforma de destino
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isActive = targetOS === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleOSChange(p.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl  transition-all ${
                      isActive
                        ? `backdrop-blur-lg bg-white/8  shadow-lg`
                        : `backdrop-blur-lg bg-white/8  ${p.hover}`
                    }`}
                  >
                    <Icon
                      size={24}
                      className={`mb-2 ${isActive ? p.color : "text-zinc-500"}`}
                    />
                    <span
                      className={`text-xs font-semibold ${isActive ? "text-white" : "text-zinc-500"}`}
                    >
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-px h-16 bg-black dark:bg-white hidden md:block"></div>

          <div className="w-full md:w-80">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
              Tamaño Ideal
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap backdrop-blur-lg bg-white/8 rounded-xl p-1">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSizeChange(s.id)}
                    className={`flex-1 min-w-[60px] py-2 px-1 text-xs font-bold rounded-lg transition-all ${
                      targetSize === s.id
                        ? "backdrop-blur-lg bg-white/8  text-white shadow-md"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal Dinámica */}
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full h-[400px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${
              isDragging
                ? "border-indigo-500 backdrop-blur-lg bg-white/8 "
                : "border-zinc-700 hover:border-zinc-500 backdrop-blur-lg bg-white/8  hover:bg-zinc-600/50"
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
            <div className="w-24 h-24 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6 shadow-2xl text-zinc-400 group-hover:scale-110 group-hover:text-indigo-400 transition-all">
              <FileBox size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">
              Sube tu imagen (PNG/JPG)
            </h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md">
              Ajusta el tamaño, recorta tu imagen y añade fondos o formas antes
              de convertirla.
            </p>
            <div className="px-6 py-3 bg-zinc-800 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors shadow-lg">
              Seleccionar archivo
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </motion.div>
        )}

        {step === "editor" && imageToCrop && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Panel Izquierdo: Cropper */}
            <div className="lg:col-span-7 backdrop-blur-lg bg-white/8  rounded-3xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <CropIcon className="text-indigo-400" />
                <h2 className="text-xl font-bold text-white">
                  1. Encuadre y Recorte
                </h2>
              </div>

              <div className="relative w-full h-[350px] md:h-[450px] bg-zinc-950 rounded-2xl overflow-hidden shadow-inner border border-zinc-800">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  onZoomChange={setZoom}
                  showGrid={true}
                />
              </div>

              <div className="flex items-center gap-4 text-sm font-medium text-zinc-400 backdrop-blur-lg bg-white/8  p-4 rounded-xl  mt-4">
                <span className="min-w-[40px]">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.01}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="min-w-[40px] text-right">
                  {Math.round((zoom - 1) * 100)}%
                </span>
              </div>
            </div>

            {/* Panel Derecho: Vista Previa y Ajustes de Estilo */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Box de Vista Previa */}
              <div className="backdrop-blur-lg bg-white/8  rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>

                <h3 className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-wider relative z-10 w-full text-center">
                  Vista Previa Real
                </h3>

                {/* Elemento CSS que imita exactamente la salida del Canvas */}
                <div
                  className="relative overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-200 z-10"
                  style={{
                    width: 160,
                    height: 160,
                    backgroundColor: isTransparent ? "transparent" : bgColor,
                    borderRadius:
                      bgShape === "circle"
                        ? "50%"
                        : bgShape === "rounded"
                          ? "22%"
                          : "0",
                    border: isTransparent
                      ? "1px dashed rgba(255,255,255,0.2)"
                      : "none",
                  }}
                >
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: `${100 - padding * 2}%`,
                      height: `${100 - padding * 2}%`,
                    }}
                  >
                    {livePreviewUrl ? (
                      <img
                        src={livePreviewUrl}
                        className="w-full h-full object-contain drop-shadow-xl pointer-events-none"
                        alt="Live Preview"
                      />
                    ) : (
                      <RefreshCw className="animate-spin text-zinc-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Ajustes Visuales */}
              <div className="backdrop-blur-lg bg-white/8  rounded-3xl p-6 shadow-2xl flex-1 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Palette className="text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">
                    2. Estilo del Icono
                  </h2>
                </div>

                {/* Forma */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Forma del Fondo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setBgShape("square")}
                      className={`py-2 flex flex-col items-center gap-1 rounded-xl border transition-all ${bgShape === "square" ? "bg-zinc-800 border-indigo-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}
                    >
                      <Square size={20} />
                      <span className="text-xs font-semibold">Cuadrado</span>
                    </button>
                    <button
                      onClick={() => setBgShape("rounded")}
                      className={`py-2 flex flex-col items-center gap-1 rounded-xl border transition-all ${bgShape === "rounded" ? "bg-zinc-800 border-indigo-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}
                    >
                      <AppWindow size={20} />
                      <span className="text-xs font-semibold">Redondeado</span>
                    </button>
                    <button
                      onClick={() => setBgShape("circle")}
                      className={`py-2 flex flex-col items-center gap-1 rounded-xl border transition-all ${bgShape === "circle" ? "bg-zinc-800 border-indigo-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}
                    >
                      <Circle size={20} />
                      <span className="text-xs font-semibold">Círculo</span>
                    </button>
                  </div>
                </div>

                {/* Color de Fondo */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Color de Fondo
                    </label>
                    <button
                      onClick={() => setIsTransparent(!isTransparent)}
                      className="text-xs flex items-center gap-1 font-semibold px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:text-white transition-all"
                    >
                      <Droplet size={12} />
                      {isTransparent ? "Activar Color" : "Hacer Transparente"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {!isTransparent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 mb-3">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-12 h-10 rounded-lg cursor-pointer bg-zinc-950 border border-zinc-800"
                          />
                          <input
                            type="text"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                            placeholder="#FFFFFF"
                          />
                        </div>
                        <div className="flex gap-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setBgColor(c)}
                              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor:
                                  bgColor === c ? "#6366f1" : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Padding */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Espaciado Interior (Margen)
                    </label>
                    <span className="text-sm font-bold text-white">
                      {padding}%
                    </span>
                  </div>
                  <input
                    type="range"
                    value={padding}
                    min={0}
                    max={40}
                    step={1}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-800 flex gap-3">
                  <button
                    onClick={reset}
                    className="px-4 py-3 rounded-xl bg-zinc-800/80 text-white font-semibold hover:bg-zinc-700 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  >
                    <RefreshCw size={18} />
                    Generar Archivos
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8"
          >
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw
                  size={48}
                  className="animate-spin text-indigo-500 mb-6"
                />
                <h3 className="text-2xl font-bold text-white">
                  Generando iconos perfectos...
                </h3>
                <p className="text-zinc-400 mt-2">
                  Aplicando recortes, estilos y codificando binarios.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-black/50 border border-zinc-800 p-2 overflow-hidden shadow-lg relative">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20"></div>
                      {finalPreviewSrc && (
                        <img
                          src={finalPreviewSrc}
                          alt="Final"
                          className="w-full h-full object-contain relative z-10"
                        />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Iconos Generados Exitosamente
                      </h2>
                      <p className="text-zinc-400">
                        Listos para descargar en los formatos y tamaños
                        seleccionados.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="w-full md:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <RefreshCw size={18} />
                    Crear otro
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((res, i) => {
                    const IconComp = res.iconComponent;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={res.format}
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden group hover:border-zinc-600 transition-all"
                      >
                        <div
                          className={`absolute -top-20 -right-20 w-40 h-40 opacity-10 blur-3xl rounded-full bg-current ${res.colorClass}`}
                        ></div>

                        <IconComp
                          size={32}
                          className={`mb-4 ${res.colorClass}`}
                        />

                        <h3 className="text-lg font-bold text-white mb-1">
                          {res.os}
                        </h3>
                        <p className="text-sm font-medium text-zinc-500 mb-6 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 shadow-sm">
                          {targetSize}x{targetSize} px • {res.format}
                        </p>

                        <div className="w-32 h-32 mb-6 bg-black/50 rounded-2xl border border-zinc-800/50 p-4 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all relative">
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20 rounded-2xl"></div>
                          <img
                            src={finalPreviewSrc!}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain drop-shadow-2xl relative z-10"
                          />
                        </div>

                        <a
                          href={res.url}
                          download={res.filename}
                          className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Download size={18} />
                          Descargar
                        </a>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
