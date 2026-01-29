import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import ProgressDisplay from './ProgressDisplay';

interface OverallProgressCardProps {
  title: string;
  description: string;
  averageCompletion: number;
  totalCount: number;
  completedCount: number;
}

const OverallProgressCard: React.FC<OverallProgressCardProps> = ({
  title,
  description,
  averageCompletion,
  totalCount,
  completedCount,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-medium text-gray-500">전체 평균 진척도</span>
            <span className="text-2xl font-bold text-blue-600">{averageCompletion.toFixed(1)}%</span>
          </div>
          <ProgressDisplay value={averageCompletion} size="md" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium text-gray-500">완료 현황</span>
          <span className="text-sm font-semibold text-gray-700">
            {completedCount} / {totalCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallProgressCard;
