import React from 'react';
import { stable01 } from '@/utils/stableRandom';

/** Illustration décorative — préférer un import `next/dynamic` avec `ssr: false` depuis la page d’accueil pour éviter les erreurs d’hydratation. */
const Hero3D = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Illustration 3D principale */}
      <div className="relative transform-gpu perspective-1000">
        {/* École 3D */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full max-w-md transform-gpu"
          style={{
            filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.2))',
            animation: 'float3d 6s ease-in-out infinite',
          }}
        >
          <defs>
            <linearGradient id="schoolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Ombre */}
          <ellipse cx="200" cy="380" rx="120" ry="20" fill="rgba(0, 0, 0, 0.2)" />

          {/* Bâtiment principal */}
          <g transform="translate(50, 100)">
            {/* Face avant */}
            <polygon
              points="150,200 250,200 250,300 150,300"
              fill="url(#schoolGradient)"
              style={{ transform: 'translateZ(0px)' }}
            />
            
            {/* Toit */}
            <polygon
              points="150,200 200,150 250,200"
              fill="url(#roofGradient)"
              style={{ transform: 'translateZ(20px)' }}
            />
            
            {/* Porte */}
            <rect x="180" y="250" width="40" height="50" fill="#1E40AF" rx="2" />
            <circle cx="210" cy="275" r="3" fill="#FBBF24" />
            
            {/* Fenêtres */}
            <rect x="165" y="220" width="25" height="25" fill="#60A5FA" rx="2" />
            <rect x="210" y="220" width="25" height="25" fill="#60A5FA" rx="2" />
            
            {/* Lignes de fenêtres */}
            <line x1="177.5" y1="220" x2="177.5" y2="245" stroke="#1E40AF" strokeWidth="2" />
            <line x1="165" y1="232.5" x2="190" y2="232.5" stroke="#1E40AF" strokeWidth="2" />
            <line x1="222.5" y1="220" x2="222.5" y2="245" stroke="#1E40AF" strokeWidth="2" />
            <line x1="210" y1="232.5" x2="235" y2="232.5" stroke="#1E40AF" strokeWidth="2" />
          </g>

          {/* Élèves animés */}
          <g className="animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
            <circle cx="100" cy="320" r="15" fill="#10B981" />
            <rect x="90" y="335" width="20" height="30" fill="#3B82F6" rx="2" />
            <circle cx="300" cy="320" r="15" fill="#F59E0B" />
            <rect x="290" y="335" width="20" height="30" fill="#8B5CF6" rx="2" />
          </g>

          {/* Nuages flottants */}
          <g className="animate-pulse" style={{ animationDuration: '4s' }}>
            <ellipse cx="80" cy="80" rx="30" ry="20" fill="rgba(255, 255, 255, 0.8)" />
            <ellipse cx="320" cy="60" rx="40" ry="25" fill="rgba(255, 255, 255, 0.7)" />
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const leftPct = Number((stable01(i * 7.13) * 100).toFixed(2));
          const topPct = Number((stable01(i * 11.37 + 1) * 100).toFixed(2));
          const duration = Number((3 + stable01(i * 3.91 + 2) * 2).toFixed(2));
          const delay = Number((stable01(i * 5.17 + 3) * 2).toFixed(2));
          return (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                animation: `float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes float3d {
          0%, 100% {
            transform: translateY(0px) rotateY(0deg);
          }
          50% {
            transform: translateY(-20px) rotateY(5deg);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(10px);
            opacity: 0.6;
          }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default Hero3D;






