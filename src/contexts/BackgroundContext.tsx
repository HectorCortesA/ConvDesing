import { createContext, useState, useContext, ReactNode } from "react";
import defaultBackground from "../assets/fondo.jpg";

interface BackgroundContextType {
  backgroundImage: string;
  setBackgroundImage: (image: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(
  undefined,
);

interface BackgroundProviderProps {
  children: ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [backgroundImage, setBackgroundImage] =
    useState<string>(defaultBackground);

  return (
    <BackgroundContext.Provider value={{ backgroundImage, setBackgroundImage }}>
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
