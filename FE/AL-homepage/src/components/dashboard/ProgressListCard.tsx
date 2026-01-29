import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import StudentProgressItem from './StudentProgressItem';

interface StudentData {
  name: string;
  completionRate: number;
}

interface ProgressListCardProps {
  title: string;
  students: StudentData[];
}

const ProgressListCard: React.FC<ProgressListCardProps> = ({ title, students }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {students.length > 0 ? (
            students.map((student, index) => (
              <StudentProgressItem
                key={index}
                name={student.name}
                completionRate={student.completionRate}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">해당 학생이 없습니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressListCard;
