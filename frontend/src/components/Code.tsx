import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './Code.css';

interface CodeProps {
  children: string;
  language?: string;
  showLineNumbers?: boolean;
}

const Code: React.FC<CodeProps> = ({ 
  children, 
  language = 'javascript',
  showLineNumbers = true 
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current as HTMLElement);
    }
  }, [children, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      message.success('复制成功');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 确保children是字符串类型
  const codeContent = typeof children === 'string' ? children : React.Children.toArray(children).join('');
  
  return (
    <div className="code-container">
      <div className="code-header">
        <span className="language-tag">{language}</span>
        <button 
          className="copy-button"
          onClick={handleCopy}
          aria-label="复制代码"
        >
          {copied ? <CheckOutlined /> : <CopyOutlined />}
        </button>
      </div>
      <div className="code-content">
        {showLineNumbers && (
          <div className="line-numbers">
            {codeContent.split('\n').map((_, index) => (
              <div key={index} className="line-number">{index + 1}</div>
            ))}
          </div>
        )}
        <pre className="code-pre">
          <code 
            ref={codeRef} 
            className={`language-${language}`}
          >
            {codeContent}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default Code;
