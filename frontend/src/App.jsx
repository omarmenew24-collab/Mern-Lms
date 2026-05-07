import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import useUserStore from "./store/userstore";
import { initializeAuth } from "./lib/initializeAuth";
import { useDarkMode } from "./store/darkmode";
import Header from "./components/Header";

import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import VerifyEmailPendingPage from "./pages/auth/VerifyEmailPendingPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/AboutPage";
import PublicUserProfilePage from "./pages/PublicUserProfilePage";
import StudentPage from "./pages/student/StudentPage";
import TeacherPage from "./pages/teacher/TeacherPage";
import CreateCoursePage from "./pages/teacher/CreateCoursePage";
import CoursePublicPage from "./pages/course/CoursePublicPage";
import CourseDashboardPage from "./pages/course/CourseDashboardPage";
import CreateTaskPage from "./pages/course/CreateTaskPage";
import CreateLecturePage from "./pages/course/CreateLecturePage";
import StudentDetailsPage from "./pages/course/StudentDetailsPage";
import UpdateProfilePage from "./pages/profile/UpdateProfilePage";
import CartPage from "./pages/cart/CartPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import BecomeTeacherPage from "./pages/teaching/BecomeTeacherPage";
import TeachingRequestPage from "./pages/teaching/TeachingRequestPage";
import PaymentPage from "./pages/billing/PaymentPage";
import SuccessPage from "./pages/billing/SuccessPage";
import UploadFilePage from "./pages/submission/UploadFilePage";
import { TaskSubmissionsPage } from "./pages/submission/TaskSubmissionsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminCourseDetailsPage from "./pages/admin/AdminCourseDetailsPage";
import AdminFinancePage from "./pages/admin/AdminFinancePage";
import AdminFinancialSettingsPage from "./pages/admin/AdminFinancialSettingsPage";
import AdminRefundsPage from "./pages/admin/AdminRefundsPage";
import AdminChargebacksPage from "./pages/admin/AdminChargebacksPage";
import AdminChargebackDetailPage from "./pages/admin/AdminChargebackDetailPage";
import AdminManualPaymentsPage from "./pages/admin/AdminManualPaymentsPage";
import StudentManualPaymentsPage from "./pages/student/StudentManualPaymentsPage";
import StudentRefundsPage from "./pages/student/StudentRefundsPage";
import UsersPage from "./pages/admin/UsersPage";
import UserDetailsPage from "./pages/admin/UserDetailsPage";
import SendAnnouncementPage from "./pages/announcements/SendAnnouncementPage";

/* ---------- Legacy URL redirects (bookmarks & old links) ---------- */
function RedirectSignUp() {
  return <Navigate to="/sign-up" replace />;
}
function RedirectAdminHome() {
  return <Navigate to="/admin" replace />;
}
function RedirectAllUsers() {
  return <Navigate to="/admin/users" replace />;
}
function RedirectUserDetails() {
  const { userId } = useParams();
  return <Navigate to={`/admin/users/${userId}`} replace />;
}
function RedirectUpdateProfile() {
  return <Navigate to="/profile" replace />;
}
function RedirectTeacherForm() {
  return <Navigate to="/teaching/apply" replace />;
}
function RedirectTeachingRequest() {
  const { id } = useParams();
  return <Navigate to={`/teaching/requests/${id}`} replace />;
}
function RedirectCreateCourse() {
  return <Navigate to="/teacher/courses/new" replace />;
}
function RedirectPayment() {
  const { courseId } = useParams();
  return <Navigate to={`/checkout/courses/${courseId}`} replace />;
}
function RedirectSuccess() {
  const { courseId } = useParams();
  return <Navigate to={`/checkout/success/${courseId}`} replace />;
}
function RedirectUploadShort() {
  const { courseId, taskId } = useParams();
  return <Navigate to={`/courses/${courseId}/tasks/${taskId}/submit`} replace />;
}
function RedirectUploadWithStudent() {
  const { courseId, taskId } = useParams();
  return <Navigate to={`/courses/${courseId}/tasks/${taskId}/submit`} replace />;
}
function RedirectCoursePublic() {
  const { id } = useParams();
  return <Navigate to={`/courses/${id}`} replace />;
}
function RedirectCourseTeacherDash() {
  const { id } = useParams();
  return <Navigate to={`/courses/${id}/workspace`} replace />;
}
function RedirectCourseStudentDash() {
  const { id } = useParams();
  return <Navigate to={`/courses/${id}/workspace`} replace />;
}
function RedirectOldTask() {
  const { courseId } = useParams();
  return <Navigate to={`/courses/${courseId}/tasks/new`} replace />;
}
function RedirectOldCreateLecture() {
  const { courseId } = useParams();
  return <Navigate to={`/courses/${courseId}/lectures/new`} replace />;
}
function RedirectOldLectureEdit() {
  const { courseId, lectureId } = useParams();
  return <Navigate to={`/courses/${courseId}/lectures/${lectureId}/edit`} replace />;
}
function RedirectOldStudentDetail() {
  const { courseId, studentId } = useParams();
  return <Navigate to={`/courses/${courseId}/students/${studentId}`} replace />;
}

