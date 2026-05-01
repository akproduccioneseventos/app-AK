'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';

type ActionButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
};

export function ActionButton({
  isLoading = false,
  loadingText,
  icon,
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}
