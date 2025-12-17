import React, { createContext, useContext, ReactNode } from 'react';
import { Image } from '../types';

// 定义ImageContext的类型
interface ImageContextType {
  images: Image[];
  fetchImages: (pageNum?: number, append?: boolean) => void;
}

// 创建ImageContext，设置默认值
const ImageContext = createContext<ImageContextType>({
  images: [],
  fetchImages: () => {}
});

// 创建ImageContext Provider组件
interface ImageProviderProps {
  children: ReactNode;
  images: Image[];
  fetchImages: (pageNum?: number, append?: boolean) => void;
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ children, images, fetchImages }) => {
  return (
    <ImageContext.Provider value={{ images, fetchImages }}>
      {children}
    </ImageContext.Provider>
  );
};

// 创建useImageContext钩子，方便组件使用ImageContext
export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext必须在ImageProvider内部使用');
  }
  return context;
};

export default ImageContext;