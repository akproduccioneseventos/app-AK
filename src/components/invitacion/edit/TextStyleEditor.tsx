
'use client';

import type { TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  style: TextStyle;
  onStyleChange: (newStyle: TextStyle) => void;
}

const FONT_FAMILIES = ['Inter', 'Belleza', 'Playfair_Display', 'Dancing_Script'] as const;
const PREDEFINED_COLORS = ['#333333', '#FFFFFF', '#EF4444', '#F97316', '#A2D2B0', '#D9B8FF', '#FCD3DE'];


export const TextStyleEditor: React.FC<Props> = ({ style, onStyleChange }) => {
  const handleStyleChange = (field: keyof TextStyle, value: string) => {
    onStyleChange({ ...style, [field]: value });
  };

  return (
    <div className="p-2 border rounded-md mt-2 space-y-3 bg-muted/50">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`font-family-${style?.fontFamily}`} className="text-xs">Fuente</Label>
          <Select value={style?.fontFamily || 'Inter'} onValueChange={(v) => handleStyleChange('fontFamily', v)}>
            <SelectTrigger id={`font-family-${style?.fontFamily}`} className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (
                <SelectItem key={font} value={font}>
                  {font.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`font-size-${style?.fontSize}`} className="text-xs">Tamaño</Label>
          <Input
            id={`font-size-${style?.fontSize}`}
            value={style?.fontSize || '1rem'}
            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            placeholder="1rem, 16px..."
            className="h-8 text-xs"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`color-${style?.color}`} className="text-xs">Color</Label>
        <div className="flex items-center gap-2">
            <Input
              id={`color-picker-${style?.color}`}
              type="color"
              value={style?.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="h-8 w-8 p-0.5 shrink-0"
            />
            <Input
              id={`color-hex-${style?.color}`}
              value={style?.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              placeholder="#000000"
              className="h-8 text-xs"
            />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PREDEFINED_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handleStyleChange('color', color)}
              className={cn(
                "w-5 h-5 rounded-full border",
                style?.color?.toLowerCase() === color.toLowerCase() && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Seleccionar color ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
