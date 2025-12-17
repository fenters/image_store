import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LinkOutlined, LogoutOutlined, FileTextOutlined } from '@ant-design/icons';
import '../styles/Header.css';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <AntHeader className="header">
      <div className="header-left">
        <Title level={3} className="header-title">
          我的图床
        </Title>
      </div>
      
      <div className="header-right">
        {user && (
          <Text className="header-welcome">
            欢迎，{user.username}
          </Text>
        )}
        
        <Link to="/">
          <Button
            type="link"
            className="header-link header-link-home"
          >
            首页
          </Button>
        </Link>
        
        <Link to="/tokens">
          <Button
            type="link"
            icon={<LinkOutlined />}
            className="header-link header-link-tokens"
          >
            LinkToken管理
          </Button>
        </Link>
        
        <Link to="/api-documentation">
          <Button
            type="link"
            icon={<FileTextOutlined />}
            className="header-link header-link-api"
          >
            API文档
          </Button>
        </Link>
        
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={logout}
          className="header-logout"
        >
          退出登录
        </Button>
      </div>
    </AntHeader>
  );
};

export default Header;