import { useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import type { Image } from '../types';
import { message } from 'antd';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface UseImageContextMenuProps {
  onRefresh?: () => void;
  onCopyImage?: (image: Image) => void;
  onCopyLink?: (image: Image) => void;
  onOpenInNewWindow?: (image: Image) => void;
  onBatchDelete?: () => void;
  selectedImageIds?: number[];
}

interface UseImageContextMenuReturn {
  isVisible: boolean;
  position: ContextMenuPosition;
  selectedImage: Image | null;
  showContextMenu: (e: React.MouseEvent, image: Image) => void;
  hideContextMenu: () => void;
  handleRefresh: () => void;
  handleCopyImage: () => void;
  handleCopyLink: (format: 'url' | 'html' | 'markdown') => void;
  handleOpenInNewWindow: () => void;
  handleBatchDelete: () => void;
  ContextMenu: () => ReactNode;
}

export const useImageContextMenu = ({ 
  onCopyImage,
  onCopyLink, 
  onOpenInNewWindow,
  onBatchDelete,
  selectedImageIds = []
}: UseImageContextMenuProps = {}): UseImageContextMenuReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 显示上下文菜单
  const showContextMenu = useCallback((e: React.MouseEvent, image: Image) => {
    e.preventDefault();
    e.stopPropagation();
    
    setPosition({ x: e.clientX, y: e.clientY });
    setSelectedImage(image);
    setIsVisible(true);
  }, []);

  // 隐藏上下文菜单
  const hideContextMenu = useCallback(() => {
    setIsVisible(false);
    setSelectedImage(null);
  }, []);

  // 点击页面其他地方或按ESC键时隐藏上下文菜单
  useEffect(() => {
    const handleClickOutside = () => hideContextMenu();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu();
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [hideContextMenu]);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    hideContextMenu();
    window.location.reload();
  }, [hideContextMenu]);

  // 处理复制文本的辅助函数（支持降级）
  const copyTextToClipboard = useCallback((text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // 尝试使用现代的Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => resolve(true))
          .catch(() => {
            // 降级到传统方法
            resolve(useLegacyCopy(text));
          });
      } else {
        // 直接使用传统方法
        resolve(useLegacyCopy(text));
      }
    });
  }, []);

  // 传统的复制方法
  const useLegacyCopy = useCallback((text: string): boolean => {
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
      return successful;
    } catch (error) {
      console.error('传统复制方法失败:', error);
      return false;
    }
  }, []);

  // 处理复制图片
  const handleCopyImage = useCallback(() => {
    if (!selectedImage) return;
    
    try {
      // 创建一个新的Image对象来加载图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = selectedImage.url;
      
      img.onload = () => {
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 将图片绘制到canvas上
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // 将canvas内容转换为Blob
          canvas.toBlob((blob) => {
            if (blob) {
              // 尝试复制图片数据
              if (navigator.clipboard && window.isSecureContext) {
                const clipboardItem = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([clipboardItem])
                  .then(() => {
                    message.success('图片复制成功！');
                    if (onCopyImage) {
                      onCopyImage(selectedImage);
                    }
                  })
                  .catch((error) => {
                    console.error('复制图片数据失败:', error);
                    // 如果复制图片数据失败，尝试复制图片链接
                    copyTextToClipboard(selectedImage.url)
                      .then((success) => {
                        if (success) {
                          message.success('图片数据复制失败，已复制图片链接！');
                          if (onCopyImage) {
                            onCopyImage(selectedImage);
                          }
                        } else {
                          message.error('图片复制失败，请手动复制！');
                        }
                      });
                  })
                  .finally(() => {
                    hideContextMenu();
                  });
              } else {
                // 非安全上下文，直接复制图片链接
                copyTextToClipboard(selectedImage.url)
                  .then((success) => {
                    if (success) {
                      message.success('已复制图片链接！');
                      if (onCopyImage) {
                        onCopyImage(selectedImage);
                      }
                    } else {
                      message.error('图片复制失败，请手动复制！');
                    }
                  })
                  .finally(() => {
                    hideContextMenu();
                  });
              }
            } else {
              hideContextMenu();
              message.error('图片复制失败，请手动复制！');
            }
          });
        } else {
          hideContextMenu();
          message.error('图片复制失败，请手动复制！');
        }
      };
      
      img.onerror = () => {
        hideContextMenu();
        message.error('图片加载失败，无法复制！');
      };
    } catch (error) {
      console.error('复制图片失败:', error);
      message.error('图片复制失败，请手动复制！');
      hideContextMenu();
    }
  }, [selectedImage, hideContextMenu, onCopyImage, copyTextToClipboard]);

  // 处理复制链接
  const handleCopyLink = useCallback((format: 'url' | 'html' | 'markdown') => {
    if (!selectedImage) return;
    
    let linkText = '';
    const { url, filename } = selectedImage;
    
    switch (format) {
      case 'url':
        linkText = url;
        break;
      case 'html':
        linkText = `<img src="${url}" alt="${filename}">`;
        break;
      case 'markdown':
        linkText = `![${filename}](${url})`;
        break;
    }
    
    copyTextToClipboard(linkText)
      .then((success) => {
        if (success) {
          message.success(`链接已复制为${format}格式！`);
          if (onCopyLink) {
            onCopyLink(selectedImage);
          }
        } else {
          message.error('链接复制失败，请手动复制！');
        }
      })
      .finally(() => {
        hideContextMenu();
      });
  }, [selectedImage, onCopyLink, hideContextMenu, copyTextToClipboard]);

  // 处理新窗口打开
  const handleOpenInNewWindow = useCallback(() => {
    if (selectedImage) {
      window.open(selectedImage.url, '_blank');
      if (onOpenInNewWindow) {
        onOpenInNewWindow(selectedImage);
      }
      hideContextMenu();
    }
  }, [selectedImage, onOpenInNewWindow, hideContextMenu]);

  // 处理批量删除
  const handleBatchDelete = useCallback(() => {
    if (onBatchDelete && selectedImageIds.length > 1) {
      onBatchDelete();
      hideContextMenu();
    }
  }, [onBatchDelete, selectedImageIds, hideContextMenu]);

  // 上下文菜单组件
  const ContextMenu = useCallback((): ReactNode => {
    if (!isVisible || !selectedImage) return null;
    
    // 判断是否为视频
    const isVideo = 'cover_url' in selectedImage && 'duration' in selectedImage;
    
    return (
      <div
        ref={menuRef}
        className="image-context-menu"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          padding: '4px 0',
          minWidth: '120px',
        }}
      >
        {/* 刷新 */}
        <div
          className="context-menu-item"
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'rgba(0, 0, 0, 0.85)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          刷新
        </div>
        
        {/* 复制图片 - 仅图片显示 */}
        {!isVideo && (
          <div
            className="context-menu-item"
            onClick={handleCopyImage}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.85)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            复制图片
          </div>
        )}
        
        {/* 复制链接 */}
        <div
          className="context-menu-item"
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'rgba(0, 0, 0, 0.85)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          复制链接
          <div className="context-menu-submenu"
            style={{
              position: 'absolute',
              left: '100%',
              top: '0',
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'none',
              minWidth: '120px',
            }}
          >
            <div
              className="context-menu-item"
              onClick={() => handleCopyLink('url')}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.85)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              URL
            </div>
            <div
              className="context-menu-item"
              onClick={() => handleCopyLink('html')}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.85)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              HTML
            </div>
            <div
              className="context-menu-item"
              onClick={() => handleCopyLink('markdown')}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.85)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              Markdown
            </div>
          </div>
        </div>
        
        {/* 新窗口打开 */}
        <div
          className="context-menu-item"
          onClick={handleOpenInNewWindow}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'rgba(0, 0, 0, 0.85)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          新窗口打开
        </div>
        
        {/* 批量删除 */}
        {selectedImageIds.length > 1 && (
          <div
            className="context-menu-item"
            onClick={handleBatchDelete}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ff4d4f',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff2f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            批量删除 ({selectedImageIds.length} 项)
          </div>
        )}
      </div>
    );
  }, [isVisible, position, selectedImage, selectedImageIds, handleRefresh, handleCopyImage, handleCopyLink, handleOpenInNewWindow, handleBatchDelete]);

  // 添加CSS样式来处理子菜单的显示
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .context-menu-item:hover .context-menu-submenu {
        display: block !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return {
    isVisible,
    position,
    selectedImage,
    showContextMenu,
    hideContextMenu,
    handleRefresh,
    handleCopyImage,
    handleCopyLink,
    handleOpenInNewWindow,
    handleBatchDelete,
    ContextMenu,
  };
};
