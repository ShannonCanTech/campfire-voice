import React from 'react';

type SkeletonLoaderProps = {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
      default:
        return 'rounded-lg';
    }
  };

  const getStyles = () => {
    const styles: React.CSSProperties = {};
    if (width) styles.width = typeof width === 'number' ? `${width}px` : width;
    if (height) styles.height = typeof height === 'number' ? `${height}px` : height;
    return styles;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={getStyles()}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={getStyles()}
    />
  );
};

// Pre-built skeleton components for common use cases
export const ChatRoomSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div className="flex items-start justify-between mb-3">
      <SkeletonLoader variant="text" width="60%" height={20} />
      <SkeletonLoader variant="rectangular" width={60} height={20} />
    </div>
    <SkeletonLoader variant="text" lines={2} className="mb-4" />
    <div className="flex items-center justify-between mb-4">
      <div className="flex space-x-4">
        <SkeletonLoader variant="text" width={80} height={16} />
        <SkeletonLoader variant="text" width={60} height={16} />
      </div>
    </div>
    <div className="flex space-x-2 mb-4">
      <SkeletonLoader variant="rectangular" width={60} height={24} />
      <SkeletonLoader variant="rectangular" width={80} height={24} />
      <SkeletonLoader variant="rectangular" width={70} height={24} />
    </div>
    <SkeletonLoader variant="rectangular" width="100%" height={40} />
  </div>
);

export const MessageSkeleton: React.FC = () => (
  <div className="flex space-x-2">
    <SkeletonLoader variant="circular" width={32} height={32} />
    <div className="flex-1">
      <SkeletonLoader variant="text" width="30%" height={14} className="mb-1" />
      <SkeletonLoader variant="rectangular" width="80%" height={36} />
    </div>
  </div>
);

export const InterestTagSkeleton: React.FC = () => (
  <div className="p-4 rounded-lg border-2 border-gray-200">
    <SkeletonLoader variant="text" width="70%" height={18} className="mb-2" />
    <SkeletonLoader variant="text" lines={2} height={14} />
  </div>
);
