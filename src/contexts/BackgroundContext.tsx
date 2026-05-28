import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import defaultBackground from "../assets/fondo.jpg";

interface BackgroundContextType {
  backgroundImage: string;
  setBackgroundImage: (image: string) => void;
  savedImages: string[];
  addSavedImage: (image: string) => void;
  removeSavedImage: (image: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(
  undefined,
);

interface BackgroundProviderProps {
  children: ReactNode;
}

const STORAGE_KEY_CURRENT = "selectedBackgroundImage";
const STORAGE_KEY_SAVED = "savedBackgroundImages";

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [backgroundImage, setBackgroundImage] =
    useState<string>(defaultBackground);
  const [savedImages, setSavedImages] = useState<string[]>([]);

  // Cargar imágenes guardadas al inicializar
  useEffect(() => {
    const savedImage = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (savedImage) {
      setBackgroundImage(savedImage);
    }

    const saved = localStorage.getItem(STORAGE_KEY_SAVED);
    if (saved) {
      try {
        setSavedImages(JSON.parse(saved));
      } catch (e) {
        setSavedImages([]);
      }
    }
  }, []);

  // Guardar imagen actual cuando cambia
  const handleSetBackgroundImage = (image: string) => {
    setBackgroundImage(image);
    localStorage.setItem(STORAGE_KEY_CURRENT, image);
  };

  // Agregar imagen al array de guardadas (sin duplicados)
  const handleAddSavedImage = (image: string) => {
    setSavedImages((prev) => {
      if (prev.includes(image)) return prev;
      const updated = [image, ...prev];
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
      return updated;
    });
  };

  // Remover imagen del array de guardadas
  const handleRemoveSavedImage = (image: string) => {
    setSavedImages((prev) => {
      const updated = prev.filter((img) => img !== image);
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <BackgroundContext.Provider
      value={{
        backgroundImage,
        setBackgroundImage: handleSetBackgroundImage,
        savedImages,
        addSavedImage: handleAddSavedImage,
        removeSavedImage: handleRemoveSavedImage,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error(
      "useBackground debe ser usado dentro de BackgroundProvider",
    );
  }
  return context;
}
