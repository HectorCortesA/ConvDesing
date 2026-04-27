// ============================================================
// VIEWMODEL: useBackgroundRemoverViewModel.ts
// Responsabilidad: Estado reactivo, acciones, coordinación
//                  entre Model y View.
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import {
  BackgroundRemoverState,
  BgMode,
  initialState,
  simulateBackgroundRemoval,
  composeWithBackground,
} from "../model/ Backgroundremovermodel";

export interface BackgroundRemoverViewModel {
  // ---- Estado ----
  state: BackgroundRemoverState;
  fileInputRef: React.RefObject<HTMLInputElement>;
  containerRef: React.RefObject<HTMLDivElement>;

  // ---- Acciones de drag & drop ----
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // ---- Acciones de archivo ----
  handleFileSelect: (file: File) => void;

  // ---- Acciones del slider ----
  handleSliderMouseDown: () => void;
  handleSliderTouchStart: () => void;
  handleSliderTouchMove: (clientX: number) => void;
  handleSliderTouchEnd: () => void;

  // ---- Acciones de fondo ----
  setBgMode: (mode: BgMode) => void;
  setBgColor: (color: string) => void;

  // ---- Descarga y reset ----
  handleDownload: () => Promise<void>;
  reset: () => void;
}

export function useBackgroundRemoverViewModel(): BackgroundRemoverViewModel {
  const [state, setState] = useState<BackgroundRemoverState>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // ---- Helpers de estado parcial ----
  const patch = (partial: Partial<BackgroundRemoverState>) =>
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
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // ---- Procesado de archivo ----
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    const originalUrl = URL.createObjectURL(file);
    const fileName = file.name.split(".")[0] || "imagen";

    patch({ step: "processing", originalImage: originalUrl, fileName });

    // Simular tiempo de procesado (2.5 s)
    await new Promise((r) => setTimeout(r, 2500));

    try {
      const resultUrl = await simulateBackgroundRemoval(originalUrl);
      patch({ resultImage: resultUrl, step: "result" });
    } catch {
      alert("Error en el procesado de la imagen.");
      patch({ step: "upload" });
    }
  };

  // ---- Slider logic ----
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;
    pos = Math.max(0, Math.min(100, pos));
    patch({ sliderPos: pos });
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) handleSliderMove(e.clientX);
    };
    const onMouseUp = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  const handleSliderMouseDown = () => setIsDraggingSlider(true);
  const handleSliderTouchStart = () => setIsDraggingSlider(true);
  const handleSliderTouchMove = (clientX: number) => handleSliderMove(clientX);
  const handleSliderTouchEnd = () => setIsDraggingSlider(false);

  // ---- Fondo ----
  const setBgMode = (mode: BgMode) => patch({ bgMode: mode });
  const setBgColor = (color: string) => patch({ bgColor: color });

  // ---- Descarga ----
  const handleDownload = async () => {
    const { resultImage, originalImage, bgMode, bgColor, fileName } = state;
    if (!resultImage || !originalImage) return;

    if (bgMode === "transparent") {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = `${fileName}_sin_fondo.png`;
      link.click();
      return;
    }

    try {
      const finalDataUrl = await composeWithBackground(
        resultImage,
        originalImage,
        bgMode,
        bgColor,
      );
      const link = document.createElement("a");
      link.href = finalDataUrl;
      link.download = `${fileName}_fondo_${bgMode}.png`;
      link.click();
    } catch (err) {
      console.error(err);
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
    containerRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleSliderMouseDown,
    handleSliderTouchStart,
    handleSliderTouchMove,
    handleSliderTouchEnd,
    setBgMode,
    setBgColor,
    handleDownload,
    reset,
  };
}
