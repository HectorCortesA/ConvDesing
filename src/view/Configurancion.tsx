import { useState, useRef, useEffect } from "react";
import foto1 from "../assets/fondo.jpg";
import { useBackground } from "../contexts/BackgroundContext";

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
        addSavedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetBackground = (imageUrl: string) => {
    setBackgroundImage(imageUrl);
    addSavedImage(imageUrl);
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
            <div
              onClick={() => handlePresetBackground(foto1)}
              className="w-90 h-40 rounded flex-shrink-0 bg-gray-300 dark:bg-gray-700 cursor-pointer overflow-hidden"
            >
              <img
                src={foto1}
                alt="Tema 1"
                className="w-full h-full rounded object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>

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
                  className={`w-90 h-40  rounded cursor-pointer overflow-hidden transition-all duration-300 ${
                    backgroundImage === image
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
    </div>
  );
}
