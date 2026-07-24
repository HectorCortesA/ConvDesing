import { useState, useEffect } from 'react';

interface ColorTonalPickerProps {
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

export function ColorTonalPicker({ onChange }: ColorTonalPickerProps) {
  const [hue, setHue] = useState<number>(200); // Default blue-ish
  const [saturation, setSaturation] = useState<number>(80);

  useEffect(() => {
    // Generate 5 tonalities (tints and shades)
    // We vary the lightness from dark to light
    const lightnesses = [20, 40, 60, 80, 95];
    const colors = lightnesses.map(l => hslToHex(hue, saturation, l));
    onChange(colors);
  }, [hue, saturation, onChange]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Tono Base (Hue)
          </label>
          <span className="text-xs text-zinc-500 font-mono">{hue}°</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="360" 
          value={hue}
          onChange={(e) => setHue(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Saturación
          </label>
          <span className="text-xs text-zinc-500 font-mono">{saturation}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={saturation}
          onChange={(e) => setSaturation(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background: `linear-gradient(to right, #808080, ${hslToHex(hue, 100, 50)})`
          }}
        />
      </div>

      <p className="text-zinc-500 text-xs text-center mt-2">
        Ajusta el tono y la saturación para generar una escala monocromática perfecta automáticamente.
      </p>
    </div>
  );
}
