import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressDisplayProps {
  value: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ value, size = 'md', className }) => {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-gray-200',
        heightClasses[size],
        className
      )}
    >
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-500"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};

export default ProgressDisplay;
