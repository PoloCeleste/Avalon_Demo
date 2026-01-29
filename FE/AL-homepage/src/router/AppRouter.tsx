import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { cancelAllRequests } from '../api/axiosInstance'

import LoginPage from '../pages/Login'
import HomePage from '../pages/Home'
import ForbiddenPage from '../pages/Forbidden'
import NotFoundPage from '../pages/NotFound'

import ProtectedRoute from '../guards/ProtectedRoute'
import RoleGuard from '../guards/RoleGuard'
import MainLayout from '../components/layouts/MainLayout'

// Students
import StudentList from '../pages/Students/StudentList'
import StudentDetail from '../pages/Students/StudentDetail'

// Teachers
import TeacherList from '../pages/Teachers/TeacherList'
import TeacherDetail from '../pages/Teachers/TeacherDetail'

// Classes
import ClassList from '../pages/Classes/ClassList'
import ClassDetail from '../pages/Classes/ClassDetail'

// --- 변경점: HomeworksPage 컴포넌트 import 추가 ---
import HomeworksPage from '../pages/Homeworks'

// Admin
import ClassCalendarPrintPage from '../pages/Admin/ClassCalendarPrint'
import CurriculumsPage from '../pages/Admin/Curriculums'
import CurriculumDetailPage from '../pages/Admin/CurriculumDetail'
import CurriculumEditPage from '../pages/Admin/CurriculumEdit'
import AccountsPage from '../pages/Admin/Accounts'
import AccountCreatePage from '../pages/Admin/AccountCreatePage'
import AccountDetailPage from '../pages/Admin/AccountDetail'
import BranchesPage from '../pages/Admin/Branches'
import SemestersPage from '../pages/Admin/Semesters'
import SemesterDetail from '../pages/Admin/SemesterDetail'

// My Page
import MyPage from '../pages/MyPage'

// ✅ 라우트 변경 시 API 요청을 취소하는 컴포넌트
const RequestCanceller = () => {
  const location = useLocation()

  useEffect(() => {
    console.log('[Navigation] Route changed, cancelling all pending requests.')
    cancelAllRequests()
  }, [location]) // location 객체가 바뀔 때마다 실행

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* ✅ 앱 전체의 라우트 변경을 감지하기 위해 여기에 추가 */}
      <RequestCanceller />
      <Routes>
        {/* ===== 공개 라우트 ===== */}
        <Route path="/login" element={<LoginPage />} />

        {/* ===== 보호 라우트: 로그인 필요 ===== */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<RoleGuard />}>
              {/* 홈 */}
              <Route path="/" element={<HomePage />} />

              {/* 학생 */}
              <Route path="/students" element={<StudentList />} />
              <Route path="/students/:id" element={<StudentDetail />} />

              {/* 선생님 */}
              <Route path="/teachers" element={<TeacherList />} />
              <Route path="/teachers/:id" element={<TeacherDetail />} />

              {/* 반 */}
              <Route path="/classes" element={<ClassList />} />
              <Route path="/classes/:id" element={<ClassDetail />} />

              {/* --- 변경점: 숙제 라우트 추가 --- */}
              <Route path="/homeworks" element={<HomeworksPage />} />

              {/* 마이페이지 */}
              <Route path="/my-page" element={<MyPage />} />

              {/* 관리(Admin) */}
              <Route path="/admin/calendars" element={<ClassCalendarPrintPage />} />
              <Route path="/admin/curriculums" element={<CurriculumsPage />} />
              <Route path="/admin/curriculums/:id" element={<CurriculumDetailPage />} />
              <Route path="/admin/curriculums/edit/:id" element={<CurriculumEditPage />} />
              <Route path="/admin/accounts" element={<AccountsPage />} />
              <Route path="/admin/accounts/new" element={<AccountCreatePage />} />
              <Route path="/admin/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/admin/branches" element={<BranchesPage />} />
              <Route path="/admin/semesters" element={<SemestersPage />} />
              <Route path="/admin/semesters/:id" element={<SemesterDetail />} />
            </Route>
          </Route>
        </Route>

        {/* 예외 */}
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
