import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api', // API基础路径
  timeout: 10000, // 恢复全局默认超时时间为10秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 处理网络错误和其他错误
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      console.error(`API Error: ${status} - ${data.message || 'Unknown error'}`);
      
      // 只有当用户已经登录但令牌过期时才重定向到登录页
      // 登录请求的401错误应该返回给调用者，显示错误提示
      const accessToken = localStorage.getItem('access_token');
      const isLoginRequest = error.config.url?.includes('/auth/login');
      
      if (status === 401 && accessToken && !isLoginRequest) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('API Error: No response received from server');
    } else {
      // 请求配置错误
      console.error(`API Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default request;