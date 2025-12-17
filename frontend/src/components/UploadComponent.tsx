import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Table, Progress, Input, Modal, message, Space, Typography, List } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { PlusOutlined, VideoCameraOutlined, FileTextOutlined } from '@ant-design/icons';
import { ImageUploadResponseData } from '../types';
import { imageApi } from '../api';
import { useImageContext } from './ImageContext';

const { Text } = Typography;

const UploadComponent: React.FC = () => {
  const [files, setFiles] = useState<Array<{
    id: string;
    file: File;
    preview: string;
    size: number;
    name: string;
    type: string;
    status: 'waiting' | 'uploading' | 'success' | 'error';
    progress: number;
    nicname: string;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadTable, setShowUploadTable] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImageUploadResponseData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 使用React Context获取fetchImages函数
  const { fetchImages } = useImageContext();

  // 生成唯一ID
  const generateId = React.useCallback((): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  // 处理文件，生成预览并添加到文件列表
  const processFiles = React.useCallback((selectedFiles: File[]) => {
    const newFiles: Array<{
      id: string;
      file: File;
      preview: string;
      size: number;
      name: string;
      type: string;
      status: 'waiting' | 'uploading' | 'success' | 'error';
      progress: number;
      nicname: string;
    }> = selectedFiles.map(file => {
      const isVideo = file.type.includes('video');
      const preview = isVideo ? '' : URL.createObjectURL(file);
      
      return {
        id: generateId(),
        file,
        preview,
        size: Math.round(file.size / 1024), // KB
        name: file.name,
        type: file.type,
        status: 'waiting' as const,
        progress: 0,
        nicname: file.name, // 默认使用文件名作为nicname
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    setShowUploadTable(true);
  }, [generateId]);

  // 处理文件选择
  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    processFiles(selectedFiles);
    // 清空input值，以便重新选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // 处理拖拽文件
  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // 处理拖拽文件
  const handleDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const clipdata = event.clipboardData;
      if (!clipdata) return;
      
      const items = clipdata.items;
      let file: File | null = null;
      
      // 检查剪贴板中是否有图片文件
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          file = items[i].getAsFile();
          break;
        }
      }
      
      if (file) {
        processFiles([file]);
        await uploadFile([file]);
      } else {
        // 检查是否是图片URL
        const maybeImgurl = (clipdata.getData('text/plain') || '').trim();
        const imgUrlRe = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
        if (imgUrlRe.test(maybeImgurl)) {
          // TODO: 实现URL上传逻辑
          console.log('URL上传:', maybeImgurl);
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [processFiles]);

  // 普通上传小文件
  const uploadSmallFile = React.useCallback(async (file: File, nicname?: string) => {
    try {
      console.log('开始上传小文件:', file.name, file.size);
      // 模拟上传进度，每500ms更新一次进度，减少渲染频率
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.file.name === file.name && f.file.size === file.size && f.status === 'uploading') {
            // 每次增加10%的进度
            const newProgress = Math.min(f.progress + 10, 90); // 最多到90%，等待上传完成
            // 只有当进度确实变化时才更新状态，减少不必要的渲染
            if (newProgress !== f.progress) {
              return { 
                id: f.id,
                file: f.file,
                preview: f.preview,
                size: f.size,
                name: f.name,
                type: f.type,
                status: f.status,
                progress: newProgress,
                nicname: f.nicname
              };
            }
          }
          return f;
        }));
      }, 500);
      
      const response = await imageApi.upload([file], nicname ? [nicname] : undefined);
      clearInterval(progressInterval);
      console.log('上传响应:', response);
      
      if (response.data.code === 0) {
        // 更新文件状态为成功，进度100%
        setFiles(prev => prev.map(f => 
          f.file.name === file.name && f.file.size === file.size ? { 
            id: f.id,
            file: f.file,
            preview: f.preview,
            size: f.size,
            name: f.name,
            type: f.type,
            status:"success" as const,
            progress: 100,
            nicname: f.nicname
          } : f
        ));
      } else {
        // 更新文件状态为错误
        setFiles(prev => prev.map(f => 
          f.file.name === file.name && f.file.size === file.size ? { 
            id: f.id,
            file: f.file,
            preview: f.preview,
            size: f.size,
            name: f.name,
            type: f.type,
            status: 'error' as const,
            progress: 0,
            nicname: f.nicname
          } : f
        ));
        message.error('文件上传失败：' + response.data.message);
      }
    } catch (error: any) {
      console.error('上传文件失败:', error);
      console.error('错误详情:', error.response?.data || error.message || error);
      setFiles(prev => prev.map(f => 
        f.file.name === file.name && f.file.size === file.size ? { 
          id: f.id,
          file: f.file,
          preview: f.preview,
          size: f.size,
          name: f.name,
          type: f.type,
          status: 'error' as const,
          progress: 0,
          nicname: f.nicname
        } : f
      ));
      message.error('文件上传失败，请重试：' + (error.response?.data?.message || error.message || '未知错误'));
    }
  }, []);

  // 分片上传大文件
  const uploadFileInChunks = React.useCallback(async (file: File, chunkSize: number, nicname?: string) => {
    try {
      // 1. 初始化分片上传
    const totalChunks = Math.ceil(file.size / chunkSize);
    const initResponse = await imageApi.initChunkUpload({
      filename: file.name,
      file_size: file.size,
      total_chunks: totalChunks,
      nicname: nicname // 添加nicname参数
    });
      
      if (initResponse.data.code !== 0) {
        throw new Error('初始化分片上传失败：' + initResponse.data.message);
      }
      
      const { upload_id, chunk_size } = initResponse.data.data;
      
      // 2. 并发上传所有分片
      const CHUNK_CONCURRENT_LIMIT = 5; // 分片并发上传限制
      let uploadedChunks = 0;
      
      // 创建所有分片上传任务
      const chunkTasks: number[] = [];
      for (let i = 0; i < totalChunks; i++) {
        chunkTasks.push(i);
      }
      
      // 定义分片上传结果类型
      interface ChunkUploadResult {
        index: number;
        success: boolean;
        error?: any;
      }
      
      // 并发上传控制函数
      const uploadChunk = async (index: number) => {
        const start = index * chunk_size;
        const end = Math.min(start + chunk_size, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('upload_id', upload_id);
        formData.append('chunk_index', index.toString());
        formData.append('file', chunk);
        formData.append('filename', file.name);
        
        await imageApi.uploadChunk(formData);
        
        // 原子更新上传进度
        uploadedChunks++;
        
        // 更新上传进度
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        setFiles(prev => prev.map(f => 
          f.file.name === file.name && f.file.size === file.size ? { 
            id: f.id,
            file: f.file,
            preview: f.preview,
            size: f.size,
            name: f.name,
            type: f.type,
            status: f.status,
            progress,
            nicname: f.nicname
          } : f
        ));
      };
      
      // 并发执行分片上传
      const executeChunkUploads = async () => {
        const MAX_RETRIES = 3; // 最大重试次数
        const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 5000); // 指数退避重试延迟
        
        const queue = [...chunkTasks];
        const results: ChunkUploadResult[] = [];
        
        const processQueue = async () => {
          while (queue.length > 0) {
            const index = queue.shift();
            if (index !== undefined) {
              let attempt = 0;
              let success = false;
              let error: any = undefined;
              
              // 重试逻辑
              while (attempt < MAX_RETRIES && !success) {
                try {
                  await uploadChunk(index);
                  success = true;
                } catch (err) {
                  attempt++;
                  error = err;
                  console.error(`上传分片 ${index} 失败，第 ${attempt} 次重试:`, err);
                  
                  if (attempt < MAX_RETRIES) {
                    // 等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, retryDelay(attempt)));
                  }
                }
              }
              
              results.push({ index, success, error });
            }
          }
        };
        
        // 创建并发上传任务
        const chunkUploadTasks: Promise<void>[] = [];
        for (let i = 0; i < Math.min(CHUNK_CONCURRENT_LIMIT, chunkTasks.length); i++) {
          chunkUploadTasks.push(processQueue());
        }
        
        await Promise.all(chunkUploadTasks);
        
        // 检查是否所有分片都上传成功
        const failedChunks = results.filter(r => !r.success);
        if (failedChunks.length > 0) {
          throw new Error(`分片上传失败，共 ${failedChunks.length} 个分片上传失败，已重试 ${MAX_RETRIES} 次`);
        }
      };
      
      await executeChunkUploads();
      
      // 3. 合并分片
      const mergeResponse = await imageApi.mergeChunks(upload_id);
      
      if (mergeResponse.data.code === 0) {
        // 更新文件状态为成功
        setFiles(prev => prev.map(f => 
          f.file.name === file.name && f.file.size === file.size ? { 
            id: f.id,
            file: f.file,
            preview: f.preview,
            size: f.size,
            name: f.name,
            type: f.type,
            status: 'success' as const,
            progress: 100,
            nicname: f.nicname
          } : f
        ));
      } else {
        throw new Error('合并分片失败：' + mergeResponse.data.message);
      }
    } catch (error) {
      console.error('分片上传失败:', error);
      setFiles(prev => prev.map(f => 
        f.file.name === file.name && f.file.size === file.size ? { 
          id: f.id,
          file: f.file,
          preview: f.preview,
          size: f.size,
          name: f.name,
          type: f.type,
          status: 'error' as const,
          progress: 0,
          nicname: f.nicname
        } : f
      ));
      message.error('文件上传失败：' + (error as Error).message);
    }
  }, []);

  // 上传文件到服务器
  const uploadFile = React.useCallback(async (uploadFiles: File[]) => {
    setIsUploading(true);
    
    // 2MB的阈值
    const CHUNK_THRESHOLD = 2 * 1024 * 1024;
    const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB分片大小
    const CONCURRENT_LIMIT = 3; // 并发上传限制
    
    try {
      // 定义文件上传结果类型
      interface FileUploadResult {
        file: File;
        success: boolean;
        error?: any;
      }
      
      // 并发上传函数，限制最大并发数
      const concurrentUpload = async () => {
        const results: FileUploadResult[] = [];
        const uploadQueue = [...uploadFiles];
        
        // 并发上传控制
        const executeUploads = async () => {
          const MAX_RETRIES = 2; // 单个文件最大重试次数
          const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 3000); // 指数退避重试延迟
          
          while (uploadQueue.length > 0) {
            const file = uploadQueue.shift();
            if (file) {
              // 获取对应文件的nicname
              const fileRecord = files.find(f => f.file === file);
              const nicname = fileRecord?.nicname;
              
              // 更新当前文件状态为上传中
              setFiles(prev => prev.map(f => 
                f.file === file ? { 
                  id: f.id,
                  file: f.file,
                  preview: f.preview,
                  size: f.size,
                  name: f.name,
                  type: f.type,
                  status: 'uploading' as const,
                  progress: 0,
                  nicname: f.nicname
                } : f
              ));
              
              let attempt = 0;
              let success = false;
              let error: any = undefined;
              
              // 重试逻辑
              while (attempt < MAX_RETRIES && !success) {
                try {
                  if (file.size > CHUNK_THRESHOLD) {
                    // 分片上传逻辑
                    await uploadFileInChunks(file, CHUNK_SIZE, nicname);
                  } else {
                    // 普通上传逻辑
                    await uploadSmallFile(file, nicname);
                  }
                  success = true;
                } catch (err) {
                  attempt++;
                  error = err;
                  console.error(`上传文件 ${file.name} 失败，第 ${attempt} 次重试:`, err);
                  
                  if (attempt < MAX_RETRIES) {
                    // 重置文件状态为等待上传，准备重试
                    setFiles(prev => prev.map(f => 
                      f.file === file ? { 
                        id: f.id,
                        file: f.file,
                        preview: f.preview,
                        size: f.size,
                        name: f.name,
                        type: f.type,
                        status: 'waiting' as const,
                        progress: 0,
                        nicname: f.nicname
                      } : f
                    ));
                    
                    // 等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, retryDelay(attempt)));
                    
                    // 更新当前文件状态为上传中
                    setFiles(prev => prev.map(f => 
                      f.file === file ? { 
                        id: f.id,
                        file: f.file,
                        preview: f.preview,
                        size: f.size,
                        name: f.name,
                        type: f.type,
                        status: 'uploading' as const,
                        progress: 0,
                        nicname: f.nicname
                      } : f
                    ));
                  }
                }
              }
              
              results.push({ file, success, error });
            }
          }
        };
        
        // 创建并发上传任务
        const tasks: Promise<void>[] = [];
        for (let i = 0; i < Math.min(CONCURRENT_LIMIT, uploadFiles.length); i++) {
          tasks.push(executeUploads());
        }
        
        // 等待所有任务完成
        await Promise.all(tasks);
        return results;
      };
      
      // 执行并发上传
      await concurrentUpload();
      
      // 刷新图片列表
      if (fetchImages) {
        fetchImages();
      }
      
      // 检查上传结果，只有成功才显示成功消息
      const successFiles = files.filter(f => {
        const isUploadedFile = uploadFiles.some(uf => uf.name === f.file.name && uf.size === f.file.size);
        return isUploadedFile && f.status === 'success';
      });
      
      if (successFiles.length === uploadFiles.length) {
        // 所有文件上传成功
        if (uploadFiles.length === 1) {
          message.success('文件上传完成！');
        } else {
          message.success('所有文件上传完成！');
        }
      } else if (successFiles.length > 0) {
        // 部分文件上传成功
        message.success(`${successFiles.length}/${uploadFiles.length} 个文件上传完成！`);
      }
      // 失败的情况已经在单个文件上传逻辑中处理了
    } catch (error) {
      console.error('上传失败:', error);
      // 这个错误只会在整体流程出错时触发，单个文件上传失败已经在各自的函数中处理
    } finally {
      setIsUploading(false);
    }
  }, [uploadSmallFile, uploadFileInChunks, fetchImages, files]);

  // 处理上传
  const handleUpload = React.useCallback(async () => {
    const waitingFiles = files.filter(f => f.status === 'waiting');
    if (waitingFiles.length === 0) {
      message.warning('暂无文件等待上传！');
      return;
    }
    
    await uploadFile(waitingFiles.map(f => f.file));
  }, [files, uploadFile]);

  // 处理删除文件
  const handleDeleteFile = React.useCallback((id: string) => {
    setFiles(prev => {
      const fileToDelete = prev.find(f => f.id === id);
      if (fileToDelete && fileToDelete.preview) {
        URL.revokeObjectURL(fileToDelete.preview); // 释放预览URL
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // 关闭上传结果模态框
  const handleCloseResultModal = React.useCallback(() => {
    setUploadResult(null);
  }, []);

  // 文件列表的列定义
  const fileColumns = React.useMemo<ColumnType<{ id: string; file: File; preview: string; size: number; name: string; type: string; status: "waiting" | "uploading" | "success" | "error"; progress: number; nicname: string; }>[]>(() => [
    {
      title: '预览',
      dataIndex: 'preview',
      key: 'preview',
      width: 80,
      align: 'center' as any,
      render: (preview: string, record: any) => {
        if (preview) {
          return <img src={preview} className="table-image-preview" alt={record.name} />;
        } else if (record.type.includes('video')) {
          return <VideoCameraOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
        } else {
          return <FileTextOutlined style={{ fontSize: 24, color: '#999' }} />;
        }
      },
    },
    {
      title: '文件',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '备注',
      dataIndex: 'nicname',
      key: 'nicname',
      render: (text: string, record: any) => (
        <Input
          value={text}
          onChange={(e) => {
            setFiles(prev => prev.map(f => 
              f.id === record.id ? { ...f, nicname: e.target.value } : f
            ));
          }}
          placeholder="请输入备注"
        />
      ),
    },
    {
      title: '大小(KB)',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      align: 'center' as any,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => {
        let statusText = '';
        let statusColor = '';
        
        switch (status) {
          case 'waiting':
            statusText = '等待';
            statusColor = '#999';
            break;
          case 'uploading':
            statusText = '上传中';
            statusColor = '#1890ff';
            break;
          case 'success':
            statusText = '成功';
            statusColor = '#52c41a';
            break;
          case 'error':
            statusText = '失败';
            statusColor = '#f5222d';
            break;
        }
        
        return <Text style={{ color: statusColor }}>{statusText}</Text>;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      align: 'center',
      render: (progress: number, record: any) => {
        if (record.status === 'uploading') {
          return (
            <div>
              <Progress percent={progress} size="small" />
            </div>
          );
        }
        return null;
      },
    },

    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'error' && (
            <Button
              type="text"
              size="small"
              onClick={() => {
                setFiles(prev => prev.map(f => 
                  f.id === record.id ? { ...f, status: 'waiting', progress: 0 } : f
                ));
              }}
            >
              重传
            </Button>
          )}
          <Button
            type="text"
            size="small"
            danger
            onClick={() => handleDeleteFile(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ], [handleDeleteFile]);

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
    <Card className="upload-card" title="文件上传">
      <div 
        className="layui-upload-drag" 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          onChange={handleFileChange}
          accept="image/*,video/mp4,video/ogg,video/webm,video/3gpp,video/quicktime"
          multiple
        />
        <PlusOutlined className="upload-icon" />
        <div>
          <Text strong>点击、粘贴或拖拽到此处上传</Text>
        </div>
        <div>
          <Text type="secondary">允许 jpg, png, gif, jpeg, webp 图片</Text>
        </div>
      </div>
      
      {/* 上传列表 */}
      {showUploadTable && files.length > 0 && (
        <div className="upload-table-container">
          <div className="upload-table-actions">
            <Button 
              type="primary" 
              onClick={handleUpload}
              disabled={isUploading}
              loading={isUploading}
            >
              {isUploading ? '上传中...' : '开始上传'}
            </Button>
          </div>
          
          <Table
            columns={fileColumns}
            dataSource={files}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />
        </div>
      )}
      
      {/* 上传结果模态框 */}
      <Modal
        title="上传结果"
        visible={!!uploadResult}
        onCancel={handleCloseResultModal}
        footer={[
          <Button key="close" onClick={handleCloseResultModal}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <div>
          <p className="result-summary">
            上传成功：{uploadResult?.uploaded} 张，失败：{uploadResult?.failed} 张
          </p>
        </div>
        
        {uploadResult?.images.length && (
          <List
            dataSource={uploadResult.images}
            renderItem={(image, index) => (
              <Card key={image.id} title={`图片 ${index + 1}`} size="small" className="result-modal-card">
                <div className="result-modal-code-container">
                  <Text type="secondary" className="result-modal-label">图片链接</Text>
                  <div className="result-modal-code">{image.url}</div>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => copyToClipboard(image.url, '图片链接')}
                    className="result-modal-copy-btn"
                  >
                    复制链接
                  </Button>
                </div>
                
                <div className="result-modal-code-container">
                  <Text type="secondary" className="result-modal-label">Markdown</Text>
                  <div className="result-modal-code">![{image.filename}]({image.url})</div>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => copyToClipboard(`![${image.filename}](${image.url})`, 'Markdown')}
                    className="result-modal-copy-btn"
                  >
                    复制Markdown
                  </Button>
                </div>
                
                <div className="result-modal-code-container">
                  <Text type="secondary" className="result-modal-label">HTML</Text>
                  <div className="result-modal-code"><img src="{image.url}" alt="{image.filename}" /></div>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => copyToClipboard(`<img src=\"{image.url}\" alt=\"{image.filename}\" />`, 'HTML')}
                    className="result-modal-copy-btn"
                  >
                    复制HTML
                  </Button>
                </div>
              </Card>
            )}
          />
        )}
      </Modal>
    </Card>
  );
};

export default UploadComponent;
