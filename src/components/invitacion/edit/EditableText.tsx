
'use client';

import React, { useState, useRef, useEffect, type KeyboardEvent, type FocusEvent } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { TextStyle } from '@/types/fiesta';

interface EditableTextProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  className?: string;
  textarea?: boolean;
  style?: TextStyle;
}

export const EditableText: React.FC<EditableTextProps> = ({
  initialValue,
  onSave,
  className,
  textarea = false,
  style = {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const dynamicStyle = {
    fontFamily: style.fontFamily ? `var(--font-${style.fontFamily.toLowerCase()})` : 'inherit',
    fontSize: style.fontSize || 'inherit',
    color: style.color || 'inherit',
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsEditing(false);
    if (value && value.trim() !== initialValue.trim()) {
      onSave(value);
    } else {
        setValue(initialValue); // Revert if empty or unchanged
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !textarea && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setValue(initialValue); // Revert changes
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  const commonProps = {
    ref: inputRef as any,
    value: value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    className: cn(
      "w-full bg-transparent p-0 m-0 border-none ring-2 ring-primary ring-offset-2 ring-offset-background rounded-sm focus:outline-none",
      "text-inherit font-inherit text-center", // Inherit text styles
      className,
    ),
    style: dynamicStyle,
  };

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return textarea ? (
      <Textarea {...commonProps} rows={3} />
    ) : (
      <Input type="text" {...commonProps} />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-pointer hover:bg-primary/10 transition-colors p-1 -m-1 rounded-sm",
        className
      )}
      title="Doble clic para editar"
      style={dynamicStyle}
    >
      {value || <span className="text-muted-foreground italic">[Vacío]</span>}
    </span>
  );
};
