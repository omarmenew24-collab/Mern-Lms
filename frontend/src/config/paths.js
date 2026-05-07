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
  teachingApply: "/teaching/apply",
  teachingRequest: (id) => `/teaching/requests/${id}`,
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
  adminChargebacks: "/admin/chargebacks",
  adminChargeback: (id) => `/admin/chargebacks/${id}`,
  adminManualPayments: "/admin/manual-payments",
  studentManualPayments: "/student/manual-payments",
  studentRefunds: "/student/refunds",
  /** Instructor: in-app announcements (admins use Admin workspace + hash). */
  sendAnnouncement: "/announcements/send",
  /** Admin: scrolls to in-app section on settings */
  adminInAppAnnouncements: "/admin/settings#in-app-announcements",
  course: (courseId) => `/courses/${courseId}`,
  courseWorkspace: (courseId) => `/courses/${courseId}/workspace`,
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
};
