import { useState, useRef, useEffect } from "react";
import { useBackground } from "../contexts/BackgroundContext";
import {
  checkForUpdate,
  fetchLatestRelease,
  getCurrentVersion,
  type ReleaseInfo,
  type ReleaseAsset,
} from "../components/Updater/updaterService";
import { gooeyToast } from "goey-toast";

const getRelevantAssets = (assets: ReleaseAsset[]) => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isWindows = userAgent.includes("win");
  const isMac = userAgent.includes("mac");
  const isLinux = userAgent.includes("linux") || userAgent.includes("x11");

  const filtered = assets.filter((asset) => {
    const name = asset.name.toLowerCase();
    if (isWindows) return name.endsWith(".exe");
    if (isMac)
      return (
        name.endsWith(".dmg") || name.endsWith(".pkg") || name.endsWith(".zip")
      );
    if (isLinux)
      return (
        name.endsWith(".appimage") ||
        name.endsWith(".deb") ||
        name.endsWith(".rpm")
      );
    return true;
  });

  return filtered.length > 0 ? filtered : assets;
};

export default function Configuracion() {
  const {
    backgroundImage,
    setBackgroundImage,
    savedImages,
    addSavedImage,
    removeSavedImage,
  } = useBackground();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Update state ────────────────────────────────────────────
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ReleaseAsset | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    setPreviewImage(backgroundImage);
  }, [backgroundImage]);

  // Listen for download progress from Electron main process
  useEffect(() => {
    if (window.ipcRenderer) {
      const handler = (_event: unknown, progress: number) => {
        setDownloadProgress(progress);
      };
      window.ipcRenderer.on('download-progress', handler);
      return () => {
        window.ipcRenderer.off('download-progress', handler);
      };
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setBackgroundImage(imageUrl);
        addSavedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };


  const openFileExplorer = () => {
    fileInputRef.current?.click();
  };

  // ── Update handlers ─────────────────────────────────────────
  const handleCheckForUpdate = async () => {
    setIsChecking(true);
    setUpdateInfo(null);
    setSelectedAsset(null);
    setHasChecked(false);

    try {
      const release = await checkForUpdate();
      if (release) {
        setUpdateInfo(release);

        // Auto-seleccionar si solo hay un archivo para este sistema
        const relevantAssets = getRelevantAssets(release.assets);
        if (relevantAssets.length === 1) {
          setSelectedAsset(relevantAssets[0]);
        }

        gooeyToast.info("Actualización encontrada", {
          description: `Versión ${release.version} disponible`,
          preset: "smooth",
        });
      } else {
        // Even if no update, try to fetch latest to show info
        const latest = await fetchLatestRelease();
        if (latest) {
          // No update available — already on latest
          setUpdateInfo(null);
        }
        gooeyToast.success("Sin actualizaciones", {
          description: "Ya tienes la versión más reciente",
          preset: "smooth",
        });
      }
    } catch {
      gooeyToast.error("Error", {
        description: "No se pudo verificar actualizaciones",
        preset: "smooth",
      });
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  };

  const handleSelectAsset = (asset: ReleaseAsset) => {
    setSelectedAsset(asset);
  };

  const handleDownloadClick = () => {
    if (!selectedAsset) return;
    setShowInstallDialog(true);
  };

  const handleConfirmDownload = async () => {
    if (!selectedAsset) return;
    setShowInstallDialog(false);
    setIsDownloading(true);
    setDownloadProgress(0);

    gooeyToast.info("Descargando actualización", {
      description: `Descargando ${selectedAsset.name}...`,
      preset: "smooth",
      duration: 5000,
    });

    // Check if running in Electron
    if (window.ipcRenderer) {
      try {
        // Download via Electron main process (saves to disk with progress)
        const filePath: string = await window.ipcRenderer.invoke(
          'download-update',
          selectedAsset.downloadUrl,
          selectedAsset.name
        );

        setDownloadProgress(100);

        gooeyToast.success("Descarga completada", {
          description: "Instalando actualización...",
          preset: "smooth",
          duration: 3000,
        });

        // Execute the installer
        const result = await window.ipcRenderer.invoke('install-update', filePath) as { success: boolean; error?: string };

        if (result.success) {
          gooeyToast.success("Instalando", {
            description: "La aplicación se cerrará para completar la instalación.",
            preset: "smooth",
            duration: 5000,
          });
        } else {
          throw new Error(result.error || 'Error al instalar');
        }
      } catch (error) {
        console.error('[Updater] Download/install error:', error);
        gooeyToast.error("Error en la actualización", {
          description: "No se pudo descargar o instalar la actualización. Intenta de nuevo.",
          preset: "smooth",
          duration: 8000,
        });
      } finally {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    } else {
      // Fallback for non-Electron environments (web browser)
      window.open(selectedAsset.downloadUrl, "_blank");
      setTimeout(() => {
        setIsDownloading(false);
        gooeyToast.success("Descarga iniciada", {
          description: "El archivo se descargó en tu navegador. Ejecútalo manualmente para instalar.",
          preset: "smooth",
          duration: 8000,
        });
      }, 2000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-black dark:text-white flex items-center justify-center md:justify-start gap-3">
        Configuración
      </h1>

      {/* ── Background settings ──────────────────────────────── */}
      <div className="backdrop-blur-lg bg-white/8 rounded-lg shadow p-4">
        <p className="text-black dark:text-white text-lg mb-4 flex items-center justify-center md:justify-start gap-3">
          Cambiar fondo
        </p>
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex items-center mt-2 gap-4 min-w-max">
            <div
              onClick={openFileExplorer}
              className="w-90 h-40 rounded flex-shrink-0 backdrop-blur-lg bg-white/8  cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center justify-center"
            >
              <svg
                className="w-12 h-12 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300 mt-2 text-center px-2">
                Subir imagen
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Show current selected background */}
            <div className="w-90 h-40 rounded flex-shrink-0 bg-gray-300 dark:bg-gray-700 overflow-hidden relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Fondo actual"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm text-center p-2">
                  Sin fondo seleccionado
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                Fondo actual
              </div>
            </div>

            {/* Saved images */}
            {savedImages.map((image, index) => (
              <div key={index} className="relative flex-shrink-0 group">
                <div
                  onClick={() => setBackgroundImage(image)}
                  className={`w-90 h-40  rounded cursor-pointer overflow-hidden transition-all duration-300 ${backgroundImage === image
                    ? "ring-4 ring-blue-500 shadow-lg"
                    : "hover:shadow-lg hover:scale-105"
                    }`}
                >
                  <img
                    src={image}
                    alt={`Guardado ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSavedImage(image);
                  }}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar imagen guardada"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Updates section ──────────────────────────────────── */}
      <div className="backdrop-blur-lg bg-white/8 rounded-lg shadow p-4 mt-4">
        <p className="text-black dark:text-white text-lg mb-2 flex items-center justify-center md:justify-start gap-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizaciones
        </p>

        {/* Current version */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Versión actual:
          </span>
          <span className="text-sm font-mono font-semibold text-black dark:text-white bg-white/10 px-2 py-0.5 rounded">
            v{getCurrentVersion()}
          </span>
        </div>

        {/* Search button */}
        <button
          id="btn-check-updates"
          onClick={handleCheckForUpdate}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Buscando actualizaciones...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Buscar actualizaciones
            </>
          )}
        </button>

        {/* No updates message */}
        {hasChecked && !updateInfo && !isChecking && (
          <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ya tienes la versión más reciente.
          </div>
        )}

        {/* Update found */}
        {updateInfo && (
          <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            {/* Release header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-black dark:text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  {updateInfo.name || `Versión ${updateInfo.version}`}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Publicado el {formatDate(updateInfo.publishedAt)}
                </p>
              </div>
              <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                v{updateInfo.version}
              </span>
            </div>

            {/* Release notes */}
            {updateInfo.body && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-300 bg-black/10 rounded p-3 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Notas de la versión
                </p>
                <p className="whitespace-pre-wrap">{updateInfo.body}</p>
              </div>
            )}

            {/* Assets list */}
            {updateInfo.assets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Archivos disponibles para tu sistema
                </p>
                {getRelevantAssets(updateInfo.assets).map((asset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectAsset(asset)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedAsset?.name === asset.name
                      ? "bg-blue-500/20 border border-blue-500/50 ring-1 ring-blue-400/30"
                      : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Selection indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedAsset?.name === asset.name
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-500"
                          }`}
                      >
                        {selectedAsset?.name === asset.name && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {asset.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(asset.size)}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </div>
                ))}

                {/* Download button */}
                <button
                  id="btn-download-update"
                  onClick={handleDownloadClick}
                  disabled={!selectedAsset || isDownloading}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/30 disabled:text-white/40 text-white text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {/* Progress bar background */}
                  {isDownloading && downloadProgress > 0 && (
                    <div
                      className="absolute inset-0 bg-green-500/30 transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {isDownloading ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Descargando... {downloadProgress > 0 ? `${downloadProgress}%` : ''}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Descargar e instalar
                      </>
                    )}
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                Esta versión no tiene archivos de descarga adjuntos. Visita la{" "}
                <a
                  href={updateInfo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  página de la release
                </a>{" "}
                para más información.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Install confirmation dialog ──────────────────────── */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in-95">
            {/* Warning icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Confirmar descarga
              </h3>
            </div>

            <p className="text-sm text-gray-300 mb-2">
              Estás a punto de descargar{" "}
              <span className="font-mono font-semibold text-white">
                {selectedAsset?.name}
              </span>
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-5">
              <p className="text-sm text-amber-300 flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                La actualización se instalará automáticamente una vez completada
                la descarga. La aplicación se reiniciará.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                id="btn-cancel-download"
                onClick={() => setShowInstallDialog(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-download"
                onClick={handleConfirmDownload}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Descargar e instalar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
