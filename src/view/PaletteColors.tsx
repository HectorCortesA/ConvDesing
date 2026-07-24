import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Trash2, Palette, FolderPlus, ArrowLeft, Plus, Edit2 } from "lucide-react";
import { useSavedPalettes, SavedPalette } from "../viewModel/useSavedPalettes";
import { gooeyToast } from "goey-toast";
import { AnimatedFolder } from "../components/Caperta/AnimatedFolder";
import { ColorGraphPicker } from "../components/ColorGraphPicker";
import { ColorTonalPicker } from "../components/ColorTonalPicker";

export default function PaletteColors() {
  const {
    palettes,
    folders,
    deletePalette,
    createFolder,
    deleteFolder,
    movePalette,
    renamePalette,
    savePalette
  } = useSavedPalettes();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isAddingToFolder, setIsAddingToFolder] = useState(false);

  // States for Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [showCreatePaletteModal, setShowCreatePaletteModal] = useState(false);
  const [paletteMode, setPaletteMode] = useState<"graph" | "tonal">("graph");
  const [customPaletteName, setCustomPaletteName] = useState("");
  const [customColors, setCustomColors] = useState<string[]>([]);

  // States for Drag and Drop
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // States for Inline Renaming
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPaletteId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingPaletteId]);

  const copyPaletteToClipboard = (paletteId: string, colors: { hex: string }[]) => {
    const hexArray = colors.map((c) => c.hex).join(", ");
    navigator.clipboard.writeText(hexArray);
    setCopiedId(paletteId);
    gooeyToast.success("¡Colores copiados al portapapeles!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      gooeyToast.success("Carpeta creada");
      setShowFolderModal(false);
      setNewFolderName("");
    }
  };

  const handleCreateCustomPalette = () => {
    const rgbColors = customColors.map(hex => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        hex,
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { hex, r: 0, g: 0, b: 0 };
    });

    savePalette(rgbColors, customPaletteName.trim() || "Paleta Personalizada");
    gooeyToast.success("Paleta guardada exitosamente");
    setShowCreatePaletteModal(false);
    setCustomPaletteName("");
    setCustomColors([]);
  };

  const handleRenameSubmit = (paletteId: string) => {
    if (editingName.trim()) {
      renamePalette(paletteId, editingName.trim());
      gooeyToast.success("Nombre actualizado");
    }
    setEditingPaletteId(null);
  };

  // Derive state based on active view
  const standalonePalettes = palettes.filter(p => !p.folderId);
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const folderPalettes = palettes.filter(p => p.folderId === activeFolderId);

  // Reusable palette card component
  const renderPaletteCard = (palette: SavedPalette) => {
    const isEditing = editingPaletteId === palette.id;
    return (
      <motion.div
        key={palette.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        draggable={!isEditing}
        onDragStart={(e: any) => {
          e.dataTransfer.setData("text/plain", palette.id);
        }}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col cursor-grab active:cursor-grabbing"
      >
        <div className="flex h-24 w-full">
          {palette.colors.map((color, idx) => (
            <div
              key={idx}
              className="flex-1 h-full hover:flex-[1.5] transition-all duration-300 cursor-pointer relative"
              style={{ backgroundColor: color.hex }}
              title={color.hex}
              onClick={() => {
                navigator.clipboard.writeText(color.hex);
                gooeyToast.success(`Color ${color.hex} copiado!`);
              }}
            />
          ))}
        </div>

        {/* Name and Buttons Section */}
        <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between group/name gap-2">
          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRenameSubmit(palette.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(palette.id);
                  if (e.key === 'Escape') setEditingPaletteId(null);
                }}
                className="w-full bg-white dark:bg-zinc-800 border border-emerald-500 rounded px-2 py-1 text-sm font-semibold text-black dark:text-white outline-none"
              />
            ) : (
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate cursor-pointer"
                  onDoubleClick={() => {
                    setEditingName(palette.name || "Paleta");
                    setEditingPaletteId(palette.id);
                  }}
                >
                  {palette.name || "Paleta Nueva"}
                </span>
                <button
                  onClick={() => {
                    setEditingName(palette.name || "Paleta");
                    setEditingPaletteId(palette.id);
                  }}
                  className="opacity-0 group-hover/name:opacity-100 text-zinc-400 hover:text-emerald-500 transition-opacity flex-shrink-0"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isAddingToFolder && activeFolderId ? (
              <button
                onClick={() => {
                  movePalette(palette.id, activeFolderId);
                  gooeyToast.success("Paleta añadida a la carpeta");
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Añadir
              </button>
            ) : (
              <>
                {activeFolderId && (
                  <button
                    onClick={() => {
                      movePalette(palette.id, null);
                      gooeyToast.info("Paleta sacada de la carpeta");
                    }}
                    className="px-2 py-1 text-xs font-bold rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Quitar
                  </button>
                )}
                <button
                  onClick={() => copyPaletteToClipboard(palette.id, palette.colors)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${copiedId === palette.id
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white"
                    }`}
                  title="Copiar todos los HEX"
                >
                  {copiedId === palette.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Estás seguro de que deseas eliminar esta paleta?")) {
                      deletePalette(palette.id);
                      gooeyToast.success("Paleta eliminada");
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-500/20 dark:hover:border-red-500/50 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Eliminar paleta"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full mx-auto p-4 md:p-8">
      {/* Header General o de Carpeta */}
      <header className="mb-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          {activeFolderId ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveFolderId(null);
                  setIsAddingToFolder(false);
                }}
                className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft size={24} className="text-black dark:text-white" />
              </button>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-black dark:text-white">
                {activeFolder?.name}
              </h1>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight text-black dark:text-white flex items-center justify-center md:justify-start gap-3">
                Paletas Guardadas
              </h1>
              <p className="text-black/80 dark:text-white/80 text-lg max-w-2xl mx-auto md:mx-0">
                Tus esquemas de color favoritos listos para usar en tus próximos diseños.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeFolderId ? (
            <button
              onClick={() => setIsAddingToFolder(!isAddingToFolder)}
              className={`px-4 py-2 font-bold rounded-lg transition-colors flex items-center gap-2 ${isAddingToFolder
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                }`}
            >
              {isAddingToFolder ? <Check size={18} /> : <Plus size={18} />}
              {isAddingToFolder ? "Listo" : "Añadir Paletas"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreatePaletteModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
              >
                Crear Paleta
              </button>
              <button
                onClick={() => setShowFolderModal(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
              >
                Crear Carpeta
              </button>
            </div>
          )}
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2">
            <Palette className="text-emerald-500" size={20} />
            <span className="font-bold text-black dark:text-white">{palettes.length} total</span>
          </div>
        </div>
      </header>

      {/* Contenido cuando ESTAMOS DENTRO de una carpeta */}
      {activeFolderId && (
        <>
          {isAddingToFolder ? (
            <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-400 mb-4">Selecciona paletas sueltas para añadirlas a "{activeFolder?.name}"</h3>
              {standalonePalettes.length === 0 ? (
                <p className="text-zinc-400">No hay paletas sueltas disponibles.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {standalonePalettes.map(renderPaletteCard)}
                </div>
              )}
            </div>
          ) : (
            folderPalettes.length === 0 ? (
              <div className="w-full h-[300px] flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-950/50 p-8">
                <FolderPlus size={48} className="text-zinc-400 dark:text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-black dark:text-white mb-2">Esta carpeta está vacía</h3>
                <p className="text-zinc-500 max-w-md mb-6">
                  Usa el botón superior para mover tus paletas guardadas aquí.
                </p>
                <button
                  onClick={() => setIsAddingToFolder(true)}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  Añadir Paletas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {folderPalettes.map(renderPaletteCard)}
                </AnimatePresence>
              </div>
            )
          )}
        </>
      )}

      {/* Contenido UNIFICADO en la VISTA PRINCIPAL (Carpetas y paletas juntas) */}
      {!activeFolderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {/* Primero renderizamos las carpetas */}
            {folders.map(folder => {
              const isDragOver = dragOverFolderId === folder.id;
              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`rounded-2xl transition-all ${isDragOver ? "ring-2 ring-emerald-500 bg-emerald-500/10 scale-105" : ""}`}
                >
                  <AnimatedFolder
                    name={folder.name}
                    itemCount={palettes.filter(p => p.folderId === folder.id).length}
                    onClick={() => setActiveFolderId(folder.id)}
                    onDelete={() => {
                      if (confirm(`¿Eliminar la carpeta "${folder.name}"? Las paletas dentro se mantendrán guardadas de forma suelta.`)) {
                        deleteFolder(folder.id);
                        gooeyToast.success("Carpeta eliminada");
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault(); // Permitir el drop
                      setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverFolderId(null);
                      const paletteId = e.dataTransfer.getData("text/plain");
                      if (paletteId) {
                        movePalette(paletteId, folder.id);
                        gooeyToast.success(`Paleta movida a ${folder.name}`);
                      }
                    }}
                  />
                </motion.div>
              );
            })}

            {/* Luego renderizamos las paletas sueltas */}
            {standalonePalettes.map(renderPaletteCard)}
          </AnimatePresence>

          {folders.length === 0 && standalonePalettes.length === 0 && (
            <div className="col-span-full w-full h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-950/50 p-8">
              <p className="text-zinc-500">
                No tienes paletas guardadas. Empieza extrayendo colores de tus imágenes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear Carpeta */}
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                <FolderPlus size={20} className="text-emerald-500" /> Nueva Carpeta
              </h3>
              <p className="text-zinc-500 text-sm">
                Ingresa un nombre para tu nueva colección de paletas.
              </p>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowFolderModal(false);
                }}
                placeholder="Ej. Diseño Web, Proyecto Alpha..."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para Crear Paleta Personalizada */}
      <AnimatePresence>
        {showCreatePaletteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                  Nueva Paleta
                </h3>
                <p className="text-zinc-500 text-sm">
                  Haz clic en los colores para modificarlos o escribe su código HEX.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <input
                  autoFocus
                  type="text"
                  value={customPaletteName}
                  onChange={(e) => setCustomPaletteName(e.target.value)}
                  placeholder="Nombre de la paleta (Ej. Neón 80s)"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />

                <div className="flex w-full p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => setPaletteMode("graph")}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${paletteMode === "graph"
                      ? "bg-white dark:bg-zinc-950 text-emerald-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                  >
                    Modo Grafo
                  </button>
                  <button
                    onClick={() => setPaletteMode("tonal")}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${paletteMode === "tonal"
                      ? "bg-white dark:bg-zinc-950 text-emerald-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                  >
                    Modo Tonalidad
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 min-h-[250px] justify-center">
                  {paletteMode === "graph" ? (
                    <ColorGraphPicker onChange={setCustomColors} />
                  ) : (
                    <ColorTonalPicker onChange={setCustomColors} />
                  )}
                </div>

                {/* Tira de colores añadidos */}
                <div className="w-full">
                  <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    Colores Resultantes {customColors.length}
                  </h4>
                  {customColors.length === 0 ? (
                    <div className="w-full h-16 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 text-sm">
                      Cargando colores...
                    </div>
                  ) : (
                    <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800">
                      <AnimatePresence>
                        {customColors.map((color, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "100%", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="flex-1"
                            style={{ backgroundColor: color }}
                            title={color.toUpperCase()}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowCreatePaletteModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCustomPalette}
                  disabled={customColors.length === 0}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Paleta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
