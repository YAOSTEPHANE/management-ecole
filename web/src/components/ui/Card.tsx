import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  /** `premium` : verre dépoli · `luxe` : pierre + or tamisé (défaut) · `default` : blanc classique */
  variant?: 'default' | 'premium' | 'luxe';
  onClick?: () => void;
  style?: React.CSSProperties;
  id?: string;
}

/** Si aucune classe de padding explicite, on conserve le confort d’avant (p-6) sans conflit Tailwind */
function hasExplicitPadding(className: string): boolean {
  return /(?:^|\s)!?p(?:x|y|t|b|l|r)?-/.test(className);
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  variant = 'luxe',
  onClick,
  style,
  id,
}) => {
  const luxePad = !hasExplicitPadding(className) ? 'p-6' : '';
  const base =
    variant === 'premium'
      ? 'premium-card-surface p-6 sm:p-8'
      : variant === 'luxe'
        ? `lux-card-surface ${luxePad}`.trim()
        : 'bg-white rounded-xl shadow-lg p-6';

  const motion =
    hover && variant === 'premium'
      ? 'transition-all duration-300 hover:shadow-premium hover:-translate-y-0.5 hover:border-white'
      : hover && variant === 'luxe'
        ? 'transition-all duration-500 hover:shadow-lux-soft hover:-translate-y-0.5'
        : hover
          ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1'
          : '';

  return (
    <div
      id={id}
      style={style}
      className={`${base} ${motion} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;






