import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import Providers from './components/Providers';
import './index.css';

// 应用入口组件
const App: React.FC = () => {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;