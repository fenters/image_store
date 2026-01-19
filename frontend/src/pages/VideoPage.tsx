import React, { useState, useRef, useEffect } from 'react';
import { videoApi } from '../api';
import { Video } from '../types';
import { Layout, Button, Modal, message, Empty, Typography, Divider } from 'antd';
import '../styles/MainPage.css';
import Header from '../components/Header';
import { useImagePreview } from '../hooks/useImagePreview';
import { useImageContextMenu } from '../hooks/useImageContextMenu';
import { useBatchDelete } from '../hooks/useBatchDelete';
import VideoCard from '../components/VideoCard';
import UploadComponent from '../components/UploadComponent';
import { ImageProvider } from '../components/ImageContext';

const { Content } = Layout;
const { Title } = Typography;

const VideoPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // 使用视频预览hook（共享）
  const { openPreview, PreviewModal } = useImagePreview();
  
  // 使用ref存储最新的状态，避免将它们作为fetchVideos的依赖项
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

  // 获取视频列表（分页加载）
  const fetchVideos = React.useCallback(async (pageNum: number = 1, append: boolean = false) => {
    // 从ref获取最新状态
    const { loading: currentLoading, hasMore: currentHasMore } = stateRef.current;
    
    if (currentLoading || (!currentHasMore && append)) return;
    
    setLoading(true);
    try {
      const response = await videoApi.getVideoList({ page: pageNum, page_size: 8 });
      if (response.data.code === 0) {
        const newVideos = response.data.data.videos || [];
        setVideos(prev => append ? [...prev, ...newVideos] : newVideos);
        setHasMore(newVideos.length >= 8);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
      message.error('获取视频列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 使用批量删除hook
  const batchDeleteHook = useBatchDelete(fetchVideos, 'video');
  const { 
    selectedIds: selectedVideoIds, 
    isDeleting, 
    setAllItems: setAllVideos, 
    toggleSelection: toggleVideoSelection, 
    clearSelection, 
    isSelected: isVideoSelected, 
    batchDelete,
    isSelecting,
    selectionBox,
    handleMouseDown
  } = batchDeleteHook;

  // 使用视频上下文菜单hook（共享）
  const { 
    showContextMenu, 
    ContextMenu 
  } = useImageContextMenu({
    onRefresh: fetchVideos,
    onCopyLink: (video) => {
      copyToClipboard(video.url, '视频链接');
    },
    onBatchDelete: batchDelete,
    selectedImageIds: selectedVideoIds,
  });

  const videosGridRef = useRef<HTMLDivElement>(null);

  // 初始加载
  React.useEffect(() => {
    fetchVideos(1, false);
  }, [fetchVideos]);

  // 当视频列表变化时，更新批量删除hook的视频列表
  useEffect(() => {
    setAllVideos(videos as any);
  }, [videos, setAllVideos]);

  // 加载更多
  const loadMoreVideos = React.useCallback(() => {
    if (hasMore && !loading) {
      fetchVideos(page + 1, true);
    }
  }, [hasMore, loading, page, fetchVideos]);

  // 处理删除视频
  const handleDeleteVideo = React.useCallback(async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个视频吗？',
      onOk: async () => {
        try {
          const response = await videoApi.deleteVideo(id);
          if (response.data.code === 0) {
            // 刷新视频列表
            fetchVideos();
            message.success('删除成功！');
          } else {
            message.error('删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error('删除视频失败:', error);
          message.error('删除失败，请重试');
        }
      },
    });
  }, [fetchVideos]);

  // 复制链接
  const copyToClipboard = React.useCallback((text: string, messageType: string) => {
    // 尝试使用现代的Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          message.success(`${messageType}复制成功！`);
        })
        .catch(() => {
          // 降级到传统方法
          useLegacyCopy(text, messageType);
        });
    } else {
      // 直接使用传统方法
      useLegacyCopy(text, messageType);
    }
  }, []);

  // 传统的复制方法
  const useLegacyCopy = React.useCallback((text: string, messageType: string) => {
    try {
      // 创建一个临时的textarea元素
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 确保元素不在屏幕上，并且设置一些必要的样式
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      
      // 选择文本并复制
      textArea.focus();
      textArea.select();
      
      let successful = false;
      try {
        successful = document.execCommand('copy');
      } catch (err) {
        console.error('复制失败:', err);
      }
      
      // 清理
      document.body.removeChild(textArea);
      
      if (successful) {
        message.success(`${messageType}复制成功！`);
      } else {
        message.error(`${messageType}复制失败，请手动复制！`);
      }
    } catch (error) {
      console.error('传统复制方法失败:', error);
      message.error(`${messageType}复制失败，请手动复制！`);
    }
  }, []);

  return (
    <Layout className="page-layout">
      {/* 导航栏 */}
      <Header />

      <Content className="main-content">
        {/* 上传组件 */}
        <ImageProvider images={videos} fetchImages={fetchVideos}>
          <UploadComponent />
        </ImageProvider>

        <Divider />

        {/* 视频列表 */}
        <div className="images-container">
          <Title level={4} className="images-section-title">我的视频</Title>
          
          {videos.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无视频，上传一个试试吧！
                </span>
              }
            />
          ) : (
            <>
              <div 
                className="images-grid"
                ref={videosGridRef}
                onMouseDown={handleMouseDown}
              >
                {videos.map(video => (
                  <VideoCard 
                    key={video.id} 
                    video={video}
                    copyToClipboard={copyToClipboard}
                    handleDeleteVideo={handleDeleteVideo}
                    onContextMenu={showContextMenu}
                    onVideoClick={(url) => { 
                        openPreview(url); 
                    }}
                    isSelected={isVideoSelected(video.id)}
                    onToggleSelect={toggleVideoSelection}
                    data-video-id={video.id}
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
                    onClick={loadMoreVideos}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
              
              {!hasMore && videos.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>
                  没有更多视频了
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
        {selectedVideoIds.length > 0 && (
          <div className="batch-actions">
            <div className="batch-actions-info">
              已选择 {selectedVideoIds.length} 个视频
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
                onClick={batchDelete}
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

export default VideoPage;