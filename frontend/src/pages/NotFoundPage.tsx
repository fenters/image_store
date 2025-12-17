import React, { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: FC = () => {
  const navigate = useNavigate();
  const [xAxis, setXAxis] = useState<number>(0);
  const [yAxis, setYAxis] = useState<number>(0);

  // 鼠标移动效果
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const pageX = window.innerWidth;
      const pageY = window.innerHeight;
      const mouseY = event.pageY;
      const mouseX = event.pageX;

      // 垂直轴
      const newYAxis = (pageY / 2 - mouseY) / pageY * 300;
      // 水平轴
      const newMouseX = mouseX / -pageX;
      const newXAxis = -newMouseX * 100 - 100;

      setXAxis(newXAxis);
      setYAxis(newYAxis);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.ghost}>
          <div style={styles.symbol}></div>
          <div style={styles.symbol}></div>
          <div style={styles.symbol}></div>
          <div style={styles.symbol}></div>
          <div style={styles.symbol}></div>
          <div style={styles.symbol}></div>

          <div style={styles.ghostContainer}>
            <div style={{ ...styles.ghostEyes, transform: `translate(${xAxis}%,-${yAxis}%)` }}>
              <div style={styles.eyeLeft}></div>
              <div style={styles.eyeRight}></div>
            </div>
            <div style={styles.ghostBottom}>
              <div style={styles.ghostBottomItem}></div>
              <div style={styles.ghostBottomItem}></div>
              <div style={styles.ghostBottomItem}></div>
              <div style={styles.ghostBottomItem}></div>
              <div style={styles.ghostBottomItem}></div>
            </div>
          </div>
          <div style={styles.ghostShadow}></div>
        </div>

        <div style={styles.description}>
          <div style={styles.descriptionContainer}>
            <div style={styles.descriptionTitle}>404错误！</div>
            <div style={styles.descriptionText}>看来我们找不到你要找的那一页</div>
          </div>

          <button 
            style={styles.button} 
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

// 样式定义
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#28254C',
    fontFamily: 'Ubuntu',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
  box: {
    width: '350px',
    height: '100%',
    maxHeight: '600px',
    minHeight: '450px',
    background: '#332F63',
    borderRadius: '20px',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '30px 50px',
  },
  ghost: {
    padding: '15px 25px 25px',
    position: 'absolute',
    left: '50%',
    top: '30%',
    transform: 'translate(-50%, -30%)',
  },
  symbol: {
    position: 'relative',
    opacity: 0.2,
    animation: 'shine 4s ease-in-out infinite',
  },
  ghostContainer: {
    background: '#fff',
    width: '100px',
    height: '100px',
    borderRadius: '100px 100px 0 0',
    position: 'relative',
    margin: '0 auto',
    animation: 'upndown 3s ease-in-out infinite',
  },
  ghostEyes: {
    position: 'absolute',
    left: '50%',
    top: '45%',
    height: '12px',
    width: '70px',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.1s ease',
  },
  eyeLeft: {
    width: '12px',
    height: '12px',
    background: '#332F63',
    borderRadius: '50%',
    margin: '0 10px',
    position: 'absolute',
    left: 0,
  },
  eyeRight: {
    width: '12px',
    height: '12px',
    background: '#332F63',
    borderRadius: '50%',
    margin: '0 10px',
    position: 'absolute',
    right: 0,
  },
  ghostBottom: {
    display: 'flex',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
  },
  ghostBottomItem: {
    flexGrow: 1,
    position: 'relative',
    top: '-10px',
    height: '20px',
    borderRadius: '100%',
    backgroundColor: '#fff',
  },
  ghostShadow: {
    height: '20px',
    boxShadow: '0 50px 15px 5px #3B3769',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'smallnbig 3s ease-in-out infinite',
  },
  description: {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  descriptionContainer: {
    color: '#fff',
    textAlign: 'center',
    width: '200px',
    fontSize: '16px',
    margin: '0 auto',
  },
  descriptionTitle: {
    fontSize: '24px',
    letterSpacing: '0.5px',
  },
  descriptionText: {
    color: '#8C8AA7',
    lineHeight: '20px',
    marginTop: '20px',
  },
  button: {
    display: 'block',
    position: 'relative',
    background: '#FF5E65',
    border: '1px solid transparent',
    borderRadius: '50px',
    height: '50px',
    textAlign: 'center',
    textDecoration: 'none',
    color: '#fff',
    lineHeight: '50px',
    fontSize: '18px',
    padding: '0 70px',
    whiteSpace: 'nowrap',
    marginTop: '25px',
    transition: 'background 0.5s ease',
    overflow: 'hidden',
    cursor: 'pointer',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export default NotFoundPage;