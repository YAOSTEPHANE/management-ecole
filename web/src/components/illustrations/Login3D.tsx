import React, { useEffect, useRef } from 'react';
import { stable01 } from '@/utils/stableRandom';

const Login3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Fond dégradé animé avec profondeur - version claire */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 via-purple-50/50 to-pink-50/50"
        style={{
          transform: `translateZ(-200px) scale(1.2)`,
          animation: 'gradientShift 15s ease infinite',
        }}
      />

      {/* Grille 3D en arrière-plan - version claire */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translateZ(-150px) rotateX(60deg)`,
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Cube 3D principal flottant */}
      <div
        className="absolute top-20 right-20 w-40 h-40"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'cubeRotate 25s linear infinite',
          transform: `translateZ(0px) rotateX(${mouseRef.current.y * 20}deg) rotateY(${mouseRef.current.x * 20}deg)`,
        }}
      >
        {/* Face avant */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-400/40 backdrop-blur-sm"
          style={{ 
            transform: 'translateZ(40px)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
          }} 
        />
        {/* Face arrière */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-400/40 backdrop-blur-sm"
          style={{ 
            transform: 'translateZ(-40px) rotateY(180deg)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
          }} 
        />
        {/* Face droite */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/40 backdrop-blur-sm"
          style={{ 
            transform: 'rotateY(90deg) translateZ(40px)',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
          }} 
        />
        {/* Face gauche */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400/40 backdrop-blur-sm"
          style={{ 
            transform: 'rotateY(-90deg) translateZ(40px)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)',
          }} 
        />
        {/* Face supérieure */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border-2 border-blue-400/40 backdrop-blur-sm"
          style={{ 
            transform: 'rotateX(90deg) translateZ(40px)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
          }} 
        />
        {/* Face inférieure */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-400/40 backdrop-blur-sm"
          style={{ 
            transform: 'rotateX(-90deg) translateZ(40px)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
          }} 
        />
      </div>

      {/* Sphère 3D avec effet de profondeur */}
      <div
        className="absolute bottom-32 left-16 w-32 h-32"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.3), rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))',
          borderRadius: '50%',
          boxShadow: `
            0 0 40px rgba(96, 165, 250, 0.2),
            inset -20px -20px 40px rgba(0, 0, 0, 0.1),
            inset 20px 20px 40px rgba(255, 255, 255, 0.5)
          `,
          animation: 'sphereFloat 10s ease-in-out infinite',
          transform: 'translateZ(50px)',
        }}
      />

      {/* Pyramide 3D */}
      <div
        className="absolute top-1/2 right-1/4"
        style={{
          width: '0',
          height: '0',
          borderLeft: '50px solid transparent',
          borderRight: '50px solid transparent',
          borderBottom: '80px solid rgba(167, 139, 250, 0.25)',
          filter: 'drop-shadow(0 10px 20px rgba(167, 139, 250, 0.15))',
          animation: 'pyramidRotate 18s linear infinite',
          transformOrigin: 'center bottom',
          transform: 'translateZ(30px)',
        }}
      />

      {/* Anneau 3D rotatif */}
      <div
        className="absolute top-1/3 left-1/3 w-48 h-48"
        style={{
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
          borderTopColor: 'rgba(139, 92, 246, 0.4)',
          borderRightColor: 'rgba(236, 72, 153, 0.4)',
          animation: 'ringRotate 12s linear infinite',
          transform: 'translateZ(20px) rotateX(60deg)',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)',
        }}
      />

      {/* Lignes de connexion 3D */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        style={{ opacity: 0.08, transform: 'translateZ(-100px)' }}
      >
        <defs>
          <linearGradient id="lineGradient3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M 100 200 Q 200 100, 300 200 T 500 200"
          stroke="url(#lineGradient3D)"
          strokeWidth="3"
          fill="none"
          style={{
            strokeDasharray: '15, 8',
            animation: 'dashMove3D 4s linear infinite',
            filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))',
          }}
        />
        <path
          d="M 50 300 Q 150 200, 250 300 T 450 300"
          stroke="url(#lineGradient3D)"
          strokeWidth="3"
          fill="none"
          style={{
            strokeDasharray: '15, 8',
            animation: 'dashMove3D 5s linear infinite',
            animationDelay: '1s',
            filter: 'drop-shadow(0 0 5px rgba(139, 92, 246, 0.5))',
          }}
        />
        <path
          d="M 150 100 Q 250 50, 350 100 T 550 100"
          stroke="url(#lineGradient3D)"
          strokeWidth="3"
          fill="none"
          style={{
            strokeDasharray: '15, 8',
            animation: 'dashMove3D 6s linear infinite',
            animationDelay: '2s',
            filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.5))',
          }}
        />
      </svg>

      {[...Array(25)].map((_, i) => {
        const dur = Number((3 + stable01(i * 2.71 + 10) * 3).toFixed(2));
        const delay = Number((stable01(i * 4.19 + 11) * 3).toFixed(2));
        const tz = Number((stable01(i * 6.02 + 12) * 100).toFixed(2));
        return (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(${59 + i * 8}, ${130 + i * 5}, ${246 - i * 3}, 0.4), transparent)`,
              left: `${Number((15 + i * 3.5).toFixed(2))}%`,
              top: `${Number((20 + i * 2.5).toFixed(2))}%`,
              animation: `particleFloat ${dur}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              boxShadow: `0 0 15px rgba(${59 + i * 8}, ${130 + i * 5}, 246, 0.3)`,
              transform: `translateZ(${tz}px)`,
            }}
          />
        );
      })}

      {/* Vagues 3D */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64"
        style={{
          background: 'linear-gradient(to top, rgba(59, 130, 246, 0.1), transparent)',
          clipPath: 'polygon(0 100%, 100% 100%, 100% 60%, 0 80%)',
          animation: 'waveMove 8s ease-in-out infinite',
          transform: 'translateZ(-50px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(to top, rgba(139, 92, 246, 0.08), transparent)',
          clipPath: 'polygon(0 100%, 100% 100%, 100% 70%, 0 85%)',
          animation: 'waveMove 10s ease-in-out infinite reverse',
          transform: 'translateZ(-30px)',
        }}
      />

      <style>{`
        @keyframes cubeRotate {
          0% {
            transform: translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          25% {
            transform: translateZ(20px) rotateX(90deg) rotateY(90deg) rotateZ(0deg);
          }
          50% {
            transform: translateZ(0px) rotateX(180deg) rotateY(180deg) rotateZ(0deg);
          }
          75% {
            transform: translateZ(20px) rotateX(270deg) rotateY(270deg) rotateZ(0deg);
          }
          100% {
            transform: translateZ(0px) rotateX(360deg) rotateY(360deg) rotateZ(0deg);
          }
        }
        
        @keyframes sphereFloat {
          0%, 100% {
            transform: translateZ(50px) translateY(0px) translateX(0px) scale(1);
          }
          25% {
            transform: translateZ(70px) translateY(-40px) translateX(30px) scale(1.15);
          }
          50% {
            transform: translateZ(50px) translateY(-20px) translateX(0px) scale(1);
          }
          75% {
            transform: translateZ(70px) translateY(-40px) translateX(-30px) scale(1.15);
          }
        }
        
        @keyframes pyramidRotate {
          0% {
            transform: translateZ(30px) rotateZ(0deg) rotateY(0deg);
          }
          50% {
            transform: translateZ(50px) rotateZ(180deg) rotateY(180deg);
          }
          100% {
            transform: translateZ(30px) rotateZ(360deg) rotateY(360deg);
          }
        }
        
        @keyframes ringRotate {
          0% {
            transform: translateZ(20px) rotateX(60deg) rotateZ(0deg);
          }
          100% {
            transform: translateZ(20px) rotateX(60deg) rotateZ(360deg);
          }
        }
        
        @keyframes dashMove3D {
          0% {
            stroke-dashoffset: 0;
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 40;
            opacity: 0.8;
          }
        }
        
        @keyframes particleFloat {
          0%, 100% {
            opacity: 0.4;
            transform: translateZ(0px) scale(0.8) translateY(0px);
          }
          50% {
            opacity: 1;
            transform: translateZ(50px) scale(1.3) translateY(-30px);
          }
        }
        
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes gridMove {
          0% {
            transform: translateZ(-150px) rotateX(60deg) translateY(0px);
          }
          100% {
            transform: translateZ(-150px) rotateX(60deg) translateY(50px);
          }
        }
        
        @keyframes waveMove {
          0%, 100% {
            clip-path: polygon(0 100%, 100% 100%, 100% 60%, 0 80%);
          }
          50% {
            clip-path: polygon(0 100%, 100% 100%, 100% 70%, 0 75%);
          }
        }
      `}</style>
    </div>
  );
};

export default Login3D;
