import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  RefreshCw,
  FileBox,
  ChevronsLeftRight,
  Palette,
  Droplet,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useBackgroundRemoverViewModel } from "../viewModel/Usebackgroundremoverviewmodel";
import { PRESET_COLORS } from "../model/ Backgroundremovermodel";

export function BackgroundRemover() {
  const vm = useBackgroundRemoverViewModel();
  const {
    state,
    fileInputRef,
    containerRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleSliderMouseDown,
    handleSliderTouchStart,
    handleSliderTouchMove,
    handleSliderTouchEnd,
    setBgMode,
    setBgColor,
    handleDownload,
    reset,
  } = vm;

  const {
    step,
    isDragging,
    originalImage,
    resultImage,
    sliderPos,
    bgMode,
    bgColor,
  } = state;

  return (
    <div className="w-full mx-auto p-4 md:p-8">
      {/* Encabezado */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-black dark:text-white flex items-center justify-center md:justify-start gap-3">
          Eliminador Mágico
          <span className="px-2.5 py-1 text-xs font-bold bg-pink-500 text-white rounded-full uppercase tracking-wider relative -top-3">
            Beta
          </span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto md:mx-0">
          Remueve el fondo de tus imágenes al instante usando IA. Añade colores
          sólidos o efectos de desenfoque.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {/* ---- STEP: UPLOAD ---- */}
        {step === "upload" && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full h-[400px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group overflow-hidden ${
              isDragging
                ? "border-pink-500 bg-pink-500/10"
                : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/30 hover:bg-zinc-900/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-all" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <div className="w-24 h-24 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6 shadow-2xl text-zinc-400 group-hover:scale-110 group-hover:text-pink-400 transition-all relative z-10">
              <FileBox size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white relative z-10">
              Sube una imagen para borrar el fondo
            </h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md relative z-10">
              Personas, productos o animales. Nuestra herramienta identificará
              el sujeto principal.
            </p>
            <div className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors shadow-lg relative z-10">
              Subir Imagen
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

        {/* ---- STEP: PROCESSING ---- */}
        {step === "processing" && originalImage && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full h-[500px] bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-20">
              <Sparkles className="animate-pulse text-pink-400" />
              La IA está haciendo su magia...
            </h2>

            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
              <img
                src={originalImage}
                className="w-full h-full object-cover opacity-50 grayscale"
                alt="Procesando"
              />
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,1)] z-10"
              />
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-20 bg-gradient-to-t from-pink-500/30 to-transparent -translate-y-full z-0"
              />
              <motion.div
                initial={{ height: "0%" }}
                animate={{ height: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 right-0 overflow-hidden"
              >
                <img
                  src={originalImage}
                  className="w-full h-80 object-cover origin-top"
                  alt="Procesando original"
                />
              </motion.div>
            </div>

            <p className="text-zinc-500 mt-8 font-medium animate-pulse">
              Separando el sujeto del fondo, por favor espera.
            </p>
          </motion.div>
        )}

        {/* ---- STEP: RESULT ---- */}
        {step === "result" && originalImage && resultImage && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Panel visor con slider */}
            <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-col h-[500px] md:h-[600px] relative">
              <div
                className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/50 flex items-center justify-center select-none"
                ref={containerRef}
              >
                {/* Patrón de transparencia */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20" />

                {bgMode === "color" && (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: bgColor }}
                  />
                )}
                {bgMode === "blur" && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={originalImage}
                      className="w-full h-full object-cover blur-xl opacity-60 scale-110"
                      alt="Fondo borroso"
                    />
                  </div>
                )}

                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={originalImage}
                    className="absolute w-full h-full object-contain pointer-events-none"
                    alt="Original"
                  />
                  <img
                    src={resultImage}
                    className="absolute w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                    style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                    alt="Sin Fondo"
                  />

                  {/* Línea del Slider */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize hover:bg-pink-400 transition-colors z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{
                      left: `${sliderPos}%`,
                      transform: "translateX(-50%)",
                    }}
                    onMouseDown={handleSliderMouseDown}
                    onTouchStart={handleSliderTouchStart}
                    onTouchMove={(e) =>
                      handleSliderTouchMove(e.touches[0].clientX)
                    }
                    onTouchEnd={handleSliderTouchEnd}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl text-zinc-900 border-2 border-zinc-200">
                      <ChevronsLeftRight size={20} />
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10 z-10">
                  Original
                </div>
                <div className="absolute top-4 right-4 bg-pink-500/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-pink-400/50 z-10">
                  Sin Fondo
                </div>
              </div>
            </div>

            {/* Panel lateral de herramientas */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-400/90 items-start">
                <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-medium leading-relaxed">
                  <strong>Simulación UI Activa.</strong> Para uso real, conecta
                  una API (ej. Remove.bg) o modelo local.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 flex-1">
                <div className="flex items-center gap-2">
                  <Palette className="text-pink-400" size={20} />
                  <h2 className="text-lg font-bold text-white">Fondo Nuevo</h2>
                </div>

                {/* Opción: transparente */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setBgMode("transparent")}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      bgMode === "transparent"
                        ? "bg-zinc-800 border-pink-500 text-white shadow-md"
                        : "bg-zinc-950 border-zinc-800/50 text-zinc-400 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] border border-zinc-700" />
                    <span className="font-semibold text-sm">Transparente</span>
                  </button>

                  {/* Opción: blur */}
                  <button
                    onClick={() => setBgMode("blur")}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      bgMode === "blur"
                        ? "bg-zinc-800 border-pink-500 text-white shadow-md"
                        : "bg-zinc-950 border-zinc-800/50 text-zinc-400 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                      <Droplet size={16} className="text-zinc-400" />
                    </div>
                    <span className="font-semibold text-sm">
                      Fondo Original Borroso
                    </span>
                  </button>

                  {/* Opción: color sólido */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      bgMode === "color"
                        ? "bg-zinc-800 border-pink-500 text-white shadow-md"
                        : "bg-zinc-950 border-zinc-800/50 text-zinc-400"
                    }`}
                  >
                    <button
                      onClick={() => setBgMode("color")}
                      className="flex items-center gap-3 w-full mb-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg border border-zinc-700"
                        style={{ backgroundColor: bgColor }}
                      />
                      <span className="font-semibold text-sm">
                        Color Sólido
                      </span>
                    </button>

                    <AnimatePresence>
                      {bgMode === "color" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-zinc-800/50 overflow-hidden"
                        >
                          <div className="flex gap-2 mb-3">
                            <input
                              type="color"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-10 h-10 rounded-lg cursor-pointer bg-zinc-950 border border-zinc-800 p-1"
                            />
                            <input
                              type="text"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-pink-500 font-mono uppercase"
                              placeholder="#FFFFFF"
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                onClick={() => setBgColor(c)}
                                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                  backgroundColor: c,
                                  borderColor:
                                    bgColor === c ? "#ec4899" : "transparent",
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex flex-col gap-3">
                  <button
                    onClick={handleDownload}
                    className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  >
                    <Download size={18} />
                    Descargar HD
                  </button>
                  <button
                    onClick={reset}
                    className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold rounded-xl hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Subir Otra
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
