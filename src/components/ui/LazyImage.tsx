import React from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  rootMargin?: string;
}

export const LazyImage = React.memo<LazyImageProps>(({
  src,
  alt,
  placeholder,
  fallback = '/placeholder.svg',
  rootMargin = '50px',
  className,
  ...props
}) => {
  const { imageRef, imageSrc, imageLoaded, imageError } = useLazyImage({
    src,
    placeholder,
    rootMargin
  });

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imageRef}
        src={imageError ? fallback : imageSrc || placeholder}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 animate-pulse flex items-center justify-center">
          <div className="text-neutral-400 text-xs">Loading...</div>
        </div>
      )}
      {imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
          <div className="text-neutral-400 text-xs text-center p-2">
            Image unavailable
          </div>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';