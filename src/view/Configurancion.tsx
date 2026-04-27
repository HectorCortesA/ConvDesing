import { useState, useRef, useEffect } from "react";
import foto1 from "../assets/fondo.jpg";
import { useBackground } from "../contexts/BackgroundContext";

export default function Configuracion() {
  const { backgroundImage, setBackgroundImage } = useBackground();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewImage(backgroundImage);
  }, [backgroundImage]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setBackgroundImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetBackground = (imageUrl: string) => {
    setBackgroundImage(imageUrl);
  };

  const openFileExplorer = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-black dark:text-white flex items-center justify-center md:justify-start gap-3">
        Configuración
      </h1>
      <div className="backdrop-blur-lg bg-white/8 rounded-lg shadow p-4">
        <p className="text-black dark:text-white text-lg mb-4 flex items-center justify-center md:justify-start gap-3">
          Cambiar fondo
        </p>
        <div className="flex items-center mt-2 gap-4 flex-wrap">
          {/* Upload custom image */}
          <div
            onClick={openFileExplorer}
            className="w-90 h-40 rounded backdrop-blur-lg bg-white/8  cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center justify-center"
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

          {/* Preset background 1 */}
          <div
            onClick={() => handlePresetBackground(foto1)}
            className="w-90 h-40 rounded bg-gray-300 dark:bg-gray-700 cursor-pointer overflow-hidden"
          >
            <img
              src={foto1}
              alt="Tema 1"
              className="w-full h-full rounded object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>

          {/* Show current selected background */}
          <div className="w-90 h-40 rounded bg-gray-300 dark:bg-gray-700 overflow-hidden relative">
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
        </div>
      </div>
    </div>
  );
}
