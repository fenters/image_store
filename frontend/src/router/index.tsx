import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// 路由级别的代码分割
const router = createBrowserRouter([
  // 公共路由
  {
    path: '/login',
    lazy: () => import('../pages/LoginPage').then(module => ({ element: <module.default /> })),
  },
  {
    path: '/register',
    lazy: () => import('../pages/RegisterPage').then(module => ({ element: <module.default /> })),
  },
  
  // 受保护路由
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        lazy: () => import('../pages/MainPage').then(module => ({ element: <module.default /> })),
      },
      {
        path: 'tokens',
        lazy: () => import('../pages/LinkTokenPage').then(module => ({ element: <module.default /> })),
      },
      {
        path: 'api-documentation',
        lazy: () => import('../pages/ApiDocumentation').then(module => ({ element: <module.default /> })),
      },
    ],
  },
  
  // 404页面 - 匹配所有未匹配的路径
  {
    path: '*',
    lazy: () => import('../pages/NotFoundPage').then(module => ({ element: <module.default /> })),
  },
]);

export default router;