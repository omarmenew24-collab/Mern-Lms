import { useParams, Link } from "react-router-dom";
import useUserStore from "../store/userstore";
import { useCheckEnrollment } from "../api/payment";

export default function Success() {
  const { courseId } = useParams();
  const user = useUserStore((state) => state.user);
  console.log("courseId in success",courseId)
  console.log("user", user)

  // Using the pattern matching your task.js logic
  // This hook automatically polls the backend every 3 seconds 
  // until isEnrolled becomes true.
  const { isEnrolled, isLoading, isError } = useCheckEnrollment(
    courseId, 
    user?._id, 
    true // isEnabled
  );

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md border border-gray-100">
        
        {/* Loading Spinner: Shows only while waiting for enrollment confirmation */}
        {!isEnrolled && !isError && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}

        <h1 className={`text-2xl font-bold ${isEnrolled ? 'text-green-600' : 'text-gray-800'}`}>
          {isError 
            ? "Error verifying enrollment." 
            : isEnrolled 
              ? "✨ Success! You are now enrolled." 
              : "Finalizing your enrollment..."
          }
        </h1>

        <p className="text-gray-500 mt-2">
          {isError && "We couldn't verify your status. Please contact support."}
          {!isEnrolled && !isError && "We're confirming your payment with Stripe. This usually takes a few seconds."}
          {isEnrolled && "Your payment was processed successfully. You can now start learning!"}
        </p>
        
        {/* Only show the link once the polling confirms the student is enrolled in MongoDB */}
        {isEnrolled && (
          <Link 
            to="/dashboard" 
            className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            Go to My Courses
          </Link>
        )}

        {isError && (
          <Link to="/support" className="mt-6 text-blue-600 font-medium hover:underline block">
            Contact Support
          </Link>
        )}
      </div>
    </div>
  );
}