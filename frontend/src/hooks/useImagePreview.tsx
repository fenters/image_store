import { useState, useCallback, ReactNode } from 'react';
import { Image as AntImage } from 'antd';

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

  const openPreview = useCallback((imageUrl: string) => {
    setPreviewImage(imageUrl);
    setVisible(true);
  }, []);

  const closePreview = useCallback(() => {
    setVisible(false);
    setPreviewImage('');
  }, []);

  const PreviewModal = useCallback((): ReactNode => {
    if (!visible || !previewImage) return null;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }} onClick={closePreview}>
        <AntImage
          src={previewImage}
          alt="Preview"
          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          preview={false} // 禁用默认预览，使用自定义预览界面
        />
      </div>
    );
  }, [visible, previewImage, closePreview]);

  return {
    visible,
    previewImage,
    openPreview,
    closePreview,
    PreviewModal,
  };
};
