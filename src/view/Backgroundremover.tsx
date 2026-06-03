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
  Brush,
  Eraser,
  Eye,
  EyeOff,
  Check,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { useBackgroundRemoverViewModel } from "../viewModel/Usebackgroundremoverviewmodel";
import { PRESET_COLORS } from "../model/Backgroundremovermodel";

export function BackgroundRemover() {
  const vm = useBackgroundRemoverViewModel();
  const {
    state,
    fileInputRef,
    containerRef,
    canvasRef,
    cursorPos,
    isHovering,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCanvasMouseLeave,
    handleSliderMouseDown,
    handleSliderTouchStart,
    handleSliderTouchMove,
    handleSliderTouchEnd,
    setBgMode,
    setBgColor,
    setTool,
    setBrushSize,
    setShowMask,
    zoomIn,
    zoomOut,
    fitToScreen,
    applyChanges,
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
    isProcessing,
    errorMessage,
    tool,
    brushSize,
    showMask,
    aiProgress,
    zoom,
    pan,
    imageSize,
  } = state;

  return (
    <div className="w-full mx-auto p-4 md:p-8">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-black dark:text-white flex items-center justify-center md:justify-start gap-3 flex-wrap">
          Eliminador de Fondo
        </h1>
        <p className="dark:text-white text-black text-lg max-w-2xl mx-auto md:mx-0">
          Usa la rueda del ratón para hacer zoom y perfecciona los detalles con
          exactitud milimétrica.
        </p>

        {errorMessage && (
          <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
            <AlertTriangle size={12} /> {errorMessage}
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
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
            <div className="w-24 h-24 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6 shadow-2xl text-zinc-400 group-hover:scale-110 group-hover:text-pink-400 transition-all relative z-10">
              <FileBox size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white relative z-10">
              Sube una foto
            </h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md relative z-10">
              Soporta imágenes de altísima resolución.
            </p>
            <div className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors shadow-lg relative z-10">
              Seleccionar imagen
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
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
            className="w-full h-[500px] bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-20">
              <Sparkles className="animate-pulse text-pink-400" />
              {aiProgress < 100
                ? "Escaneando imagen y preparando IA..."
                : "Renderizando recortes..."}
            </h2>

            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 flex flex-col items-center justify-center">
              {originalImage && (
                <img
                  src={originalImage}
                  className="absolute inset-0 w-full h-full object-contain opacity-40 grayscale"
                  alt="Procesando"
                />
              )}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="w-24 h-24 border-4 border-pink-500 border-t-transparent rounded-full opacity-80"></div>
              </motion.div>

              <div className="relative z-20 text-4xl font-black text-white font-mono drop-shadow-lg">
                {aiProgress}%
              </div>
              <p className="relative z-20 text-zinc-300 text-xs mt-2 text-center px-4 font-bold bg-black/50 py-1 rounded-full">
                {aiProgress < 100
                  ? "Optimizando máscara gráfica"
                  : "¡Casi listo!"}
              </p>
            </div>
          </motion.div>
        )}

        {step === "editor" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                  <button
                    onClick={() => setTool("pan")}
                    className={`px-4 py-2 flex items-center gap-2 text-sm transition-all ${tool === "pan" ? "bg-indigo-500 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                  >
                    <Hand size={16} /> Mover
                  </button>
                  <button
                    onClick={() => setTool("keep")}
                    className={`px-4 py-2 flex items-center gap-2 text-sm transition-all border-l border-zinc-800 ${tool === "keep" ? "bg-green-500 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                  >
                    <Brush size={16} /> Mantener
                  </button>
                  <button
                    onClick={() => setTool("remove")}
                    className={`px-4 py-2 flex items-center gap-2 text-sm transition-all border-l border-zinc-800 ${tool === "remove" ? "bg-red-500 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                  >
                    <Eraser size={16} /> Borrar
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={zoomOut}
                    className="p-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={zoomIn}
                    className="p-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={fitToScreen}
                    className="p-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all"
                    title="Centrar Imagen"
                  >
                    <Maximize size={16} />
                  </button>

                  <button
                    onClick={() => setShowMask(!showMask)}
                    className="ml-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-all flex items-center gap-2"
                  >
                    {showMask ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
                    {showMask ? "Ocultar Rojo" : "Ver Rojo"}
                  </button>
                </div>
              </div>

              {/* CONTENEDOR PAN & ZOOM */}
              <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] border border-zinc-800 min-h-[50vh] md:min-h-[60vh] w-full touch-none"
                onMouseLeave={handleCanvasMouseLeave}
              >
                <div className="absolute inset-0 bg-zinc-950/80 pointer-events-none" />

                <canvas
                  ref={canvasRef}
                  width={imageSize?.width || 0} // AHORA REACT SABE EL TAMAÑO REAL DEL CANVAS
                  height={imageSize?.height || 0} // SOLUCIONA EL RECORTE VISUAL
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onTouchStart={handleCanvasMouseDown}
                  onTouchMove={handleCanvasMouseMove}
                  onTouchEnd={handleCanvasMouseUp}
                  className={`absolute top-0 left-0 touch-none ${tool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-none"}`}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                  }}
                />

                {/* Cursor del Pincel en pantalla */}
                {isHovering && tool !== "pan" && (
                  <div
                    className="absolute pointer-events-none rounded-full border-[2px] border-white z-50 mix-blend-difference"
                    style={{
                      width: `${brushSize * zoom}px`,
                      height: `${brushSize * zoom}px`,
                      left: `${cursorPos.x}px`,
                      top: `${cursorPos.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">Pincel:</span>
                  <input
                    type="range"
                    min={5}
                    max={300}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    disabled={tool === "pan"}
                  />
                </div>

                <button
                  onClick={applyChanges}
                  disabled={isProcessing}
                  className="px-8 py-2 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} />{" "}
                  {isProcessing ? "Procesando..." : "Terminar y Recortar"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Brush size={14} /> Controles:
                </h3>
                <ul className="text-xs text-zinc-400 space-y-3">
                  <li>
                    🔍 <strong>Zoom:</strong> Usa la rueda del ratón o los
                    botones (+ / -). Puedes pulsar [🔲] para Centrar.
                  </li>
                  <li>
                    🖐️ <strong>Mover:</strong> Selecciona la herramienta "Mover"
                    y arrastra la foto, o mantén presionado el{" "}
                    <strong>botón central</strong> del ratón en cualquier
                    momento.
                  </li>
                  <li>
                    ✅ <strong>Mantener:</strong> Pinta sobre lo rojo para
                    recuperar la imagen original.
                  </li>
                  <li>
                    ❌ <strong>Borrar:</strong> Pinta de rojo para que esa parte
                    sea transparente.
                  </li>
                </ul>
              </div>
              <button
                onClick={reset}
                className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 font-semibold rounded-xl hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Subir otra imagen
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP: RESULTADO (CON EL SLIDER ARREGLADO) */}
        {step === "result" && originalImage && resultImage && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-col h-[500px] md:h-[600px] relative">
              <div
                className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/50 flex items-center justify-center select-none"
                ref={containerRef}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20" />

                {/* Los fondos personalizados deben ir por debajo de ambas imágenes */}
                {bgMode === "color" && (
                  <div
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: bgColor }}
                  />
                )}
                {bgMode === "blur" && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={originalImage}
                      className="w-full h-full object-cover blur-xl scale-110"
                      alt="Fondo borroso"
                    />
                  </div>
                )}

                <div className="relative w-full h-full flex items-center justify-center z-10">
                  {/* IMAGEN SIN FONDO (Va abajo, mostrando el fondo transparente o de color) */}
                  <img
                    src={resultImage}
                    className="absolute w-full h-full object-contain pointer-events-none"
                    alt="Sin Fondo"
                  />

                  {/* IMAGEN ORIGINAL (Va arriba, recortada por la línea del slider para ocultar su lado derecho) */}
                  <img
                    src={originalImage}
                    className="absolute w-full h-full object-contain pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    alt="Original"
                  />

                  {/* SLIDER HANDLE */}
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
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <Palette className="text-pink-400" size={20} />
                  <h2 className="text-lg font-bold text-white">
                    Personalizar Fondo
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setBgMode("transparent")}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${bgMode === "transparent" ? "bg-zinc-800 border-pink-500 text-white" : "bg-zinc-950 border-zinc-800/50 text-zinc-400"}`}
                  >
                    <span className="font-semibold text-sm">Transparente</span>
                  </button>
                  <button
                    onClick={() => setBgMode("blur")}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${bgMode === "blur" ? "bg-zinc-800 border-pink-500 text-white" : "bg-zinc-950 border-zinc-800/50 text-zinc-400"}`}
                  >
                    <Droplet size={16} />{" "}
                    <span className="font-semibold text-sm">Desenfoque</span>
                  </button>
                  <div
                    className={`p-4 rounded-xl border transition-all ${bgMode === "color" ? "bg-zinc-800 border-pink-500" : "bg-zinc-950 border-zinc-800/50"}`}
                  >
                    <button
                      onClick={() => setBgMode("color")}
                      className="flex items-center gap-3 w-full mb-3 text-white"
                    >
                      <div
                        className="w-8 h-8 rounded-lg border border-zinc-700"
                        style={{ backgroundColor: bgColor }}
                      />
                      <span className="font-semibold text-sm">
                        Color Sólido
                      </span>
                    </button>
                    {bgMode === "color" && (
                      <div className="pt-2 border-t border-zinc-800/50 flex gap-2 flex-wrap">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setBgColor(c)}
                            className="w-6 h-6 rounded-full border-2"
                            style={{
                              backgroundColor: c,
                              borderColor:
                                bgColor === c ? "#ec4899" : "transparent",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-6 flex flex-col gap-3">
                  <button
                    onClick={handleDownload}
                    className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Descargar
                  </button>
                  <button
                    onClick={reset}
                    className="w-full py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Otra imagen
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
