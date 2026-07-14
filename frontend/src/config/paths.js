/** Client-side URL conventions: kebab-case segments, plural resource names where it fits REST style. */

export const paths = {
  home: "/",
  about: "/about",
  login: "/login",
  signUp: "/sign-up",
  verifyEmailPending: "/sign-up/check-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  /** Saved courses for checkout (client-side cart). */
  cart: "/cart",
  notifications: "/notifications",
  student: "/student",
  teacher: "/teacher",
  teacherNewCourse: "/teacher/courses/new",
  profile: "/profile",
  /** Public profile (teacher or student) — about + project links */
  userPublic: (userId) => `/u/${userId}`,
  admin: "/admin",
  /** Admin account shell (profile + quick links) — not site-wide config. */
  adminSettings: "/admin/settings",
  adminSettingsPublicAbout: "/admin/settings#public-about",
  adminSettingsWhyLearn: "/admin/settings#why-learn-home",
  adminUsers: "/admin/users",
  adminUser: (userId) => `/admin/users/${userId}`,
  adminCourses: "/admin/courses",
  adminCourse: (courseId) => `/admin/courses/${courseId}`,
  adminFinance: "/admin/finance",
  adminFinancialSettings: "/admin/settings/financial",
  adminRefunds: "/admin/refunds",
  adminManualPayments: "/admin/manual-payments",
  adminCoupons: "/admin/coupons",
  studentManualPayments: "/student/manual-payments",
  studentRefunds: "/student/refunds",
  /** Instructor: in-app announcements (admins use Admin workspace + hash). */
  sendAnnouncement: "/announcements/send",
  /** Admin: scrolls to in-app section on settings */
  adminInAppAnnouncements: "/admin/settings#in-app-announcements",
  course: (courseId) => `/courses/${courseId}`,
  courseWorkspace: (courseId) => `/courses/${courseId}/workspace`,
  /** Instructor workspace section (overview | curriculum | students | tasks | settings | comments — UI label "Q&A"). */
  courseWorkspaceTab: (courseId, tab) => `/courses/${courseId}/workspace/${tab}`,
  courseNewTask: (courseId) => `/courses/${courseId}/tasks/new`,
  courseNewLecture: (courseId) => `/courses/${courseId}/lectures/new`,
  courseEditLecture: (courseId, lectureId) =>
    `/courses/${courseId}/lectures/${lectureId}/edit`,
  courseStudent: (courseId, studentId) =>
    `/courses/${courseId}/students/${studentId}`,
  courseTaskSubmit: (courseId, taskId) =>
    `/courses/${courseId}/tasks/${taskId}/submit`,
  courseTaskSubmissions: (courseId, taskId) =>
    `/courses/${courseId}/tasks/${taskId}/submissions`,
  checkoutCourse: (courseId) => `/checkout/courses/${courseId}`,
  checkoutSuccess: (courseId) => `/checkout/success/${courseId}`,
  /** Public certificate verification (credential ID in path). */
  certificateVerify: (code) => `/certificate/verify/${encodeURIComponent(code)}`,
};
