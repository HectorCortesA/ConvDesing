import React, { useState, useRef, useEffect } from 'react';

interface Node {
  id: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
}

interface ColorGraphPickerProps {
  onChange: (colors: string[]) => void;
}

// Convert HSL to HEX
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ColorGraphPicker({ onChange }: ColorGraphPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initial 5 nodes positioned across the spectrum
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', x: 0.1, y: 0.5 },
    { id: '2', x: 0.3, y: 0.3 },
    { id: '3', x: 0.5, y: 0.6 },
    { id: '4', x: 0.7, y: 0.4 },
    { id: '5', x: 0.9, y: 0.5 }
  ]);

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Notify parent of color changes
  useEffect(() => {
    const colors = nodes.map(node => {
      const hue = node.x * 360;
      const lightness = (1 - node.y) * 100;
      return hslToHex(hue, 100, lightness);
    });
    onChange(colors);
  }, [nodes, onChange]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setActiveNodeId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeNodeId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let newX = (e.clientX - rect.left) / rect.width;
    let newY = (e.clientY - rect.top) / rect.height;

    // Clamp values between 0 and 1
    newX = Math.max(0, Math.min(1, newX));
    newY = Math.max(0, Math.min(1, newY));

    setNodes(prev => prev.map(n => n.id === activeNodeId ? { ...n, x: newX, y: newY } : n));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeNodeId) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setActiveNodeId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Espectro de color interactivo */}
      <div 
        ref={containerRef}
        className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-inner cursor-crosshair touch-none select-none border border-zinc-200 dark:border-zinc-800"
        style={{
          background: `
            linear-gradient(to top, #000, transparent, #fff),
            linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)
          `
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* SVG para dibujar las líneas (el grafo) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const prev = nodes[i - 1];
            return (
              <line
                key={`line-${node.id}`}
                x1={`${prev.x * 100}%`}
                y1={`${prev.y * 100}%`}
                x2={`${node.x * 100}%`}
                y2={`${node.y * 100}%`}
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* Nodos Draggables */}
        {nodes.map(node => {
          const hue = node.x * 360;
          const lightness = (1 - node.y) * 100;
          const colorHex = hslToHex(hue, 100, lightness);
          const isActive = activeNodeId === node.id;

          return (
            <div
              key={node.id}
              className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 shadow-lg transition-transform ${
                isActive ? 'scale-125 border-white cursor-grabbing z-10' : 'border-white/80 cursor-grab hover:scale-110 z-0'
              }`}
              style={{
                left: `${node.x * 100}%`,
                top: `${node.y * 100}%`,
                backgroundColor: colorHex
              }}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
            />
          );
        })}
      </div>
      
      <p className="text-zinc-500 text-xs text-center">
        Arrastra los nodos por el espectro para modificar los colores conectados.
      </p>
    </div>
  );
}
