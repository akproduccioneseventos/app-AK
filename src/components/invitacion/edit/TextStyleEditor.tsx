
'use client';

import type { TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  style: TextStyle;
  onStyleChange: (newStyle: TextStyle) => void;
}

export const TextStyleEditor: React.FC<Props> = ({ style, onStyleChange }) => {
  const handleStyleChange = (field: keyof TextStyle, value: string) => {
    onStyleChange({ ...style, [field]: value });
  };

  return (
    <div className="p-2 border rounded-md mt-2 space-y-2 bg-muted/50">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`font-family-${style?.fontFamily}`} className="text-xs">Fuente</Label>
          <Select value={style?.fontFamily || 'Inter'} onValueChange={(v) => handleStyleChange('fontFamily', v)}>
            <SelectTrigger id={`font-family-${style?.fontFamily}`} className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter (Cuerpo)</SelectItem>
              <SelectItem value="Belleza">Belleza (Títulos)</SelectItem>
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
      <div className="space-y-1">
        <Label htmlFor={`color-${style?.color}`} className="text-xs">Color</Label>
        <div className="flex items-center gap-2">
            <Input
              id={`color-picker-${style?.color}`}
              type="color"
              value={style?.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="h-8 w-8 p-0.5"
            />
            <Input
              id={`color-hex-${style?.color}`}
              value={style?.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              placeholder="#000000"
              className="h-8 text-xs"
            />
        </div>
      </div>
    </div>
  );
};
