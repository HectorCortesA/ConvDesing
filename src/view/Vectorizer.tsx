import React from "react";
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
  AlertTriangle,
} from "lucide-react";
import { useVectorizerViewModel } from "../viewModel/useVectorizerViewModel";
import { PRESETS } from "../model/Vectorizermodel";

export default function Vectorizer() {
  const vm = useVectorizerViewModel();
  const {
    state,
    fileInputRef,
    processFile,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    setActivePreset,
    setDisplayValue,
    setDetailValue,
    downloadSvg,
    copySvgCode,
    reset,
  } = vm;

  const {
    step,
    isDragging,
    originalImage,
    svgResult,
    activePreset,
    displayValue,
    isProcessing,
    isCopied,
    errorMessage,
  } = state;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            Vectorize AI
            <span className="px-2.5 py-1 text-xs font-bold bg-purple-500 text-white rounded-full uppercase tracking-wider shadow-lg shadow-purple-500/20">
              Ultra Rápido
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto md:mx-0">
            Convierte cualquier imagen en un trazado SVG de alta precisión al
            instante.
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertTriangle size={16} /> {errorMessage}
        </div>
      )}

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Settings2 size={16} /> Perfiles de Trazado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                disabled={step === "processing" || isProcessing}
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
          <div className="flex flex-col gap-2 relative">
            <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              Nivel de Detalle
            </h3>
            <style>{`
              input[type="range"]::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; background: white; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
              input[type="range"]::-moz-range-thumb { width: 24px; height: 24px; background: white; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: none; }
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
                    disabled={isProcessing}
                    className="w-full accent-blue-500 cursor-pointer h-[10px] bg-zinc-800 rounded-full appearance-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />

            <div className="w-24 h-24 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6 shadow-2xl text-zinc-400 group-hover:scale-110 group-hover:text-purple-400 transition-all relative z-10">
              <UploadCloud size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white relative z-10">
              Sube una imagen para vectorizar
            </h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md relative z-10">
              Selecciona cualquier archivo PNG o JPG.
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
              Calculando curvas, esquinas y bloques de color de forma ultra
              rápida.
            </p>
          </motion.div>
        )}

        {step === "result" && svgResult && originalImage && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 relative"
          >
            {/* OVERLAY DE CARGA PARA ACTUALIZACIONES RÁPIDAS (Para que la app no se sienta trabada) */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl border border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
                >
                  <Loader2
                    size={48}
                    className="animate-spin text-purple-500 mb-4"
                  />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Generando SVG...
                  </h2>
                  <p className="text-zinc-400">
                    Trazando nuevos vectores y curvas
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6">
              {/* Imagen Original */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} /> Rasterizado Original
                  </span>
                </div>
                <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20" />
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-w-full max-h-full object-contain relative z-10"
                  />
                </div>
                <button
                  onClick={reset}
                  disabled={isProcessing}
                  className="py-3 px-4 bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold rounded-xl hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={18} /> Procesar otra imagen
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
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20" />
                  <div
                    className="relative z-10 w-full h-full flex items-center justify-center p-4 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:object-contain"
                    dangerouslySetInnerHTML={{ __html: svgResult }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadSvg}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={18} /> Descargar SVG
                  </button>
                  <button
                    onClick={copySvgCode}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 bg-zinc-900 border border-zinc-700 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Code size={18} />{" "}
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
