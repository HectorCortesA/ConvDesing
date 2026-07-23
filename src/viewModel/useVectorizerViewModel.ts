import { useState, useRef, useEffect, useCallback } from "react";
import {
  VectorizerState,
  initialState,
  Preset,
  vectorizeImageProcess,
} from "../model/Vectorizermodel";

export function useVectorizerViewModel() {
  const [state, setState] = useState<VectorizerState>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patch = (partial: Partial<VectorizerState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const runVectorization = useCallback(
    async (
      url: string,
      preset: Preset,
      detail: number,
      isInitial: boolean = false,
    ) => {
      // 1. Iniciar la UI de Carga de inmediato
      if (isInitial) patch({ step: "processing" });
      else patch({ isProcessing: true });

      try {
        // 2. Ejecutar la vectorización de forma segura
        const svgResult = await vectorizeImageProcess(url, preset, detail);

        // 3. Mostrar el resultado
        patch({ svgResult, step: "result", isProcessing: false });
      } catch (err) {
        console.error("Error al vectorizar:", err);
        patch({
          errorMessage:
            "Hubo un problema al generar el SVG. Intenta con otra imagen.",
          step: "upload",
          isProcessing: false,
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (state.originalImage && state.step === "result") {
      runVectorization(
        state.originalImage,
        state.activePreset,
        state.detailValue,
        false,
      );
    }
  }, [
    state.detailValue,
    state.activePreset,
    state.step,
    runVectorization,
    state.originalImage,
  ]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(
        "Por favor, selecciona un archivo de imagen válido (PNG, JPG, etc).",
      );
      return;
    }
    const url = URL.createObjectURL(file);
    patch({ originalImage: url, errorMessage: null });
    runVectorization(url, state.activePreset, state.detailValue, true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    patch({ isDragging: false });
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const downloadSvg = () => {
    if (!state.svgResult) return;
    const blob = new Blob([state.svgResult], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vectorizado.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copySvgCode = () => {
    if (!state.svgResult) return;
    try {
      const el = document.createElement("textarea");
      el.value = state.svgResult;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      patch({ isCopied: true });
      setTimeout(() => patch({ isCopied: false }), 2000);
    } catch (err) {
      console.error("Error copiando:", err);
    }
  };

  const reset = () => {
    if (state.originalImage) URL.revokeObjectURL(state.originalImage);
    setState(initialState);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleEditMode = () => patch({ isEditing: !state.isEditing });
  const setEditMode = (mode: "color" | "erase" | null) => patch({ editMode: mode });
  const setSelectedColor = (color: string) => patch({ selectedColor: color });
  const updateSvgResult = (newSvg: string) => patch({ svgResult: newSvg });

  const removeBackground = (container?: HTMLElement) => {
    if (!state.svgResult) return;
    try {
      if (container) {
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          const paths = Array.from(svgElement.querySelectorAll('path, rect')) as SVGGraphicsElement[];
          if (paths.length > 0) {
            const viewBox = svgElement.viewBox.baseVal;
            const totalArea = viewBox.width * viewBox.height;
            let removedAny = false;
            
            paths.forEach(p => {
              try {
                const bbox = p.getBBox();
                const pathArea = bbox.width * bbox.height;
                // Si el trazo ocupa más del 65% del área total, se considera fondo y se elimina
                if (pathArea > totalArea * 0.65) {
                  p.remove();
                  removedAny = true;
                }
              } catch (err) {
                // Ignore getBBox errors for invisible elements
              }
            });

            if (!removedAny) {
              paths[0]?.remove(); // Fallback
            }
            patch({ svgResult: svgElement.outerHTML });
            return;
          }
        }
      }

      // Fallback estático
      const parser = new DOMParser();
      const doc = parser.parseFromString(state.svgResult, "image/svg+xml");
      const firstPath = doc.querySelector('path');
      if (firstPath) {
        firstPath.remove();
        patch({ svgResult: new XMLSerializer().serializeToString(doc) });
      }
    } catch (e) {
      console.error("Error removing background", e);
    }
  };

  return {
    state,
    fileInputRef,
    patch,
    processFile,
    handleDrop,
    handleDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      patch({ isDragging: true });
    },
    handleDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      patch({ isDragging: false });
    },
    setActivePreset: (p: Preset) => patch({ activePreset: p }),
    setDisplayValue: (v: number) => patch({ displayValue: v }),
    setDetailValue: (v: number) => patch({ detailValue: v }),
    downloadSvg,
    copySvgCode,
    reset,
    toggleEditMode,
    setEditMode,
    setSelectedColor,
    updateSvgResult,
    removeBackground,
  };
}
