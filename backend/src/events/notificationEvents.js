/**
 * Thin re-export so controllers can import from `events/` if you prefer that layout.
 * Implementation lives in services/notification.service.js.
 */
export {
  createInAppNotification,
  createInAppForMany,
  notifySafe,
  onCourseEnrolledFromPayment,
  onLecturePublished,
  onTaskCreatedForCourse,
  onAssignmentSubmitted,
  onAssignmentGraded,
  onCourseCommentForInstructor,
} from "../services/notification.service.js";
