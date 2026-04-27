import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  Image as ImageIcon,
  Download,
  Settings2,
  RefreshCw,
  X,
  ArrowRight,
  FileImage,
  Plus,
  Trash2,
  Archive,
} from "lucide-react";

import {
  FORMATS,
  formatBytes,
  getFormatLabel,
  getFormatExtension,
} from "../model/imageConvertermodel";
import { useImageConverter } from "../viewModel/useImageConverter";

const FORMAT_ICON_MAP: Record<string, typeof ImageIcon> = {
  "image/png": FileImage,
  "image/jpeg": ImageIcon,
  "image/webp": ImageIcon,
  "image/gif": Archive,
};

export function ImageConverter() {
  const {
    images,
    activeIndex,
    activeImage,
    isDragging,
    isZipping,
    fileInputRef,
    globalFormat,
    globalQuality,
    applyToAll,
    allConverted,
    isAnyConverting,
    convertedCount,
    setActiveIndex,
    setApplyToAll,
    handleGlobalFormatChange,
    handleGlobalQualityChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    removeImage,
    updateActiveImage,
    convertSingleImage,
    convertAll,
    downloadAllAsZip,
    clearAll,
  } = useImageConverter();

  return (
    <div className="w-full mx-auto p-4 md:p-8">
      {/* Encabezado */}
      <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-black dark:text-white">
            Convertidor Múltiple
          </h1>
          <p className="text-black dark:text-white text-lg max-w-2xl">
            Sube varias imágenes, ajusta sus formatos y descárgalas en un
            archivo ZIP.
          </p>
        </div>

        {images.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 text-sm font-medium text-zinc-300"
            >
              <Plus size={16} />
              Añadir más
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500/30 border border-red-500/50 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 text-sm font-medium text-red-700"
            >
              <Trash2 size={16} />
              Limpiar todo
            </button>
          </div>
        )}
      </header>

      {/* Barra superior de controles globales */}
      <div className="border-zinc-800 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-lg bg-white/8">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <h3 className="text-sm font-medium text-black dark:text-white mb-3 uppercase tracking-wider">
              Formato de Salida Predeterminado
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FORMATS.map((f) => {
                const Icon = FORMAT_ICON_MAP[f.id] || FileImage;
                const isActive = globalFormat === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleGlobalFormatChange(f.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      isActive
                        ? "backdrop-blur-lg bg-white/20 shadow-lg"
                        : `backdrop-blur-lg bg-white/10 ${f.hover}`
                    }`}
                  >
                    <Icon
                      size={24}
                      className={`mb-2 ${isActive ? f.color : "text-black"}`}
                    />
                    <span
                      className={`text-xs font-semibold ${isActive ? "text-black dark:text-white" : "text-black dark:text-white"}`}
                    >
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-px h-16 bg-zinc-800 hidden md:block"></div>

          <div className="w-full md:w-80">
            <h3 className="text-sm font-medium text-black dark:text-white mb-3 uppercase tracking-wider">
              Calidad
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col backdrop-blur-lg bg-white/40 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-black dark:text-white">
                    {globalFormat === "image/jpeg" ||
                    globalFormat === "image/webp"
                      ? "Ajuste de Compresión"
                      : "Sin pérdida"}
                  </span>
                  <span
                    className={`text-xs font-bold ${globalFormat === "image/jpeg" || globalFormat === "image/webp" ? "text-black dark:text-white" : "text-black dark:text-white"}`}
                  >
                    {globalQuality}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={globalQuality}
                  disabled={
                    globalFormat !== "image/jpeg" &&
                    globalFormat !== "image/webp"
                  }
                  onChange={(e) =>
                    handleGlobalQualityChange(Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        multiple
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {images.length === 0 ? (
          /* Área de subida inicial (Dropzone) */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative w-full h-[400px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${
              isDragging
                ? "backdrop-blur-lg bg-white/20"
                : "border-black hover:border-white backdrop-blur-lg bg-white/10"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-indigo-500/5 to-transparent blur-3xl opacity-50"></div>
            </div>

            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-xl text-zinc-400 z-10">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-2xl font-semibold mb-2 z-10 text-center px-4 text-white">
              Arrastra y suelta tus imágenes aquí
            </h3>
            <p className="text-zinc-500 mb-6 z-10 text-center px-4">
              Selecciona múltiples archivos para convertirlos al instante.
            </p>
            <button className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors z-10 shadow-lg">
              Explorar archivos
            </button>
          </motion.div>
        ) : (
          /* Interfaz Principal con Múltiples Imágenes */
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Barra lateral / Lista de imágenes */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="backdrop-blur-lg bg-white/20 rounded-3xl p-4 flex flex-col h-[600px] shadow-xl">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="font-semibold text-zinc-200">
                    Galería ({images.length})
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative group flex items-center p-2 rounded-xl cursor-pointer transition-all ${
                        activeIndex === idx
                          ? "backdrop-blur-lg bg-white/10"
                          : "bg-zinc-950/20 border-transparent border hover:border-zinc-700"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-black/50 overflow-hidden flex-shrink-0 relative">
                        <img
                          src={img.previewUrl}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                        {img.convertedUrl && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                          </div>
                        )}
                        {img.isConverting && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <RefreshCw
                              size={14}
                              className="animate-spin text-white"
                            />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 overflow-hidden flex-1">
                        <p
                          className={`text-sm truncate font-medium ${activeIndex === idx ? "text-black" : "text-zinc-300"}`}
                        >
                          {img.file.name}
                        </p>
                        <p className="text-xs text-white truncate">
                          {formatBytes(img.convertedSize || img.originalSize)} •{" "}
                          {getFormatLabel(img.targetFormat)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className={`absolute right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all ${
                          activeIndex === idx
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-pointer text-zinc-500 hover:text-zinc-300 gap-2 mt-2"
                  >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Añadir más</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Central: Vista previa */}
            <div className="lg:col-span-6 backdrop-blur-lg bg-white/20 border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
              {activeImage ? (
                <>
                  <div className="flex-1 p-6 flex items-center justify-center relative overflow-hidden bg-black/20">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20"></div>

                    <AnimatePresence mode="wait">
                      <motion.img
                        key={
                          activeImage.id +
                          (activeImage.convertedUrl ? "converted" : "original")
                        }
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        src={activeImage.convertedUrl || activeImage.previewUrl}
                        alt="Vista previa"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10"
                      />
                    </AnimatePresence>
                  </div>

                  <div className="h-16 backdrop-blur-lg bg-white/20 border-t border-zinc-800 flex items-center justify-between px-6 text-sm">
                    <div className="flex items-center gap-4 text-black">
                      <div className="flex items-center gap-1.5">
                        <FileImage size={16} />
                        <span className="truncate max-w-[150px]">
                          {activeImage.file.name}
                        </span>
                      </div>
                      {activeImage.dimensions && (
                        <>
                          <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                          <span>
                            {activeImage.dimensions.w} ×{" "}
                            {activeImage.dimensions.h} px
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-medium">
                      <span className="text-black line-through decoration-zinc-500/50">
                        {activeImage.convertedUrl
                          ? formatBytes(activeImage.originalSize)
                          : ""}
                      </span>
                      {activeImage.convertedUrl && (
                        <ArrowRight size={14} className="text-black" />
                      )}
                      <span
                        className={
                          activeImage.convertedUrl
                            ? activeImage.convertedSize <
                              activeImage.originalSize
                              ? "text-blue-500"
                              : "text-blue-500"
                            : "text-black"
                        }
                      >
                        {activeImage.convertedUrl
                          ? formatBytes(activeImage.convertedSize)
                          : formatBytes(activeImage.originalSize)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-dark">
                  <p>Selecciona una imagen de la galería</p>
                </div>
              )}
            </div>

            {/* Panel Derecho: Controles */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {activeImage && (
                <div className="backdrop-blur-lg bg-white/20 rounded-3xl p-5 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Settings2
                        size={18}
                        className="text-white dark:text-white"
                      />
                      <h2>Ajustes Específicos</h2>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-black dark:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="rounded bg-white text-black dark:text-white focus:ring-white focus:ring-offset-white/100"
                      />
                      Aplicar a todas
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">
                      Formato de esta imagen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATS.map((format) => (
                        <button
                          key={format.id}
                          onClick={() =>
                            updateActiveImage({ targetFormat: format.id })
                          }
                          className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                            activeImage.targetFormat === format.id
                              ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                              : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                          }`}
                        >
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {(activeImage.targetFormat === "image/jpeg" ||
                      activeImage.targetFormat === "image/webp") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-400">
                              Calidad
                            </label>
                            <span className="text-sm font-bold text-white">
                              {activeImage.quality}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="1"
                            value={activeImage.quality}
                            onChange={(e) =>
                              updateActiveImage({
                                quality: Number(e.target.value),
                              })
                            }
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!activeImage.convertedUrl ? (
                    <button
                      onClick={() => convertSingleImage(activeIndex)}
                      disabled={activeImage.isConverting}
                      className="mt-2 w-full py-3 rounded-xl font-bold text-white bg-indigo-600/80 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm border border-indigo-500/50"
                    >
                      {activeImage.isConverting ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />{" "}
                          Convirtiendo...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} /> Convertir Esta
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateActiveImage({ convertedUrl: null })
                        }
                        className="flex-1 py-3 rounded-xl font-medium text-zinc-400 bg-zinc-950 border border-zinc-800 hover:text-white transition-all text-sm"
                      >
                        Revertir
                      </button>
                      <a
                        href={activeImage.convertedUrl}
                        download={`convertida_${activeImage.file.name.split(".")[0]}.${getFormatExtension(activeImage.targetFormat)}`}
                        className="flex-1 py-3 rounded-xl font-bold text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Download size={16} /> Descargar
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones en lote */}
              <div className="backdrop-blur-lg bg-white/20 rounded-3xl p-5 flex flex-col gap-3 mt-auto shadow-xl">
                <div className="text-sm font-medium text-black dark:text-white mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full"></div>
                  Acciones Globales
                </div>

                <button
                  onClick={convertAll}
                  disabled={isAnyConverting || allConverted}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                    allConverted
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)] disabled:opacity-50"
                  }`}
                >
                  {isAnyConverting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />{" "}
                      Procesando Lote...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} /> Convertir Todas (
                      {images.filter((i) => !i.convertedUrl).length})
                    </>
                  )}
                </button>

                <button
                  onClick={downloadAllAsZip}
                  disabled={convertedCount === 0 || isZipping}
                  className="w-full py-3 rounded-xl font-bold text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:shadow-none"
                >
                  {isZipping ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />{" "}
                      Comprimiendo ZIP...
                    </>
                  ) : (
                    <>
                      <Archive size={18} /> Descargar ZIP ({convertedCount})
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
