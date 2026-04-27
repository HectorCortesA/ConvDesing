import { useState, useRef, useEffect } from "react";
import {
  TargetOS,
  IconSize,
  Step,
  Shape,
  ResultIcon,
  getCroppedImg,
  createFinalIconBlob,
  generateIco,
  generateIcns,
} from "../model/Icongeneratormodel";

export function useIconGenerator() {
  // Estado principal
  const [step, setStep] = useState<Step>("upload");
  const [targetOS, setTargetOS] = useState<TargetOS>("all");
  const [targetSize, setTargetSize] = useState<IconSize>(256);

  // Estado de subida
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del editor
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("icon");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Estado de estilo
  const [bgShape, setBgShape] = useState<Shape>("rounded");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [padding, setPadding] = useState<number>(10);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);

  // Estado de resultados
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ResultIcon[]>([]);
  const [finalPreviewSrc, setFinalPreviewSrc] = useState<string | null>(null);

  // Actualizar preview en vivo
  useEffect(() => {
    if (!imageToCrop || !croppedAreaPixels || step !== "editor") return;

    let active = true;
    const timer = setTimeout(() => {
      getCroppedImg(imageToCrop, croppedAreaPixels)
        .then((blob) => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          setLivePreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch(console.error);
    }, 100);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [imageToCrop, croppedAreaPixels, step]);

  // Manejadores de archivos
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido.");
      return;
    }
    setFileName(file.name.split(".")[0] || "icon");
    setImageToCrop(URL.createObjectURL(file));
    setStep("editor");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Generar iconos
  const handleGenerate = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setIsProcessing(true);
    setStep("results");

    try {
      const finalPngBlob = await createFinalIconBlob(
        imageToCrop,
        croppedAreaPixels,
        targetSize,
        bgShape,
        bgColor,
        isTransparent,
        padding,
      );

      const finalUrl = URL.createObjectURL(finalPngBlob);
      setFinalPreviewSrc(finalUrl);

      const newResults: ResultIcon[] = [];

      if (targetOS === "windows" || targetOS === "all") {
        const icoBlob = await generateIco(finalPngBlob, targetSize);
        newResults.push({
          os: "Windows",
          format: ".ico",
          url: URL.createObjectURL(icoBlob),
          filename: `${fileName}_${targetSize}.ico`,
        });
      }

      if (targetOS === "mac" || targetOS === "all") {
        const icnsBlob = await generateIcns(finalPngBlob, targetSize);
        newResults.push({
          os: "Mac OS",
          format: ".icns",
          url: URL.createObjectURL(icnsBlob),
          filename: `${fileName}_${targetSize}.icns`,
        });
      }

      if (targetOS === "linux" || targetOS === "all") {
        newResults.push({
          os: "Linux / Web",
          format: ".png",
          url: finalUrl,
          filename: `${fileName}_${targetSize}.png`,
        });
      }

      setResults(newResults);
    } catch (err) {
      console.error(err);
      alert("Error al generar los iconos.");
      setStep("editor");
    } finally {
      setIsProcessing(false);
    }
  };

  // Resetear todo
  const reset = () => {
    setStep("upload");
    setResults([]);
    setImageToCrop(null);
    setLivePreviewUrl(null);
    setFinalPreviewSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOSChange = (id: TargetOS) => {
    setTargetOS(id);
    if (step === "results") reset();
  };

  const handleSizeChange = (id: IconSize) => {
    setTargetSize(id);
    if (step === "results") reset();
  };

  return {
    // Estado
    step,
    targetOS,
    targetSize,
    isDragging,
    fileInputRef,
    imageToCrop,
    fileName,
    crop,
    zoom,
    croppedAreaPixels,
    bgShape,
    bgColor,
    isTransparent,
    padding,
    livePreviewUrl,
    isProcessing,
    results,
    finalPreviewSrc,

    // Setters
    setCrop,
    setZoom,
    setCroppedAreaPixels,
    setBgShape,
    setBgColor,
    setIsTransparent,
    setPadding,

    // Manejadores
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleGenerate,
    reset,
    handleOSChange,
    handleSizeChange,
  };
}
