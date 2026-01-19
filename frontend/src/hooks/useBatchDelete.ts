import { useState, useCallback, useRef, useEffect } from 'react';
import { Image, Video } from '../types';
import { imageApi, videoApi } from '../api';
import { message, Modal } from 'antd';

/**
 * 批量删除资源Hook
 * @param onRefresh 刷新资源列表的回调函数
 * @param type 资源类型：'image' 或 'video'
 */
export const useBatchDelete = (onRefresh: () => void, type: 'image' | 'video' = 'image') => {
  // 选中的资源ID列表
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // 记录当前选中的资源数据
  const [selectedItems, setSelectedItems] = useState<(Image | Video)[]>([]);
  // 是否正在删除
  const [isDeleting, setIsDeleting] = useState(false);
  // 所有资源列表的引用，用于批量操作时查找资源数据
  const allItemsRef = useRef<(Image | Video)[]>([]);
  
  // 范围选择相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const startPointRef = useRef({ x: 0, y: 0 });

  /**
   * 设置所有资源列表，用于查找资源数据
   */
  const setAllItems = useCallback((items: (Image | Video)[]) => {
    allItemsRef.current = items;
  }, []);

  /**
   * 切换资源选中状态
   */
  const toggleSelection = useCallback((itemId: number, item: Image | Video) => {
    setSelectedIds(prev => {
      if (prev.includes(itemId)) {
        // 取消选中
        const newIds = prev.filter(id => id !== itemId);
        setSelectedItems(prevItems => prevItems.filter(i => i.id !== itemId));
        return newIds;
      } else {
        // 添加选中
        const newIds = [...prev, itemId];
        setSelectedItems(prevItems => [...prevItems, item]);
        return newIds;
      }
    });
  }, []);

  /**
   * 取消所有选中
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedItems([]);
  }, []);

  /**
   * 检查资源是否被选中
   */
  const isSelected = useCallback((itemId: number) => {
    return selectedIds.includes(itemId);
  }, [selectedIds]);

  /**
   * 执行批量删除
   */
  const batchDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.warning(`请先选择要删除的${type === 'image' ? '图片' : '视频'}`);
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.length} ${type === 'image' ? '张图片' : '个视频'}吗？`,
      onOk: async () => {
        setIsDeleting(true);
        try {
          let response;
          // 根据资源类型调用不同的API
          if (type === 'image') {
            const batchDeleteRequest = { image_ids: selectedIds };
            response = await imageApi.batchDeleteImages(batchDeleteRequest);
          } else {
            const batchDeleteRequest = { video_ids: selectedIds };
            response = await videoApi.batchDeleteVideos(batchDeleteRequest);
          }
          
          if (response.data.code === 0) {
            message.success(`成功删除 ${selectedIds.length} ${type === 'image' ? '张图片' : '个视频'}！`);
            // 清空选中状态
            clearSelection();
            // 刷新资源列表
            onRefresh();
          } else {
            message.error('删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error(`批量删除${type === 'image' ? '图片' : '视频'}失败:`, error);
          message.error('删除失败，请重试');
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [selectedIds, clearSelection, onRefresh, type]);

  /**
   * 处理鼠标按下事件，开始范围选择
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 确保点击的是空白区域，不是资源或其他元素
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

    // 检查哪些资源在选择框内
    if (selectionBox.width > 0 && selectionBox.height > 0) {
      // 找到所有资源卡片元素
      const resourceCards = document.querySelectorAll(`[data-${type}-id]`);
      const selectedInBox: (Image | Video)[] = [];

      resourceCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        
        // 检查资源卡片是否与选择框相交（只要有任何部分重叠就算选中）
        const isIntersecting = (
          cardRect.left < selectionBox.x + selectionBox.width && // 资源左边缘在选择框右边缘左侧
          cardRect.right > selectionBox.x && // 资源右边缘在选择框左边缘右侧
          cardRect.top < selectionBox.y + selectionBox.height && // 资源上边缘在选择框下边缘上方
          cardRect.bottom > selectionBox.y // 资源下边缘在选择框上边缘下方
        );
        
        if (isIntersecting) {
          // 获取资源ID并找到对应的资源数据
          const itemId = parseInt(card.getAttribute(`data-${type}-id`) || '0');
          const item = allItemsRef.current.find(i => i.id === itemId);
          if (item) {
            selectedInBox.push(item);
          }
        }
      });

      // 选中所有在选择框内的资源
      if (selectedInBox.length > 0) {
        // 先清空当前选择
        clearSelection();
        // 然后添加所有在选择框内的资源
        selectedInBox.forEach(item => {
          toggleSelection(item.id, item);
        });
      }
    }

    // 重置选择框
    setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
  }, [isSelecting, selectionBox, clearSelection, toggleSelection, type]);

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
    selectedIds,
    selectedItems,
    isDeleting,
    isSelecting,
    selectionBox,
    
    // 方法
    setAllItems,
    toggleSelection,
    clearSelection,
    isSelected,
    batchDelete,
    handleMouseDown,
  };
};
