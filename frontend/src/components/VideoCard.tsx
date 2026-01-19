import React from 'react';
import { Card, Button, Image as AntImage } from 'antd';
import { CopyOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Video } from '../types';

interface VideoCardProps {
  video: Video;
  copyToClipboard: (text: string, messageType: string) => void;
  handleDeleteVideo: (id: number) => Promise<void>;
  onContextMenu: (e: React.MouseEvent, video: Video) => void;
  onVideoClick: (videoUrl: string) => void;
  isSelected: boolean;
  onToggleSelect: (videoId: number, video: Video) => void;
  'data-video-id': number;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({ 
  video, 
  copyToClipboard, 
  handleDeleteVideo, 
  onContextMenu, 
  onVideoClick, 
  isSelected, 
  onToggleSelect,
  'data-video-id': dataVideoId
}) => {

  // 处理卡片点击，支持单选
  const handleCardClick = (e: React.MouseEvent) => {
    // 检查事件路径中是否包含按钮元素
    let target = e.target as Element;
    let isButtonClick = false;
    
    // 遍历事件路径，检查是否点击了按钮
    while (target) {
      if (target.tagName === 'BUTTON') {
        isButtonClick = true;
        break;
      }
      target = target.parentElement || target.parentNode as Element;
    }
    
    // 如果不是按钮点击，执行选择操作
    if (!isButtonClick) {
      onToggleSelect(video.id, video);
    }
  };

  // 处理选择框点击
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(video.id, video);
  };

  // 处理封面点击，播放/暂停视频
  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      onToggleSelect(video.id, video);
    } else {
      onVideoClick(video.url);
    }
  };

  return (
    <Card 
      className={`video-card ${isSelected ? 'video-card-selected' : ''}`}
      hoverable
      onClick={handleCardClick}
      data-video-id={dataVideoId}
    >
      {/* 选择框 */}
      <div className="video-card-select" onClick={handleSelectClick}>
        <div className={`select-checkbox ${isSelected ? 'selected' : ''}`}>
          {isSelected && <span className="select-checkmark">✓</span>}
        </div>
      </div>
      
      <div className="video-card-image-container">
        <div className="video-cover-wrapper" onClick={handleCoverClick}>
          <AntImage
            src={video.cover_url || ''}
            className="video-card-cover"
            alt={video.filename}
            onContextMenu={(e) => onContextMenu(e, video)} // 右键点击上下文菜单
            preview={false} // 禁用内置预览，使用自定义的PreviewModal
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1600 800'%3E%3Cg %3E%3Cpath fill='%23f5f5f5' d='M0 0h1600v800H0z'/%3E%3Cg%3E%3Cpolygon fill='%23d9d9d9' points='800 100 600 300 1000 300'/%3E%3Cpolygon fill='%23cccccc' points='800 100 600 500 1000 500'/%3E%3Cpolygon fill='%23bfbfbf' points='800 100 600 700 1000 700'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"
          />
          <div className="video-play-button">
            <PlayCircleOutlined style={{ fontSize: 48, color: '#fff' }} />
          </div>
          <div className="video-duration">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="video-card-info">
        <p className="video-card-title">
          {(() => {
            const name = video.nicname || video.filename;
            return name.split(/[\/]/).pop() || name;
          })()}
        </p>
        <div className="video-card-meta">
          <span className="video-resolution">{video.resolution}</span>
          <span className="video-size">{Math.round(video.size / 1024 / 1024)}MB</span>
        </div>
        <div className="video-card-actions">
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copyToClipboard(video.url, '视频链接')}
          >
            复制链接
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteVideo(video.id)}
          >
            删除
          </Button>
        </div>
      </div>
    </Card>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;