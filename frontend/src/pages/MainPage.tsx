import React, { useState, useRef, useEffect } from 'react';
import { imageApi } from '../api';
import { Image } from '../types';
import { Layout, Button, Modal, message, Empty, Typography, Divider } from 'antd';
import '../styles/MainPage.css';
import Header from '../components/Header';
import { useImagePreview } from '../hooks/useImagePreview';
import { useImageContextMenu } from '../hooks/useImageContextMenu';
import { useBatchDelete } from '../hooks/useBatchDelete';
import ImageCard from '../components/ImageCard';
import UploadComponent from '../components/UploadComponent';
import { ImageProvider } from '../components/ImageContext';

const { Content } = Layout;
const { Title } = Typography;

const MainPage: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // 使用图片预览hook（共享）
  const { openPreview, PreviewModal } = useImagePreview();
  
  // 使用ref存储最新的状态，避免将它们作为fetchImages的依赖项
  const stateRef = useRef({
    loading,
    hasMore
  });
  
  // 当loading或hasMore变化时，更新ref
  useEffect(() => {
    stateRef.current = {
      loading,
      hasMore
    };
  }, [loading, hasMore]);

  // 获取图片列表（分页加载）
  const fetchImages = React.useCallback(async (pageNum: number = 1, append: boolean = false) => {
    // 从ref获取最新状态
    const { loading: currentLoading, hasMore: currentHasMore } = stateRef.current;
    
    if (currentLoading || (!currentHasMore && append)) return;
    
    setLoading(true);
    try {
      const response = await imageApi.getImageList({ page: pageNum, page_size: 8 });
      if (response.data.code === 0) {
        const newImages = response.data.data;
        setImages(prev => append ? [...prev, ...newImages] : newImages);
        setHasMore(newImages.length >= 8);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取图片列表失败:', error);
      message.error('获取图片列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 使用批量删除hook
  const batchDeleteHook = useBatchDelete(fetchImages);
  const { 
    selectedImageIds, 
    isDeleting, 
    setAllImages, 
    toggleImageSelection, 
    clearSelection, 
    isImageSelected, 
    batchDeleteImages,
    isSelecting,
    selectionBox,
    handleMouseDown
  } = batchDeleteHook;

  // 使用图片上下文菜单hook（共享）
  const { 
    showContextMenu, 
    ContextMenu 
  } = useImageContextMenu({
    onRefresh: fetchImages,
    onBatchDelete: batchDeleteImages,
    selectedImageIds: selectedImageIds,
  });

  const imagesGridRef = useRef<HTMLDivElement>(null);

  // 初始加载
  React.useEffect(() => {
    fetchImages(1, false);
  }, [fetchImages]);

  // 当图片列表变化时，更新批量删除hook的图片列表
  useEffect(() => {
    setAllImages(images);
  }, [images, setAllImages]);

  // 加载更多
  const loadMoreImages = React.useCallback(() => {
    if (hasMore && !loading) {
      fetchImages(page + 1, true);
    }
  }, [hasMore, loading, page, fetchImages]);

  // 处理删除图片
  const handleDeleteImage = React.useCallback(async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      onOk: async () => {
        try {
          const response = await imageApi.deleteImage(id);
          if (response.data.code === 0) {
            // 刷新图片列表
            fetchImages();
            message.success('删除成功！');
          } else {
            message.error('删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error('删除图片失败:', error);
          message.error('删除失败，请重试');
        }
      },
    });
  }, [fetchImages]);

  // 复制链接
  const copyToClipboard = React.useCallback((text: string, messageType: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success(`${messageType}复制成功！`);
      })
      .catch(() => {
        message.error(`${messageType}复制失败，请手动复制！`);
      });
  }, []);

  return (
    <Layout className="page-layout">
      {/* 导航栏 */}
      <Header />

      <Content className="main-content">
        {/* 上传组件 */}
        <ImageProvider images={images} fetchImages={fetchImages}>
          <UploadComponent />
        </ImageProvider>

        <Divider />

        {/* 图片列表 */}
        <div className="images-container">
          <Title level={4} className="images-section-title">我的图片</Title>
          
          {images.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无图片，上传一张试试吧！
                </span>
              }
            />
          ) : (
            <>
              <div 
                className="images-grid"
                ref={imagesGridRef}
                onMouseDown={handleMouseDown}
              >
                {images.map(image => (
                  <ImageCard 
                    key={image.id} 
                    image={image}
                    copyToClipboard={copyToClipboard}
                    handleDeleteImage={handleDeleteImage}
                    onContextMenu={showContextMenu}
                    onImageClick={openPreview}
                    isSelected={isImageSelected(image.id)}
                    onToggleSelect={toggleImageSelection}
                    data-image-id={image.id}
                  />
                ))}
                
                {/* 范围选择框 */}
                {isSelecting && (
                  <div 
                    className="selection-box"
                    style={{
                      position: 'fixed',
                      left: selectionBox.x + 'px',
                      top: selectionBox.y + 'px',
                      width: selectionBox.width + 'px',
                      height: selectionBox.height + 'px',
                      backgroundColor: 'rgba(24, 144, 255, 0.2)',
                      border: '2px solid #1890ff',
                      pointerEvents: 'none',
                      zIndex: 9999
                    }}
                  />
                )}
              </div>
              
              {/* 加载更多 */}
              {hasMore && (
                <div className="load-more-container">
                  <Button 
                    type="default" 
                    loading={loading} 
                    onClick={loadMoreImages}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
              
              {!hasMore && images.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>
                  没有更多图片了
                </div>
              )}
              
              {/* 共享的预览模态框 */}
              <PreviewModal />
              
              {/* 共享的上下文菜单 */}
              <ContextMenu />
            </>
          )}
        </div>
        
        {/* 批量操作栏 */}
        {selectedImageIds.length > 0 && (
          <div className="batch-actions">
            <div className="batch-actions-info">
              已选择 {selectedImageIds.length} 张图片
            </div>
            <div className="batch-actions-buttons">
              <Button 
                type="default" 
                onClick={clearSelection}
              >
                取消选择
              </Button>
              <Button 
                type="primary" 
                danger 
                loading={isDeleting}
                onClick={batchDeleteImages}
              >
                批量删除
              </Button>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default MainPage;