function RequireAdmin({ children }) {
  const user = useUserStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function RequireAdminOrTeacher({ children }) {
  const user = useUserStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "teacher") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const { darkMode } = useDarkMode();
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated);

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setAuthReady(true);
    };
    init();
  }, []);

  if (!authReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/u/:userId" element={<PublicUserProfilePage />} />

          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/sign-up" element={user ? <Navigate to="/" /> : <SignUpPage />} />
          <Route
            path="/sign-up/check-email"
            element={user ? <Navigate to="/" replace /> : <VerifyEmailPendingPage />}
          />
          <Route
            path="/forgot-password"
            element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
          />
          {/* Always allow reset (even when logged in): email links must work with an active session */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/teacher/courses/new" element={<CreateCoursePage />} />

          <Route path="/courses/:courseId/workspace" element={<CourseDashboardPage />} />
          <Route path="/courses/:courseId/tasks/new" element={<CreateTaskPage />} />
          <Route path="/courses/:courseId/lectures/new" element={<CreateLecturePage />} />
          <Route
            path="/courses/:courseId/lectures/:lectureId/edit"
            element={<CreateLecturePage />}
          />
          <Route
            path="/courses/:courseId/students/:studentId"
            element={<StudentDetailsPage />}
          />
          <Route
            path="/courses/:courseId/tasks/:taskId/submit"
            element={<UploadFilePage />}
          />
          <Route
            path="/courses/:courseId/tasks/:taskId/submissions"
            element={<TaskSubmissionsPage />}
          />
          <Route path="/courses/:courseId" element={<CoursePublicPage />} />

          <Route path="/profile" element={<UpdateProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/teaching/apply" element={<BecomeTeacherPage />} />
          <Route
            path="/teaching/requests/:id"
            element={
              <RequireAdmin>
                <TeachingRequestPage />
              </RequireAdmin>
            }
          />

          <Route path="/checkout/courses/:courseId" element={<PaymentPage />} />
          <Route path="/checkout/success/:courseId" element={<SuccessPage />} />

          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AdminSettingsPage />
              </RequireAdmin>
            }
          />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/users/:userId" element={<UserDetailsPage />} />
          <Route path="/admin/courses" element={<AdminCoursesPage />} />
          <Route path="/admin/courses/:courseId" element={<AdminCourseDetailsPage />} />
          <Route path="/admin/finance" element={<AdminFinancePage />} />
          <Route
            path="/admin/settings/financial"
            element={
              <RequireAdmin>
                <AdminFinancialSettingsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <RequireAdmin>
                <AdminRefundsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/manual-payments"
            element={
              <RequireAdmin>
                <AdminManualPaymentsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/chargebacks"
            element={
              <RequireAdmin>
                <AdminChargebacksPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/chargebacks/:id"
            element={
              <RequireAdmin>
                <AdminChargebackDetailPage />
              </RequireAdmin>
            }
          />
          <Route path="/student/manual-payments" element={<StudentManualPaymentsPage />} />
          <Route path="/student/refunds" element={<StudentRefundsPage />} />
          <Route
            path="/announcements/send"
            element={
              <RequireAdminOrTeacher>
                <SendAnnouncementPage />
              </RequireAdminOrTeacher>
            }
          />

          <Route path="/admin/students" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/teachers" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/enrollments" element={<Navigate to="/admin" replace />} />

          {/* Legacy paths → canonical (see config/paths.js) */}
          <Route path="/signup" element={<RedirectSignUp />} />
          <Route path="/admindashboard" element={<RedirectAdminHome />} />
          <Route path="/allusers" element={<RedirectAllUsers />} />
          <Route path="/userdetailspage/:userId" element={<RedirectUserDetails />} />
          <Route path="/updateprofile" element={<RedirectUpdateProfile />} />
          <Route path="/teacherform" element={<RedirectTeacherForm />} />
          <Route path="/teachingrequest/:id" element={<RedirectTeachingRequest />} />
          <Route path="/createcourse" element={<RedirectCreateCourse />} />
          <Route path="/payment/:courseId" element={<RedirectPayment />} />
          <Route path="/success/:courseId" element={<RedirectSuccess />} />
          <Route path="/uploadfile/:courseId/:taskId" element={<RedirectUploadShort />} />
          <Route
            path="/uploadfile/:courseId/:taskId/:studentId"
            element={<RedirectUploadWithStudent />}
          />
          <Route path="/course/:id" element={<RedirectCoursePublic />} />
          <Route path="/course/teacher/:id" element={<RedirectCourseTeacherDash />} />
          <Route path="/course/student/:id" element={<RedirectCourseStudentDash />} />
          <Route path="/course/:courseId/task" element={<RedirectOldTask />} />
          <Route path="/course/:courseId/createLecture" element={<RedirectOldCreateLecture />} />
          <Route
            path="/course/:courseId/lecture/:lectureId/edit"
            element={<RedirectOldLectureEdit />}
          />
          <Route
            path="/course/:courseId/student/:studentId"
            element={<RedirectOldStudentDetail />}
          />
          <Route
            path="/tasksubmissions/:user/:taskId"
            element={<TaskSubmissionsPage />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
  );
}

export default App;
