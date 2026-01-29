import React from 'react';
import ProgressDisplay from './ProgressDisplay';

interface StudentProgressItemProps {
  name: string;
  completionRate: number;
  avatarUrl?: string; // Optional avatar
}

const StudentProgressItem: React.FC<StudentProgressItemProps> = ({ name, completionRate, avatarUrl }) => {
  return (
    <div className="flex items-center space-x-4 py-2">
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img className="h-10 w-10 rounded-full" src={avatarUrl} alt={name} />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <ProgressDisplay value={completionRate} size="sm" />
      </div>
      <div className="text-sm font-semibold text-gray-700 w-12 text-right">
        {completionRate.toFixed(0)}%
      </div>
    </div>
  );
};

export default StudentProgressItem;
