import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Copy, Check, Droplet, Target, Save } from "lucide-react";
import { usePaletteExtractorViewModel } from "../viewModel/Usepaletteextractorviewmodel";
import { useSavedPalettes } from "../viewModel/useSavedPalettes";
import { gooeyToast } from "goey-toast";

export function PaletteExtractor() {
  const vm = usePaletteExtractorViewModel();
  const { savePalette } = useSavedPalettes();
  const [showNameModal, setShowNameModal] = useState(false);
  const [paletteName, setPaletteName] = useState("");
  const {
    state,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    processFile,
    togglePicking,
    handleImageClick,
    copyToClipboard,
    reset,
  } = vm;

  const {
    step,
    isDragging,
    imageSrc,
    palette,
    pickedColor,
    isPicking,
    copiedHex,
  } = state;

  return (
    <div className="w-full mx-auto p-4 md:p-8">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-black dark:text-white flex items-center justify-center md:justify-start gap-3">
          Paleta de Colores
        </h1>
        <p className="text-black/80 dark:text-white/80 text-lg max-w-2xl mx-auto md:mx-0">
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
                : "border-zinc-700 hover:border-zinc-500 backdrop-blur-lg bg-white/8 hover:bg-zinc-900/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/70 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/70 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

            <div className="w-24 h-24 backdrop-blur-lg bg-white/8 rounded-full flex items-center justify-center mb-6 shadow-2xl text-black dark:text-white group-hover:scale-110 group-hover:text-emerald-400 transition-all relative z-10">
              <Droplet size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-black dark:text-white group-hover:text-emerald-400 transition-colors relative z-10">
              Arrastra una imagen
            </h3>
            <p className="text-black/80 dark:text-white/80 group-hover:text-emerald-400 transition-colors mb-6 text-center max-w-md relative z-10">
              Fotografías, ilustraciones o capturas de pantalla.
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
              <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
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
            <div className="backdrop-blur-lg bg-white/8 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-8">
              {/* Imagen */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div
                  className={`h-[300px] md:h-[450px] rounded-2xl overflow-hidden backdrop-blur-lg bg-white/8 flex items-center justify-center relative transition-all ${
                    isPicking
                      ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20" />

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
                    className={`max-w-full max-h-full object-contain relative z-10 transition-all ${
                      isPicking ? "cursor-crosshair" : ""
                    }`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={togglePicking}
                    className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isPicking
                        ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-white dark:bg-black text-black dark:text-white hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    {isPicking ? "Cancelar" : "Extraer color"}
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 py-3 px-4 bg-white dark:bg-black text-black dark:text-white font-semibold rounded-xl hover:text-white hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
                  >
                    Subir otra
                  </button>
                </div>
              </div>

              {/* Paleta */}
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Colores Dominantes
                  </h3>
                  {palette.length > 0 && (
                    <button
                      onClick={() => setShowNameModal(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 text-sm"
                    >
                      <Save size={16} /> Guardar Paleta
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {palette.map((color, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden backdrop-blur-lg bg-white/8 hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1"
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
                        <span className="text-sm font-bold text-black dark:text-white mb-0.5 uppercase tracking-wide">
                          {color.hex}
                        </span>
                        <span className="text-xs text-black/80 dark:text-white/80 font-mono">
                          rgb({color.r}, {color.g}, {color.b})
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-black/80 dark:border-white/80">
                  <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 mb-4">
                    Color Específico
                  </h3>

                  {pickedColor ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group cursor-pointer flex rounded-2xl overflow-hidden backdrop-blur-lg bg-white/8 hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
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
                        <span className="text-lg font-bold text-black dark:text-white mb-1 uppercase tracking-wide">
                          {pickedColor.hex}
                        </span>
                        <span className="text-sm text-black/80 dark:text-white/80 font-mono">
                          rgb({pickedColor.r}, {pickedColor.g}, {pickedColor.b})
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="backdrop-blur-lg bg-white/8 border border-zinc-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-zinc-900/50">
                      <Target className="text-zinc-600" size={24} />
                      <p className="text-sm text-black/80 dark:text-white/80">
                        Pulsa{" "}
                        <strong className="text-black dark:text-white">
                          Extraer color
                        </strong>{" "}
                        y haz clic en cualquier parte de la foto.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="backdrop-blur-lg bg-white/8 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-black dark:text-white mb-4 uppercase tracking-wider">
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

      {/* Modal para Nombre de Paleta */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette size={20} className="text-emerald-500" /> Guardar Paleta
              </h3>
              <p className="text-zinc-400 text-sm">
                Ingresa un nombre para identificar esta paleta.
              </p>
              <input
                autoFocus
                type="text"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    savePalette(palette, paletteName.trim());
                    gooeyToast.success("¡Paleta guardada exitosamente!");
                    setShowNameModal(false);
                    setPaletteName("");
                  }
                  if (e.key === 'Escape') setShowNameModal(false);
                }}
                placeholder="Ej. Colores de Otoño, Tema Oscuro..."
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    savePalette(palette, paletteName.trim());
                    gooeyToast.success("¡Paleta guardada exitosamente!");
                    setShowNameModal(false);
                    setPaletteName("");
                  }}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
