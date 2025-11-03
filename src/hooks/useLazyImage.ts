import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  src: string;
  placeholder?: string;
  rootMargin?: string;
}

export const useLazyImage = ({ src, placeholder, rootMargin = '50px' }: UseLazyImageOptions) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setImageLoaded(true);
              setImageError(false);
            };
            img.onerror = () => {
              setImageError(true);
              setImageLoaded(false);
            };
            img.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin }
    );

    observer.observe(imageRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src, rootMargin]);

  return {
    imageRef,
    imageSrc,
    imageLoaded,
    imageError
  };
};