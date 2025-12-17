import { useState, useCallback, useRef, useEffect } from 'react';
import { Image } from '../types';
import { imageApi } from '../api';
import { message, Modal } from 'antd';

/**
 * 批量删除图片Hook
 * @param onRefresh 刷新图片列表的回调函数
 */
export const useBatchDelete = (onRefresh: () => void) => {
  // 选中的图片ID列表
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  // 记录当前选中的图片数据
  const [selectedImages, setSelectedImages] = useState<Image[]>([]);
  // 是否正在删除
  const [isDeleting, setIsDeleting] = useState(false);
  // 所有图片列表的引用，用于批量操作时查找图片数据
  const allImagesRef = useRef<Image[]>([]);
  
  // 范围选择相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const startPointRef = useRef({ x: 0, y: 0 });

  /**
   * 设置所有图片列表，用于查找图片数据
   */
  const setAllImages = useCallback((images: Image[]) => {
    allImagesRef.current = images;
  }, []);

  /**
   * 切换图片选中状态
   */
  const toggleImageSelection = useCallback((imageId: number, image: Image) => {
    setSelectedImageIds(prev => {
      if (prev.includes(imageId)) {
        // 取消选中
        const newIds = prev.filter(id => id !== imageId);
        setSelectedImages(prevImages => prevImages.filter(img => img.id !== imageId));
        return newIds;
      } else {
        // 添加选中
        const newIds = [...prev, imageId];
        setSelectedImages(prevImages => [...prevImages, image]);
        return newIds;
      }
    });
  }, []);

  /**
   * 取消所有选中
   */
  const clearSelection = useCallback(() => {
    setSelectedImageIds([]);
    setSelectedImages([]);
  }, []);

  /**
   * 检查图片是否被选中
   */
  const isImageSelected = useCallback((imageId: number) => {
    return selectedImageIds.includes(imageId);
  }, [selectedImageIds]);

  /**
   * 执行批量删除
   */
  const batchDeleteImages = useCallback(async () => {
    if (selectedImageIds.length === 0) {
      message.warning('请先选择要删除的图片');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedImageIds.length} 张图片吗？`,
      onOk: async () => {
        setIsDeleting(true);
        try {
          // 调用批量删除API
          const batchDeleteRequest = { image_ids: selectedImageIds };
          const response = await imageApi.batchDeleteImages(batchDeleteRequest);
          
          if (response.data.code === 0) {
            message.success(`成功删除 ${selectedImageIds.length} 张图片！`);
            // 清空选中状态
            clearSelection();
            // 刷新图片列表
            onRefresh();
          } else {
            message.error('删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error('批量删除图片失败:', error);
          message.error('删除失败，请重试');
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [selectedImageIds, clearSelection, onRefresh]);

  /**
   * 处理鼠标按下事件，开始范围选择
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 确保点击的是空白区域，不是图片或其他元素
    if (e.target instanceof HTMLDivElement && e.target.classList.contains('images-grid')) {
      e.preventDefault();
      setIsSelecting(true);
      const startX = e.clientX;
      const startY = e.clientY;
      startPointRef.current = { x: startX, y: startY };
      setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });
    }
  }, []);

  /**
   * 处理鼠标移动事件，更新选择框大小
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isSelecting) return;

    const startX = startPointRef.current.x;
    const startY = startPointRef.current.y;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    setSelectionBox({ x, y, width, height });
  }, [isSelecting]);

  /**
   * 处理鼠标松开事件，完成选择
   */
  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;

    setIsSelecting(false);

    // 检查哪些图片在选择框内
    if (selectionBox.width > 0 && selectionBox.height > 0) {
      // 找到所有图片卡片元素
      const imageCards = document.querySelectorAll('[data-image-id]');
      const selectedInBox: Image[] = [];

      imageCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        
        // 检查图片卡片是否与选择框相交（只要有任何部分重叠就算选中）
        const isIntersecting = (
          cardRect.left < selectionBox.x + selectionBox.width && // 图片左边缘在选择框右边缘左侧
          cardRect.right > selectionBox.x && // 图片右边缘在选择框左边缘右侧
          cardRect.top < selectionBox.y + selectionBox.height && // 图片上边缘在选择框下边缘上方
          cardRect.bottom > selectionBox.y // 图片下边缘在选择框上边缘下方
        );
        
        if (isIntersecting) {
          // 获取图片ID并找到对应的图片数据
          const imageId = parseInt(card.getAttribute('data-image-id') || '0');
          const image = allImagesRef.current.find(img => img.id === imageId);
          if (image) {
            selectedInBox.push(image);
          }
        }
      });

      // 选中所有在选择框内的图片
      if (selectedInBox.length > 0) {
        // 先清空当前选择
        clearSelection();
        // 然后添加所有在选择框内的图片
        selectedInBox.forEach(image => {
          toggleImageSelection(image.id, image);
        });
      }
    }

    // 重置选择框
    setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
  }, [isSelecting, selectionBox, clearSelection, toggleImageSelection]);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  return {
    // 状态
    selectedImageIds,
    selectedImages,
    isDeleting,
    isSelecting,
    selectionBox,
    
    // 方法
    setAllImages,
    toggleImageSelection,
    clearSelection,
    isImageSelected,
    batchDeleteImages,
    handleMouseDown,
  };
};
