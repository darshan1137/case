'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Hero3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    // 3D City Grid Animation
    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw 3D grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      
      const gridSize = 50;
      const perspective = 400;
      const centerX = width / 2;
      const centerY = height * 0.6;
      
      // Horizontal grid lines
      for (let i = -10; i <= 10; i++) {
        const y = i * gridSize;
        const z = Math.sin(time * 0.001 + i * 0.3) * 20;
        
        const scale = perspective / (perspective + z);
        const x1 = centerX - (width / 2) * scale;
        const x2 = centerX + (width / 2) * scale;
        const y1 = centerY + y * scale;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = -10; i <= 10; i++) {
        const x = i * gridSize;
        
        ctx.beginPath();
        for (let j = -10; j <= 10; j++) {
          const y = j * gridSize;
          const z = Math.sin(time * 0.001 + j * 0.3) * 20;
          const scale = perspective / (perspective + z);
          
          const px = centerX + x * scale;
          const py = centerY + y * scale;
          
          if (j === -10) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
      
      // Draw floating nodes (representing departments)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
      
      for (let i = 0; i < 8; i++) {
        const angle = (time * 0.0005 + i * Math.PI / 4);
        const radius = 150 + Math.sin(time * 0.001 + i) * 30;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY - 100 + Math.sin(angle) * radius * 0.5;
        const size = 6 + Math.sin(time * 0.002 + i) * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      time += 16;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default Hero3D;
