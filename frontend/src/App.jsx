import Login from "./pages/loginpage";
import { Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUppage";
import Home from "./pages/homepage";
import { Toaster } from "react-hot-toast";
import Student from "./pages/studentpage";
import Teacher from "./pages/teacherpage";
import CreateCourseForm from "./pages/createcourse";
import CoursePublic from "./pages/coursepage";
import CourseDashboard from "./pages/coursedashboard";
import TaskForm from "./pages/createtask";
import GoogleSignIn from "./components/GoogleSignIn";
import UpdateProfile from "./pages/updateprofile";
import BecomeTeacherForm from "./pages/teacherform";
import TeachingRequest from "./pages/teachingrequest";
import useUserStore from "./store/userstore";
import { useEffect } from "react";
import Checkout from "./pages/payment";
import Success from "./pages/success";
import FileUploadForm from "./pages/uploadfile";
import { TaskSubmissions } from "./pages/tasksubmissions";
import StudentDetails from "./pages/studentdetails";
import LectureForm from "./pages/createlecture";
import Header from "./components/Header";

// ✅ Import the fetch hook and the Zustand store
import { useFetchUser } from "./api/auth";

function App() {
  const { isLoading } = useFetchUser();
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated); // ✅ Get hydration state

  // ✅ Wait for LocalStorage AND the API check
  if (!hasHydrated || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* ✅ Logic: If logged in, redirect away from Login/Signup to Home */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
        
        <Route path="/student" element={<Student />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/createcourse" element={<CreateCourseForm />} />
        <Route path="/course/:id" element={<CoursePublic />} />
        <Route path="/course/teacher/:id" element={<CourseDashboard />} />
        <Route path="/course/student/:id" element={<CourseDashboard />} />
        <Route path="/course/:courseId/task" element={<TaskForm />} />
        <Route path="/updateprofile" element={<UpdateProfile />} />
        <Route path="/teacherform" element={<BecomeTeacherForm />} />
        <Route path="/teachingrequest/:id" element={<TeachingRequest />} />
        <Route path="/payment/:courseId" element={<Checkout />} />
        <Route path="/success/:courseId" element={<Success />} />
        <Route
          path="/uploadfile/:courseId/:taskId/:studentId"
          element={<FileUploadForm />}
        />
        <Route
          path="/tasksubmissions/:user/:taskId"
          element={<TaskSubmissions />}
        />
        <Route
          path="/course/:courseId/student/:studentId"
          element={<StudentDetails />}
        />
        <Route
          path="/course/:courseId/createLecture"
          element={<LectureForm />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;