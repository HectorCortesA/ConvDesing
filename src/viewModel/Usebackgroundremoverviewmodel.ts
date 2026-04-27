import { useState, useRef, useCallback, useEffect } from "react";
import {
  BackgroundRemoverState,
  BgMode,
  Tool,
  initialState,
  composeWithBackground,
} from "../model/Backgroundremovermodel";
import { removeBackground } from "@imgly/background-removal";

export function useBackgroundRemoverViewModel() {
  const [state, setState] = useState<BackgroundRemoverState>(initialState);
  const patch = (partial: Partial<BackgroundRemoverState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [isHovering, setIsHovering] = useState(false);

  const isDrawing = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastDrawPos = useRef<{ x: number; y: number } | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !state.imageSize) return;
    const rect = containerRef.current.getBoundingClientRect();
    const img = state.imageSize;

    const scale = Math.min(
      (rect.width - 40) / img.width,
      (rect.height - 40) / img.height,
    );
    const finalScale = Math.min(scale, 1);

    const panX = (rect.width - img.width * finalScale) / 2;
    const panY = (rect.height - img.height * finalScale) / 2;

    setState((prev) => ({
      ...prev,
      zoom: finalScale,
      pan: { x: panX, y: panY },
    }));
  }, [state.imageSize]);

  const drawVisualCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const origImg = originalImageRef.current;
    if (!canvas || !maskCanvas || !origImg) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(origImg, 0, 0, canvas.width, canvas.height);

    if (state.showMask) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tctx = tempCanvas.getContext("2d");
      if (tctx) {
        tctx.fillStyle = "rgba(255, 0, 0, 0.45)";
        tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tctx.globalCompositeOperation = "destination-out";
        tctx.drawImage(maskCanvas, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  }, [state.showMask]);

  // Se ejecuta cuando el editor está listo y tenemos el tamaño de la imagen
  useEffect(() => {
    if (state.step === "editor" && state.imageSize) {
      fitToScreen();
      // Esperamos el próximo frame para asegurar que el Canvas ya tiene el width/height correcto
      requestAnimationFrame(() => {
        drawVisualCanvas();
      });
    }
  }, [state.step, state.imageSize, fitToScreen, drawVisualCanvas]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/"))
      return alert("Selecciona una imagen válida.");
    const originalUrl = URL.createObjectURL(file);
    patch({
      step: "processing",
      originalImage: originalUrl,
      fileName: file.name.split(".")[0],
      isProcessing: true,
      aiProgress: 0,
    });

    const img = new Image();
    img.src = originalUrl;
    await new Promise((res) => {
      img.onload = res;
    });
    originalImageRef.current = img;

    try {
      const imageBlob = await removeBackground(originalUrl, {
        progress: (key, current, total) => {
          if (total > 0)
            patch({ aiProgress: Math.round((current / total) * 100) });
        },
      });

      const aiImgUrl = URL.createObjectURL(imageBlob);
      const aiImg = new Image();
      aiImg.src = aiImgUrl;
      await new Promise((res) => {
        aiImg.onload = res;
      });

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const mctx = maskCanvas.getContext("2d");
      if (mctx) mctx.drawImage(aiImg, 0, 0, img.width, img.height);
      maskCanvasRef.current = maskCanvas;

      // Guardamos el tamaño exacto de la foto en el estado para que el canvas se cree perfectamente a medida
      patch({
        step: "editor",
        isProcessing: false,
        imageSize: { width: img.width, height: img.height },
      });
    } catch (e) {
      patch({
        step: "upload",
        isProcessing: false,
        errorMessage: "Error procesando el fondo.",
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || state.step !== "editor") return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setState((prev) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = 1.1;
        const newZoom =
          e.deltaY < 0 ? prev.zoom * zoomFactor : prev.zoom / zoomFactor;
        const constrainedZoom = Math.max(0.05, Math.min(newZoom, 15));

        const canvasX = (mouseX - prev.pan.x) / prev.zoom;
        const canvasY = (mouseY - prev.pan.y) / prev.zoom;
        const newPanX = mouseX - canvasX * constrainedZoom;
        const newPanY = mouseY - canvasY * constrainedZoom;

        return {
          ...prev,
          zoom: constrainedZoom,
          pan: { x: newPanX, y: newPanY },
        };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [state.step]);

  const zoomToCenter = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setState((prev) => {
      const newZoom = Math.max(0.05, Math.min(prev.zoom * factor, 15));
      const canvasX = (centerX - prev.pan.x) / prev.zoom;
      const canvasY = (centerY - prev.pan.y) / prev.zoom;
      return {
        ...prev,
        zoom: newZoom,
        pan: { x: centerX - canvasX * newZoom, y: centerY - canvasY * newZoom },
      };
    });
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current || !state.imageSize) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const xInContainer = clientX - rect.left;
    const yInContainer = clientY - rect.top;
    return {
      x: (xInContainer - state.pan.x) / state.zoom,
      y: (yInContainer - state.pan.y) / state.zoom,
    };
  };

  const paint = (x: number, y: number) => {
    if (!maskCanvasRef.current || !lastDrawPos.current) return;
    const mctx = maskCanvasRef.current.getContext("2d");
    if (!mctx) return;

    mctx.beginPath();
    mctx.moveTo(lastDrawPos.current.x, lastDrawPos.current.y);
    mctx.lineTo(x, y);
    mctx.lineWidth = state.brushSize;
    mctx.lineCap = "round";
    mctx.lineJoin = "round";
    mctx.globalCompositeOperation =
      state.tool === "keep" ? "source-over" : "destination-out";
    mctx.strokeStyle = "white";
    mctx.stroke();

    lastDrawPos.current = { x, y };
    drawVisualCanvas();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (state.tool === "pan" || ("button" in e && e.button === 1)) {
      isPanningRef.current = true;
      lastPanPosRef.current = { x: clientX, y: clientY };
      return;
    }

    const coords = getCanvasCoordinates(clientX, clientY);
    if (!coords) return;

    isDrawing.current = true;
    lastDrawPos.current = { x: coords.x, y: coords.y };
    paint(coords.x, coords.y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (isPanningRef.current && lastPanPosRef.current) {
      const dx = clientX - lastPanPosRef.current.x;
      const dy = clientY - lastPanPosRef.current.y;
      setState((prev) => ({
        ...prev,
        pan: { x: prev.pan.x + dx, y: prev.pan.y + dy },
      }));
      lastPanPosRef.current = { x: clientX, y: clientY };
      return;
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
      setIsHovering(true);
    }

    if (!isDrawing.current) return;
    const coords = getCanvasCoordinates(clientX, clientY);
    if (coords) paint(coords.x, coords.y);
  };

  const handleCanvasMouseUp = () => {
    isDrawing.current = false;
    isPanningRef.current = false;
    lastPanPosRef.current = null;
  };
  const handleCanvasMouseLeave = () => {
    isDrawing.current = false;
    isPanningRef.current = false;
    setIsHovering(false);
  };

  const applyChanges = () => {
    if (!maskCanvasRef.current || !originalImageRef.current || !state.imageSize)
      return;
    patch({ isProcessing: true });
    setTimeout(() => {
      const resCanvas = document.createElement("canvas");
      resCanvas.width = state.imageSize!.width;
      resCanvas.height = state.imageSize!.height;
      const rctx = resCanvas.getContext("2d");
      if (rctx) {
        rctx.drawImage(maskCanvasRef.current!, 0, 0);
        rctx.globalCompositeOperation = "source-in";
        rctx.drawImage(originalImageRef.current!, 0, 0);
      }
      patch({
        resultImage: resCanvas.toDataURL("image/png"),
        step: "result",
        isProcessing: false,
      });
    }, 50);
  };

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;
    patch({ sliderPos: Math.max(0, Math.min(100, pos)) });
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
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

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
      alert("Error al descargar");
    }
  };

  const reset = () => {
    if (state.originalImage) URL.revokeObjectURL(state.originalImage);
    if (state.resultImage) URL.revokeObjectURL(state.resultImage);
    setState(initialState);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return {
    state,
    fileInputRef,
    containerRef,
    canvasRef,
    cursorPos,
    isHovering,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCanvasMouseLeave,
    handleSliderMouseDown: () => setIsDraggingSlider(true),
    handleSliderTouchStart: () => setIsDraggingSlider(true),
    handleSliderTouchMove: handleSliderMove,
    handleSliderTouchEnd: () => setIsDraggingSlider(false),
    setBgMode: (mode: BgMode) => patch({ bgMode: mode }),
    setBgColor: (color: string) => patch({ bgColor: color }),
    setTool: (t: Tool) => patch({ tool: t }),
    setBrushSize: (size: number) => patch({ brushSize: size }),
    setShowMask: (show: boolean) => patch({ showMask: show }),
    zoomIn: () => zoomToCenter(1.2),
    zoomOut: () => zoomToCenter(0.8),
    fitToScreen,
    applyChanges,
    handleDownload,
    reset,
  };
}
