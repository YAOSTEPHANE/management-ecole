import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  /** `premium` : verre dépoli, bordure lumineuse, ombre douce */
  variant?: 'default' | 'premium';
  onClick?: () => void;
  style?: React.CSSProperties;
  id?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  variant = 'default',
  onClick,
  style,
  id,
}) => {
  const base =
    variant === 'premium'
      ? 'premium-card-surface p-6 sm:p-8'
      : 'bg-white rounded-xl shadow-lg p-6';

  const motion =
    hover && variant === 'premium'
      ? 'transition-all duration-300 hover:shadow-premium hover:-translate-y-0.5 hover:border-white'
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






