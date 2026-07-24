import { useState, useEffect } from "react";

export interface SavedPalette {
  id: string;
  name?: string;
  colors: { hex: string; r: number; g: number; b: number }[];
  date: string;
  folderId?: string | null;
}

export interface SavedFolder {
  id: string;
  name: string;
  date: string;
}

export function useSavedPalettes() {
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [folders, setFolders] = useState<SavedFolder[]>([]);

  // Cargar paletas y carpetas al montar
  useEffect(() => {
    const savedPalettes = localStorage.getItem("saved_palettes");
    const savedFolders = localStorage.getItem("saved_folders");
    if (savedPalettes) {
      try {
        setPalettes(JSON.parse(savedPalettes));
      } catch (e) {
        console.error("Error parsing saved palettes", e);
      }
    }
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (e) {
        console.error("Error parsing saved folders", e);
      }
    }
  }, []);

  // Guardar una nueva paleta
  const savePalette = (colors: { hex: string; r: number; g: number; b: number }[], name?: string) => {
    const newPalette: SavedPalette = {
      id: crypto.randomUUID(),
      name: name || "Paleta Nueva",
      colors: [...colors],
      date: new Date().toISOString(),
    };
    const updated = [newPalette, ...palettes];
    setPalettes(updated);
    localStorage.setItem("saved_palettes", JSON.stringify(updated));
  };

  // Eliminar una paleta
  const deletePalette = (id: string) => {
    const updated = palettes.filter((p) => p.id !== id);
    setPalettes(updated);
    localStorage.setItem("saved_palettes", JSON.stringify(updated));
  };

  // Renombrar una paleta
  const renamePalette = (id: string, newName: string) => {
    const updated = palettes.map((p) =>
      p.id === id ? { ...p, name: newName } : p
    );
    setPalettes(updated);
    localStorage.setItem("saved_palettes", JSON.stringify(updated));
  };

  // Mover una paleta a una carpeta (o quitarla si folderId es null)
  const movePalette = (paletteId: string, folderId: string | null) => {
    const updated = palettes.map((p) =>
      p.id === paletteId ? { ...p, folderId } : p
    );
    setPalettes(updated);
    localStorage.setItem("saved_palettes", JSON.stringify(updated));
  };

  // Crear una carpeta
  const createFolder = (name: string) => {
    const newFolder: SavedFolder = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
    };
    const updated = [newFolder, ...folders];
    setFolders(updated);
    localStorage.setItem("saved_folders", JSON.stringify(updated));
  };

  // Eliminar una carpeta (las paletas dentro quedan "sueltas")
  const deleteFolder = (id: string) => {
    const updatedFolders = folders.filter((f) => f.id !== id);
    setFolders(updatedFolders);
    localStorage.setItem("saved_folders", JSON.stringify(updatedFolders));
    
    // Soltar las paletas
    const updatedPalettes = palettes.map((p) =>
      p.folderId === id ? { ...p, folderId: null } : p
    );
    setPalettes(updatedPalettes);
    localStorage.setItem("saved_palettes", JSON.stringify(updatedPalettes));
  };

  return { 
    palettes, 
    folders, 
    savePalette, 
    deletePalette, 
    movePalette, 
    renamePalette,
    createFolder, 
    deleteFolder 
  };
}
