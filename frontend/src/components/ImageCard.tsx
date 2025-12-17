import React from 'react';
import { Card, Button, Image as AntImage } from 'antd';
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { Image } from '../types';

interface ImageCardProps {
  image: Image;
  copyToClipboard: (text: string, messageType: string) => void;
  handleDeleteImage: (id: number) => Promise<void>;
  onContextMenu: (e: React.MouseEvent, image: Image) => void;
  onImageClick: (imageUrl: string) => void;
  isSelected: boolean;
  onToggleSelect: (imageId: number, image: Image) => void;
  'data-image-id': number;
}

const ImageCard: React.FC<ImageCardProps> = React.memo(({ 
  image, 
  copyToClipboard, 
  handleDeleteImage, 
  onContextMenu, 
  onImageClick, 
  isSelected, 
  onToggleSelect,
  'data-image-id': dataImageId
}) => {
  // 处理图片点击，支持Shift键多选
  const handleImageClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      onToggleSelect(image.id, image);
    } else {
      onImageClick(image.url);
    }
  };

  // 处理卡片点击，支持单选
  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不执行选择操作
    if (!(e.target instanceof HTMLButtonElement)) {
      onToggleSelect(image.id, image);
    }
  };

  // 处理选择框点击
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(image.id, image);
  };

  return (
    <Card 
      className={`image-card ${isSelected ? 'image-card-selected' : ''}`}
      hoverable
      onClick={handleCardClick}
      data-image-id={dataImageId}
    >
      {/* 选择框 */}
      <div className="image-card-select" onClick={handleSelectClick}>
        <div className={`select-checkbox ${isSelected ? 'selected' : ''}`}>
          {isSelected && <span className="select-checkmark">✓</span>}
        </div>
      </div>
      
      <div className="image-card-image-container">
        <AntImage
          src={image.url}
          className="image-card-image"
          alt={image.filename}
          onClick={handleImageClick} // 左键点击放大预览（Shift键多选）
          onContextMenu={(e) => onContextMenu(e, image)} // 右键点击上下文菜单
          preview={false} // 禁用内置预览，使用自定义的PreviewModal
        />
      </div>
      <div className="image-card-info">
        <p className="image-card-title">
          {(() => {
            const name = image.nicname || image.filename;
            return name.split(/[\/]/).pop() || name;
          })()}
        </p>
        <div className="image-card-actions">
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copyToClipboard(image.url, '图片链接')}
          >
            复制链接
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteImage(image.id)}
          >
            删除
          </Button>
        </div>
      </div>
    </Card>
  );
});

ImageCard.displayName = 'ImageCard';

export default ImageCard;
