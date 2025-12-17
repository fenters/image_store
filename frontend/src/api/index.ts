import request from './request';
import {
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  RegisterResponseData,
  TokenCreateRequest,
  TokenCreateResponseData,
  TokenListResponseData,
  TokenDeleteResponseData,
  Image,
  ImageListRequest,
  ImageUploadResponseData,
  ImageDeleteResponseData,
  ImageBatchDeleteRequest,
  ImageBatchDeleteResponseData,
  APIResponse,
  HealthCheckResponse,
  ChunkUploadInitRequest,
  ChunkUploadInitResponseData,
  ChunkUploadResponseData,
  ChunkMergeResponseData,
} from '../types';

// 用户认证相关API
export const authApi = {
  // 登录
  login: (data: LoginRequest) => {
    return request.post<APIResponse<LoginResponseData>>('/auth/login', data);
  },

  // 注册
  register: (data: RegisterRequest) => {
    return request.post<APIResponse<RegisterResponseData>>('/auth/register', data);
  },
};

// Token管理相关API
export const tokenApi = {
  // 获取Token列表
  getTokenList: () => {
    return request.get<APIResponse<TokenListResponseData>>('/tokens');
  },

  // 创建Token
  createToken: (data: TokenCreateRequest) => {
    return request.post<APIResponse<TokenCreateResponseData>>('/tokens', data);
  },

  // 删除Token
  deleteToken: (tokenId: number) => {
    return request.delete<APIResponse<TokenDeleteResponseData>>(`/tokens/${tokenId}`);
  },
};

// 图片管理相关API
export const imageApi = {
  // 获取图片列表
  getImageList: (params?: ImageListRequest) => {
    return request.get<APIResponse<Image[]>>('/images', { params });
  },

  // 上传图片（支持批量上传）
  upload: (files: File[], nicnames?: string[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    // 如果提供了nicnames，则添加整个nicnames列表
    if (nicnames) {
      nicnames.forEach((nicname) => {
        formData.append('nicnames', nicname);
      });
    }
    return request.post<APIResponse<ImageUploadResponseData>>('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 延长到120秒，适应大文件上传
    });
  },

  // 初始化分片上传
  initChunkUpload: (data: ChunkUploadInitRequest) => {
    return request.post<APIResponse<ChunkUploadInitResponseData>>('/images/chunk/init', data);
  },

  // 上传分片
  uploadChunk: (data: FormData) => {
    return request.post<APIResponse<ChunkUploadResponseData>>('/images/chunk/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 延长到60秒，适应分片上传
    });
  },

  // 合并分片
  mergeChunks: (uploadId: string) => {
    return request.post<APIResponse<ChunkMergeResponseData>>(`/images/chunk/merge/${uploadId}`, {}, {
      timeout: 180000, // 延长到180秒，适应大文件合并
    });
  },

  // 删除单张图片
  deleteImage: (imageId: number) => {
    return request.delete<APIResponse<ImageDeleteResponseData>>(`/images/${imageId}`);
  },

  // 批量删除图片
  batchDeleteImages: (data: ImageBatchDeleteRequest) => {
    return request.post<APIResponse<ImageBatchDeleteResponseData>>('/images/batch-delete', data);
  },
};

// 健康检查相关API
export const healthApi = {
  // 检查服务健康状态
  checkHealth: () => {
    return request.get<HealthCheckResponse>('/health');
  },
};
