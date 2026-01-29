import { create } from 'zustand';
import { getClassHomeworkProgressReport } from '../api/report.api';
import type { ClassHomeworkProgressReport } from '../types/report';

interface StudentProgress {
  name: string;
  completionRate: number;
}

interface DashboardState {
  loading: boolean;
  error: string | null;
  kpis: {
    totalStudents: number;
    averageCompletion: number;
    studentsBelowStandard: number;
  };
  topStudents: StudentProgress[];
  studentsToWatch: StudentProgress[];
  fetchDashboardData: (classId: number) => Promise<void>;
}

const useDashboardStore = create<DashboardState>((set) => ({
  loading: false,
  error: null,
  kpis: {
    totalStudents: 0,
    averageCompletion: 0,
    studentsBelowStandard: 0,
  },
  topStudents: [],
  studentsToWatch: [],
  fetchDashboardData: async (classId: number) => {
    set({ loading: true, error: null });
    try {
      const report: ClassHomeworkProgressReport = await getClassHomeworkProgressReport(classId);
      const students = report.reports;

      if (students.length === 0) {
        set({
          loading: false,
          kpis: { totalStudents: 0, averageCompletion: 0, studentsBelowStandard: 0 },
          topStudents: [],
          studentsToWatch: [],
        });
        return;
      }

      const totalStudents = students.length;
      const averageCompletion =
        students.reduce((acc, student) => acc + student.completion_rate, 0) / totalStudents;
      
      const studentsBelowStandard = students.filter(
        (student) => student.completion_rate < 70
      ).length;

      const sortedStudents = [...students].sort(
        (a, b) => b.completion_rate - a.completion_rate
      );

      const topStudents = sortedStudents.slice(0, 5).map(s => ({ name: s.student_name, completionRate: s.completion_rate }));
      const studentsToWatch = sortedStudents.filter(s => s.completion_rate < 70).slice(0,5).map(s => ({ name: s.student_name, completionRate: s.completion_rate }));

      set({
        loading: false,
        kpis: {
          totalStudents,
          averageCompletion,
          studentsBelowStandard,
        },
        topStudents,
        studentsToWatch,
      });
    } catch (err) {
      set({ loading: false, error: '대시보드 데이터를 불러오는 데 실패했습니다.' });
      console.error(err);
    }
  },
}));

export default useDashboardStore;
