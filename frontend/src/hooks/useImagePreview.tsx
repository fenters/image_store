import { useState, useCallback, ReactNode, useRef } from 'react';
import { Image as AntImage, Button } from 'antd';
import { RotateLeftOutlined, RotateRightOutlined, ZoomInOutlined } from '@ant-design/icons';

interface UseImagePreviewProps {
  initialVisible?: boolean;
}

interface UseImagePreviewReturn {
  visible: boolean;
  previewImage: string;
  openPreview: (imageUrl: string) => void;
  closePreview: () => void;
  PreviewModal: () => ReactNode;
}

export const useImagePreview = ({
  initialVisible = false,
}: UseImagePreviewProps = {}): UseImagePreviewReturn => {
  const [visible, setVisible] = useState(initialVisible);
  const [previewImage, setPreviewImage] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false); // 使用state而不是ref，以便触发重渲染
  const lastMousePos = useRef({ x: 0, y: 0 });

  const openPreview = useCallback((imageUrl: string) => {
    setPreviewImage(imageUrl);
    setVisible(true);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false); // 重置拖拽状态
  }, []);

  const closePreview = useCallback(() => {
    setVisible(false);
    setPreviewImage('');
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false); // 重置拖拽状态
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    
    setZoom(newZoom);
  }, [zoom]);

  const rotateLeft = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    // 确保只有左键点击才开始拖拽
    if (e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const PreviewModal = useCallback((): ReactNode => {
    if (!visible || !previewImage) return null;
    
    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
          zIndex: 9999, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'zoom-out'),
          userSelect: 'none'
        }} 
        onClick={closePreview}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              transition: 'transform 0.1s ease'
            }}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
          >
            <AntImage
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              preview={false}
            />
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '60px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
          <Button 
            type="primary" 
            icon={<RotateLeftOutlined />} 
            onClick={(e) => { e.stopPropagation(); rotateLeft(); }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.4)', color: 'white' }}
          >
            向左旋转
          </Button>
          <Button 
            type="primary" 
            icon={<RotateRightOutlined />} 
            onClick={(e) => { e.stopPropagation(); rotateRight(); }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.4)', color: 'white' }}
          >
            向右旋转
          </Button>
          <Button 
            type="primary" 
            icon={<ZoomInOutlined />} 
            onClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.4)', color: 'white' }}
          >
            重置
          </Button>
        </div>
        
        <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center', color: 'white', fontSize: '12px', zIndex: 10 }}>
          <p>滚轮缩放 · 双击重置 · 拖拽平移（缩放后）</p>
        </div>
      </div>
    );
  }, [visible, previewImage, closePreview, zoom, rotation, position, handleWheel, rotateLeft, rotateRight, handleDoubleClick, handleMouseMove, handleMouseUp, handleMouseDown, handleMouseLeave, isDragging]);

  return {
    visible,
    previewImage,
    openPreview,
    closePreview,
    PreviewModal,
  };
};
