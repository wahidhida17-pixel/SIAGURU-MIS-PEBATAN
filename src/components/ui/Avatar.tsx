import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, className }) => {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100", className)}>
      {src ? (
        <img className="aspect-square h-full w-full object-cover" src={src} alt={alt || "Avatar"} />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-emerald-700">
          {fallback}
        </div>
      )}
    </div>
  );
};
