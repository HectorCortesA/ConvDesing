import { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
import {
  ImageItem,
  FormatId,
  formatBytes,
  getFormatExtension,
  convertImageBlob,
  processImageFile,
  filterValidImageFiles,
} from "../model/imageConvertermodel";

export function useImageConverter() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global settings
  const [globalFormat, setGlobalFormat] = useState<FormatId>("image/png");
  const [globalQuality, setGlobalQuality] = useState<number>(80);
  const [applyToAll, setApplyToAll] = useState(false);

  // Procesar archivos
  const processFiles = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const validFiles = filterValidImageFiles(selectedFiles);

      if (validFiles.length === 0) {
        alert("Por favor, selecciona archivos de imagen válidos.");
        return;
      }

      const processedImages: ImageItem[] = [];

      for (const file of validFiles) {
        try {
          const processed = await processImageFile(
            file,
            globalFormat,
            globalQuality,
          );
          const id = Math.random().toString(36).substring(2, 9);
          processedImages.push({ ...processed, id } as ImageItem);
        } catch (error) {
          console.error("Error processing file:", file.name, error);
        }
      }

      setImages((prev) => {
        const updated = [...prev, ...processedImages];
        if (prev.length === 0 && processedImages.length > 0) {
          setActiveIndex(0);
        }
        return updated;
      });
    },
    [globalFormat, globalQuality],
  );

  // Manejadores globales
  const handleGlobalFormatChange = (formatId: FormatId) => {
    setGlobalFormat(formatId);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        targetFormat: formatId,
        convertedUrl: null,
      })),
    );
  };

  const handleGlobalQualityChange = (q: number) => {
    setGlobalQuality(q);
    setImages((prev) =>
      prev.map((img) => ({ ...img, quality: q, convertedUrl: null })),
    );
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (e.target) e.target.value = "";
  };

  // Operaciones con imágenes
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages.splice(indexToRemove, 1);

      if (newImages.length === 0) {
        setActiveIndex(0);
      } else if (activeIndex >= newImages.length) {
        setActiveIndex(newImages.length - 1);
      } else if (activeIndex === indexToRemove) {
        setActiveIndex(Math.max(0, indexToRemove - 1));
      } else if (activeIndex > indexToRemove) {
        setActiveIndex(activeIndex - 1);
      }

      return newImages;
    });
  };

  const updateActiveImage = (updates: Partial<ImageItem>) => {
    setImages((prev) => {
      const newImages = [...prev];
      if (newImages[activeIndex]) {
        newImages[activeIndex] = {
          ...newImages[activeIndex],
          ...updates,
          convertedUrl: null,
        };

        if (applyToAll) {
          if (
            updates.targetFormat !== undefined ||
            updates.quality !== undefined
          ) {
            newImages.forEach((img, idx) => {
              if (idx !== activeIndex) {
                if (updates.targetFormat !== undefined)
                  img.targetFormat = updates.targetFormat;
                if (updates.quality !== undefined)
                  img.quality = updates.quality;
                img.convertedUrl = null;
              }
            });
          }
        }
      }
      return newImages;
    });
  };

  const convertSingleImage = async (index: number) => {
    const imgData = images[index];
    if (!imgData || !imgData.previewUrl) return;

    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, isConverting: true } : img,
      ),
    );

    try {
      const { dataUrl, size } = await convertImageBlob(
        imgData.previewUrl,
        imgData.targetFormat,
        imgData.quality,
      );

      setImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? {
                ...img,
                convertedUrl: dataUrl,
                convertedSize: size,
                isConverting: false,
              }
            : img,
        ),
      );
    } catch (error) {
      console.error("Error convirtiendo la imagen:", error);
      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, isConverting: false } : img,
        ),
      );
    }
  };

  const convertAll = async () => {
    for (let i = 0; i < images.length; i++) {
      if (!images[i].convertedUrl) {
        await convertSingleImage(i);
      }
    }
  };

  const downloadAllAsZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      let hasFiles = false;

      images.forEach((img) => {
        if (img.convertedUrl) {
          hasFiles = true;
          const base64Data = img.convertedUrl.split(",")[1];
          const ext = getFormatExtension(img.targetFormat);
          const filename = `convertida_${img.file.name.split(".")[0]}.${ext}`;
          zip.file(filename, base64Data, { base64: true });
        }
      });

      if (!hasFiles) {
        alert("No hay imágenes convertidas para descargar.");
        setIsZipping(false);
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "imagenes_convertidas.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al crear el ZIP:", error);
      alert("Ocurrió un error al empaquetar las imágenes.");
    } finally {
      setIsZipping(false);
    }
  };

  const clearAll = () => {
    setImages([]);
    setActiveIndex(0);
  };

  // Computed values
  const activeImage = images[activeIndex];
  const allConverted =
    images.length > 0 && images.every((img) => img.convertedUrl !== null);
  const isAnyConverting = images.some((img) => img.isConverting);
  const convertedCount = images.filter((i) => i.convertedUrl).length;

  return {
    // State
    images,
    activeIndex,
    activeImage,
    isDragging,
    isZipping,
    fileInputRef,
    globalFormat,
    globalQuality,
    applyToAll,
    allConverted,
    isAnyConverting,
    convertedCount,

    // Setters
    setActiveIndex,
    setApplyToAll,

    // Handlers
    processFiles,
    handleGlobalFormatChange,
    handleGlobalQualityChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    removeImage,
    updateActiveImage,
    convertSingleImage,
    convertAll,
    downloadAllAsZip,
    clearAll,
  };
}
