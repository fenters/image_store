import React from 'react';
import { Layout, Tabs, Card, Typography, Space, Collapse, Divider, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import '../styles/ApiDocumentation.css';
import Header from '../components/Header';
import Code from '../components/Code';

const { Content } = Layout;
const { Text, Paragraph } = Typography;

const ApiDocumentation: React.FC = () => {
  // 定义Tabs的items
  const tabsItems = [
    {
      key: 'upload',
      label: <span><UploadOutlined /> 上传相关</span>,
      children: (
        <Collapse 
          defaultActiveKey={['1']} 
          ghost
          items={[
            {
              key: '1',
              label: '普通上传图片（支持批量）',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="green">POST</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>请求参数:</Text>
                    <Paragraph>
                      <Text code>files</Text> (FormData): 图片文件列表<br />
                      <Text code>nicnames</Text> (FormData, 可选): 图片备注列表，与files顺序对应<br />
                      <Text code>图片大小:单位MB，最大10MB</Text>
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
  {`import requests

# 准备文件
files = [
    ('files', open('file1.png', 'rb')),
    ('files', open('file2.png', 'rb')),
    ('nicnames', '备注1'),
    ('nicnames', '备注2')
]

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
}

# 发送请求
response = requests.post('http://localhost/api/images', headers=headers, files=files)

# 关闭文件
for file_tuple in files:
    if hasattr(file_tuple[1], 'close'):
        file_tuple[1].close()

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
{`{
  "code": 0,
  "message": "上传成功",
  "data": {
    "uploaded": 2,
    "failed": 0,
    "images": [
      {
        "id": 1,
        "filename": "example1.png",
        "nicname": "备注1",
        "path": "static/user1/images/xxx.png",
        "url": "/static/{username}/images/{filename}",
        "markdown": "![example1.png](/static/{username}/images/{filename})",
        "html": "<img src=\"/static/{username}/images/{filename}\" alt=\"example1.png\">",
        "gitee_url": null,
        "created_at": "2023-01-01T00:00:00"
      }
    ]
  }
}`}
                    </Code>
                  </div>
                </Space>
              )
            },
            {
              key: '2',
              label: '初始化分片上传',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images/chunk/init</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="green">POST</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>请求参数:</Text>
                    <Paragraph>
                      <Text code>filename</Text> (string): 文件名<br />
                      <Text code>file_size</Text> (number): 文件大小（字节）<br />
                      <Text code>total_chunks</Text> (number): 总分片数<br />
                      <Text code>nicname</Text> (string, 可选): 图片备注
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
                      {
`import requests

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
}

# 请求体
payload = {
    'filename': 'large_image.png',
    'file_size': 10485760,
    'total_chunks': 10,
    'nicname': '大图片备注'
}

# 发送请求
response = requests.post('http://localhost/api/images/chunk/init', headers=headers, json=payload)

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
{`{"code": 0,
  "message": "切片上传初始化成功",
  "data": {
    "upload_id": "uuid-string",
    "chunk_size": 1048576,
    "total_chunks": 10
  }
}`}
                    </Code>
                  </div>
                </Space>
              )
            },
            {
              key: '3',
              label: '上传分片',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images/chunk/upload</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="green">POST</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>请求参数:</Text>
                    <Paragraph>
                      <Text code>upload_id</Text> (FormData): 上传会话ID<br />
                      <Text code>chunk_index</Text> (FormData): 分片索引（从0开始）<br />
                      <Text code>file</Text> (FormData): 分片文件<br />
                      <Text code>filename</Text> (FormData): 文件名
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
                      {
`import requests

# 准备分片数据
form_data = {
    'upload_id': 'uuid-string',
    'chunk_index': '0',
    'filename': 'large_image.png'
}

# 分片文件
files = {
    'file': open('chunk0.dat', 'rb')
}

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
}

# 发送请求
response = requests.post('http://localhost/api/images/chunk/upload', headers=headers, data=form_data, files=files)

# 关闭文件
files['file'].close()

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
                      {
`{
  "code": 0,
  "message": "切片上传成功",
  "data": {
    "upload_id": "uuid-string",
    "chunk_index": 0,
    "uploaded_chunks": 1,
    "total_chunks": 10,
    "is_completed": false
  }
}`}
                    </Code>
                  </div>
                </Space>
              )
            },
            {
              key: '4',
              label: '合并分片',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images/chunk/merge/{'{'}upload_id{'}'}</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="green">POST</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>路径参数:</Text>
                    <Paragraph>
                      <Text code>upload_id</Text> (string): 上传会话ID
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
                      {
`import requests

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
}

# 发送请求
response = requests.post('http://localhost/api/images/chunk/merge/uuid-string', headers=headers)

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
                      {
`{
  "code": 0,
  "message": "合并成功",
  "data": {
    "uploaded": 1,
    "failed": 0,
    "images": [
      {
        "id": 2,
        "filename": "large_image.png",
        "nicname": "大图片备注",
        "path": "static/user1/images/xxx.png",
        "url": "static/user1/images/xxx.png",
        "markdown": "![large_image.png](static/user1/images/xxx.png)",
        "html": "<img src=\"static/user1/images/xxx.png\" alt=\"large_image.png\">",
        "gitee_url": null,
        "created_at": "2023-01-01T00:00:00"
      }
    ]
  }
}`}
                    </Code>
                  </div>
                </Space>
              )
            }
          ]}
        />
      )
    },
    {
      key: 'get',
      label: <span><EyeOutlined /> 获取图片</span>,
      children: (
        <Collapse 
          defaultActiveKey={['1']} 
          ghost
          items={[
            {
              key: '1',
              label: '获取图片列表',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="blue">GET</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>查询参数:</Text>
                    <Paragraph>
                      <Text code>page</Text> (number, 可选): 页码，默认1<br />
                      <Text code>page_size</Text> (number, 可选): 每页数量，默认8<br />
                      <Text code>name_like</Text> (string, 可选): 文件名或备注模糊查询
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
                      {
`import requests

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
}

# 查询参数
params = {
    'page': 1,
    'page_size': 10,
    'name_like': 'test'
}

# 发送请求
response = requests.get('http://localhost/api/images', headers=headers, params=params)

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
                      {
`{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "filename": "test_image.png",
      "nicname": "测试图片",
      "path": "static/user1/images/xxx.png",
      "url": "static/user1/images/xxx.png",
        "markdown": "![test_image.png](static/user1/images/xxx.png)",
        "html": "<img src=\"static/user1/images/xxx.png\" alt=\"test_image.png\">",
      "gitee_url": null,
      "created_at": "2023-01-01T00:00:00"
    }
  ]
}`}
                    </Code>
                  </div>
                </Space>
              )
            }
          ]}
        />
      )
    },
    {
      key: 'delete',
      label: <span><DeleteOutlined /> 删除图片</span>,
      children: (
        <Collapse 
          defaultActiveKey={['1']} 
          ghost
          items={[
            {
              key: '1',
              label: '删除单张图片',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images/{'{'}image_id{'}'}</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="red">DELETE</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>路径参数:</Text>
                    <Paragraph>
                      <Text code>image_id</Text> (number): 图片ID
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
                      {
`import requests

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
}

# 发送请求
response = requests.delete('http://localhost/api/images/1', headers=headers)

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
                      {
`{
  "code": 0,
  "message": "删除成功",
  "data": {
    "id": 1
  }
}`}
                    </Code>
                  </div>
                </Space>
              )
            },
            {
              key: '2',
              label: '批量删除图片',
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>接口地址:</Text> <Text code>/api/images/batch-delete</Text>
                  </div>
                  <div>
                    <Text strong>请求方法:</Text> <Tag color="red">POST</Tag>
                  </div>
                  <div>
                    <Text strong>认证要求:</Text> 需要在请求头中携带 <Text code>Authorization: Bearer &lt;token&gt;</Text>
                  </div>
                  <div>
                    <Text strong>请求参数:</Text>
                    <Paragraph>
                      <Text code>image_ids</Text> (array): 图片ID数组
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>请求示例:</Text>
                    <Code language="python">
                      {
`import requests

# 请求头
headers = {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
}

# 请求体
payload = {
    'image_ids': [1, 2, 3]
}

# 发送请求
response = requests.post('http://localhost/api/images/batch-delete', headers=headers, json=payload)

print(response.json())`}
                    </Code>
                  </div>
                  <div>
                    <Text strong>响应示例:</Text>
                    <Code language="json">
                      {
`{
  "code": 0,
  "message": "批量删除成功",
  "data": {
    "deleted": 3,
    "failed": 0
  }
}`}
                    </Code>
                  </div>
                </Space>
              )
            }
          ]}
        />
      )
    }
  ];

  return (
    <Layout className="page-layout">
      {/* 导航栏 */}
      <Header />

      <Content className="main-content">
        <Card title="API文档" className="api-documentation-card">
          <Text type="secondary">
            本文档包含图床系统中与图片相关的所有API接口，可供外部系统集成使用。
          </Text>
          
          <Divider />
          
          <Tabs defaultActiveKey="upload" className="api-tabs" items={tabsItems} />
        </Card>
      </Content>
    </Layout>
  );
};

export default ApiDocumentation;