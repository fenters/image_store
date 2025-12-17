// 统一响应格式
export interface APIResponse<T = any> {
  code: number;
  message: string;
  data: T;
  pagination?: Pagination;
}

// 分页信息
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// 用户类型
export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应类型
export interface LoginResponseData {
  user: User;
  access_token: string;
  token_type: string;
}

// 注册请求类型
export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

// 注册响应类型
export interface RegisterResponseData {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

// Token类型
export interface Token {
  id: number;
  name: string;
  created_at: string;
}

// Token创建请求类型
export interface TokenCreateRequest {
  name: string;
}

// Token创建响应类型
export interface TokenCreateResponseData {
  id: number;
  name: string;
  created_at: string;
  token: string; // 仅创建时返回完整Token
}

// Token列表响应类型
export interface TokenListResponseData {
  tokens: Token[];
  total: number;
}

// Token删除响应类型
export interface TokenDeleteResponseData {
  id: number;
}

// 图片类型
export interface Image {
  id: number;
  filename: string;
  nicname: string;
  url: string;
  markdown: string;
  html: string;
  gitee_url?: string;
  created_at: string;
}

// 图片列表请求参数类型
export interface ImageListRequest {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  name_like?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

// 图片上传响应类型
export interface ImageUploadResponseData {
  uploaded: number;
  failed: number;
  images: Image[];
}

// 图片删除响应类型
export interface ImageDeleteResponseData {
  id: number;
}

// 图片批量删除请求类型
export interface ImageBatchDeleteRequest {
  image_ids: number[];
}

// 图片批量删除响应类型
export interface ImageBatchDeleteResponseData {
  deleted: number;
  failed: number;
}

// 切片上传初始化请求类型
export interface ChunkUploadInitRequest {
  filename: string;
  file_size: number;
  total_chunks: number;
  nicname?: string;
}

// 切片上传初始化响应类型
export interface ChunkUploadInitResponseData {
  upload_id: string;
  filename: string;
  file_size: number;
  total_chunks: number;
  chunk_size: number;
}

// 切片上传响应类型
export interface ChunkUploadResponseData {
  upload_id: string;
  chunk_index: number;
  status: string;
}

// 切片合并响应类型
export interface ChunkMergeResponseData {
  images: Image[];
  uploaded_count: number;
}

// 健康检查响应类型
export interface HealthCheckResponse {
  status: string;
  version: string;
}