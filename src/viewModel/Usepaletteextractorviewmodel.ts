// ============================================================
// VIEWMODEL: usePaletteExtractorViewModel.ts
// Responsabilidad: Estado reactivo, acciones y coordinación
//                  entre Model y View.
// ============================================================

import { useState, useRef } from "react";
import {
  PaletteExtractorState,
  ColorInfo,
  initialState,
  extractDominantColors,
  pickColorFromImage,
} from "../model/Paletteextractormodel";

export interface PaletteExtractorViewModel {
  state: PaletteExtractorState;
  fileInputRef: React.RefObject<HTMLInputElement>;

  // Drag & Drop
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // Archivo
  processFile: (file: File) => void;

  // Picker manual
  togglePicking: () => void;
  handleImageClick: (e: React.MouseEvent<HTMLImageElement>) => void;

  // Portapapeles
  copyToClipboard: (hex: string) => void;

  // Reset
  reset: () => void;
}

export function usePaletteExtractorViewModel(): PaletteExtractorViewModel {
  const [state, setState] = useState<PaletteExtractorState>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patch = (partial: Partial<PaletteExtractorState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  // ---- Drag & Drop ----
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    patch({ isDragging: true });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    patch({ isDragging: false });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    patch({ isDragging: false });
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  // ---- Procesado ----
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    const url = URL.createObjectURL(file);
    patch({ step: "processing", imageSrc: url });

    setTimeout(async () => {
      try {
        const palette = await extractDominantColors(url);
        patch({ palette, step: "result" });
      } catch (err) {
        console.error("Error extrayendo colores:", err);
        alert("Hubo un error al procesar la imagen.");
        patch({ step: "upload" });
      }
    }, 500);
  };

  // ---- Picker manual ----
  const togglePicking = () => patch({ isPicking: !state.isPicking });

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!state.isPicking) return;
    const color = pickColorFromImage(e.currentTarget, e.clientX, e.clientY);
    if (color) {
      patch({ pickedColor: color, isPicking: false });
    }
  };

  // ---- Portapapeles ----
  const copyToClipboard = (hex: string) => {
    try {
      const el = document.createElement("textarea");
      el.value = hex;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      patch({ copiedHex: hex });
      setTimeout(() => patch({ copiedHex: null }), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  // ---- Reset ----
  const reset = () => {
    setState(initialState);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return {
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
  };
}
