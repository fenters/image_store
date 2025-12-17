import React, { useState, useEffect } from 'react';
import { tokenApi } from '../api';
import { Token, TokenCreateRequest } from '../types';
import { Layout, Button, Table, Modal, Form, Input, Spin, Empty, message, Typography, Card, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import '../styles/MainPage.css';
import '../styles/LinkTokenPage.css';
import Header from '../components/Header';

const { Content } = Layout;
const { Title, Text } = Typography;

const LinkTokenPage: React.FC = () => {
  const [linkTokens, setLinkTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [createdToken, setCreatedToken] = useState<string>('');
  const [createdTokenName, setCreatedTokenName] = useState<string>('');
  const [newToken, setNewToken] = useState<TokenCreateRequest>({
    name: '',
  });
  // 多选框状态管理
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  // 更新选择状态
  const updateSelectionStatus = (selectedKeys: React.Key[]) => {
    setSelectedKeys(selectedKeys);
    setIsAllSelected(selectedKeys.length === linkTokens.length && linkTokens.length > 0);
    setIndeterminate(selectedKeys.length > 0 && selectedKeys.length < linkTokens.length);
  };

  // 全选/取消全选
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const newSelectedKeys = checked ? linkTokens.map(token => token.id) : [];
    updateSelectionStatus(newSelectedKeys);
  };

  // 单个选择
  const handleSelect = (id: React.Key) => {
    const newSelectedKeys = selectedKeys.includes(id)
      ? selectedKeys.filter(key => key !== id)
      : [...selectedKeys, id];
    updateSelectionStatus(newSelectedKeys);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedKeys.length === 0) {
      message.warning('请先选择要删除的LinkToken');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的${selectedKeys.length}个LinkToken吗？`,
      onOk: async () => {
        try {
          setIsLoading(true);
          // 逐个删除选中的LinkToken
          for (const id of selectedKeys) {
            await tokenApi.deleteToken(id as number);
          }
          // 更新列表
          setLinkTokens(prev => prev.filter(token => !selectedKeys.includes(token.id)));
          // 清空选择
          updateSelectionStatus([]);
          message.success('批量删除成功！');
        } catch (error) {
          console.error('批量删除LinkToken失败:', error);
          message.error('批量删除失败，请重试');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // 获取LinkToken列表
  const fetchLinkTokens = async () => {
    try {
      setIsLoading(true);
      const response = await tokenApi.getTokenList();
      if (response.data.code === 0) {
        setLinkTokens(response.data.data.tokens);
      }
    } catch (error) {
      console.error('获取LinkToken列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkTokens();
  }, []);

  // 创建LinkToken
  const handleCreateToken = async () => {
    try {
      setIsLoading(true);
      const response = await tokenApi.createToken(newToken);
      if (response.data.code === 0) {
        // 仅在创建时获取并显示token
        const { token, name } = response.data.data;
        setCreatedToken(token);
        setCreatedTokenName(name);
        setShowCreateModal(false);
        setShowTokenModal(true);
        
        // 重置表单
        setNewToken({name: ''});
        
        // 刷新列表（此时列表中不包含token值）
        fetchLinkTokens();
      } else {
        message.error('创建失败：' + response.data.message);
      }
    } catch (error) {
      console.error('创建LinkToken失败:', error);
      message.error('创建失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除LinkToken
  const handleDeleteToken = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个LinkToken吗？',
      onOk: async () => {
        try {
          setIsLoading(true);
          const response = await tokenApi.deleteToken(id);
          if (response.data.code === 0) {
            setLinkTokens(prev => prev.filter(token => token.id !== id));
            message.success('删除成功！');
          } else {
            message.error('删除失败：' + response.data.message);
          }
        } catch (error) {
          console.error('删除LinkToken失败:', error);
          message.error('删除失败，请重试');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };



  return (
    <Layout className="page-layout">
      {/* 导航栏 */}
      <Header />

      <Content className="main-content">
        <div className="page-content">
          <Title level={4} className="page-title">LinkToken管理</Title>
          
          <div className="button-group">
            <Button
              type="primary"
              onClick={() => setShowCreateModal(true)}
              className="create-btn"
              icon={<PlusOutlined />}
            >
              创建LinkToken
            </Button>

            {/* 批量删除按钮 */}
            <Button
              type="primary"
              danger
              onClick={handleBatchDelete}
              className="batch-delete-btn"
              icon={<DeleteOutlined />}
              disabled={selectedKeys.length === 0}
            >
              批量删除 ({selectedKeys.length})
            </Button>
          </div>

          {/* LinkToken列表 */}
          {isLoading ? (
            <div className="loading-container">
              <Spin />
              <span className="loading-text">加载中...</span>
            </div>
          ) : linkTokens.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无LinkToken，创建一个试试吧！
                </span>
              }
            />
          ) : (
            <Card className="token-list-card">
              <Table
                columns={[
                  {
                    title: (
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = indeterminate;
                          }
                        }}
                      />
                    ),
                    dataIndex: '',
                    key: 'checkbox',
                    width: 80,
                    align: 'center',
                    render: (_: any, record: Token) => (
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={selectedKeys.includes(record.id)}
                        onChange={() => handleSelect(record.id)}
                      />
                    )
                  },

                  {
                    title: '名称',
                    dataIndex: 'name',
                    key: 'name'
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (created_at: string) => new Date(created_at).toLocaleString()
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 150,
                    align: 'center',
                    render: (_: any, record: Token) => (
                      <Space size="small">
                        <Button
                          type="text"
                          danger
                          className="action-btn"
                          onClick={() => handleDeleteToken(record.id)}
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Space>
                    )
                  }
                ]}
                dataSource={linkTokens}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* 创建LinkToken模态框 */}
          <Modal
            title="创建LinkToken"
            open={showCreateModal}
            onCancel={() => setShowCreateModal(false)}
            footer={null}
            width={600}
          >
            <Form
              layout="vertical"
              onFinish={handleCreateToken}
              initialValues={newToken}
            >
              <div className="modal-body">
                <Form.Item
                  name="name"
                  label="名称"
                  rules={[{ required: true, message: '请输入LinkToken名称！' }]}
                >
                  <Input
                    placeholder="请输入LinkToken名称"
                    onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Form.Item>
              </div>
            
              <div className="modal-footer">
                <Button
                  type="default"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {isLoading ? '创建中...' : '创建'}
                </Button>
              </div>
            </Form>
          </Modal>
        
            {/* 显示创建的Token模态框 */}
          <Modal
            title="Token创建成功"
            open={showTokenModal}
            onCancel={() => setShowTokenModal(false)}
            footer={null}
            width={600}
          >
            <div className="modal-body">
              <Text className="token-info">
                <strong>{createdTokenName}</strong> 的Token已成功创建，请复制以下Token并妥善保存。
                <Text type="danger" className="token-warning">此Token仅显示一次，请勿刷新页面或关闭此弹窗。</Text>
              </Text>
              
              <div className="token-display-container">
                <div className="token-display">
                  {createdToken}
                </div>
                <Button
                  type="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken)
                      .then(() => message.success('复制成功！'))
                      .catch(() => message.error('复制失败，请手动复制！'));
                  }}
                >
                  复制Token
                </Button>
              </div>
              
              <div className="token-tips">
                <Text strong>重要提示：</Text>
                <ul>
                  <li>Token是您访问API的重要凭证，请妥善保管</li>
                  <li>不要将Token分享给他人，避免造成安全风险</li>
                  <li>如果Token泄露，请立即删除并重新创建</li>
                </ul>
              </div>
            </div>
          
            <div className="modal-footer">
              <Button
                type="primary"
                onClick={() => setShowTokenModal(false)}
              >
                我已复制，关闭
              </Button>
            </div>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default LinkTokenPage;