import React, { useState, useRef, useEffect } from 'react';

// 定义LazyImage组件的props类型
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

// 自定义图片懒加载组件，使用React.memo减少不必要的重新渲染
const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, onClick, onContextMenu }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 使用IntersectionObserver监测图片是否进入视口
  useEffect(() => {
    // 重置isVisible状态，确保每次组件挂载时都能正确处理
    setIsVisible(false);
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src]);

  return (
      <img
        ref={imgRef}
        src={isVisible ? src : undefined}
        alt={alt}
        className={className}
        onLoad={() => setIsLoaded(true)}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onError={(e) => {
          // 图片加载失败时的处理
          console.error('图片加载失败:', src);
          e.currentTarget.style.display = 'none';
        }}
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s', cursor: onClick ? 'pointer' : 'default' }}
      />
    );
};

// 使用React.memo包装组件，减少不必要的重新渲染
const MemoizedLazyImage = React.memo(LazyImage);
MemoizedLazyImage.displayName = 'LazyImage';