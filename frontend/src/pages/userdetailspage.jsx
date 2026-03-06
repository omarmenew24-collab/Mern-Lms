import React from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  Calendar,
  Clock,
  BookOpen,
  Users,
  TrendingUp,
} from "lucide-react";

import {
  useGetCoursesByTeacher,
  useGetTeacherEnrollments,
  useGetCoursesByStudent,
  useGetStudentsByCourse,
  useGetCourseProgress,
} from "../api/course";
import { UseGetUserById } from "../api/admin";

const UserDetailsPage = () => {
  const { userId } = useParams();

  const { userbyid: user, isLoading: isUserLoading, isError: isUserError } =
    UseGetUserById(userId);

  const {
    coursesbyteacher,
    isLoading: isTeacherCoursesLoading,
    isError: isTeacherCoursesError,
  } = useGetCoursesByTeacher(userId);

  const {
    coursesbystudent,
    isLoading: isEnrolledLoading,
    isError: isEnrolledError,
  } = useGetCoursesByStudent();

  if (isUserLoading)
    return <p className="p-6 text-gray-500">Loading user info...</p>;
  if (isUserError || !user)
    return <p className="p-6 text-red-500">Failed to load user info</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 space-y-10 max-w-6xl mx-auto">
      
      {/* ================= USER CARD ================= */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {user.name}
            </h2>
            <p className="text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <InfoItem icon={<Mail size={18} />} label="Email" value={user.email} color="indigo" />
          <InfoItem icon={<Shield size={18} />} label="Role" value={user.role} color="purple" />
          <InfoItem icon={<CheckCircle size={18} />} label="Status" value={user.status} color="green" />
          <InfoItem icon={<Calendar size={18} />} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} color="pink" />
          <InfoItem icon={<Clock size={18} />} label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"} color="orange" />
        </div>
      </div>

      {/* ================= COURSES TAUGHT ================= */}
      {user.role === "teacher" && (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Courses Taught
            </h2>
          </div>

          {isTeacherCoursesLoading && <p>Loading courses...</p>}
          {isTeacherCoursesError && <p>Error loading courses</p>}
          {coursesbyteacher?.length === 0 && <p>No courses taught.</p>}

          <div className="space-y-6">
            {coursesbyteacher?.map((course) => (
              <div
                key={course._id}
                className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 shadow-sm hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-xl text-gray-800">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {course.description}
                </p>
                <StudentsTable courseId={course._id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= COURSES ENROLLED ================= */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Courses Enrolled
          </h2>
        </div>

        {isEnrolledLoading && <p>Loading enrolled courses...</p>}
        {isEnrolledError && <p>Error loading enrolled courses</p>}
        {coursesbystudent?.length === 0 && <p>No courses enrolled.</p>}

        <div className="space-y-6">
          {coursesbystudent?.map((course) => (
            <div
              key={course._id}
              className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-pink-50 border border-indigo-100 shadow-sm hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-xl text-gray-800">
                {course.title}
              </h3>
              <p className="text-gray-600 mb-2">
                {course.description}
              </p>
              <CourseProgress
                courseId={course._id}
                studentId={user._id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ================= INFO ITEM ================= */
const InfoItem = ({ icon, label, value, color }) => {
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    pink: "bg-pink-100 text-pink-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-gray-800 font-semibold capitalize">{value}</p>
      </div>
    </div>
  );
};

/* ================= STUDENTS TABLE ================= */
const StudentsTable = ({ courseId }) => {
  const { students, isLoading, isError } = useGetStudentsByCourse(courseId);

  if (isLoading) return <p>Loading students...</p>;
  if (isError) return <p>Error loading students</p>;
  if (!students || students.length === 0)
    return <p>No students enrolled.</p>;

  return (
    <div className="overflow-x-auto mt-4">
      <div className="flex items-center gap-2 mb-3 text-purple-700 font-semibold">
        <Users size={18} />
        Enrolled Students
      </div>

      <table className="w-full text-sm rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 text-gray-700">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student._id}
              className="border-t hover:bg-indigo-50 transition"
            >
              <td className="p-3 font-medium">{student.name}</td>
              <td className="p-3">{student.email}</td>
              <td className="p-3 capitalize">
                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                  {student.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ================= COURSE PROGRESS ================= */
const CourseProgress = ({ courseId, studentId }) => {
  const { progressData, isLoading, isError } =
    useGetCourseProgress(courseId, studentId);

  if (isLoading) return <p>Loading progress...</p>;
  if (isError) return <p>Error loading progress</p>;

  const percentage = progressData?.percentage || 0;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2 text-indigo-700 font-medium">
        <TrendingUp size={16} />
        {percentage}% completed
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UserDetailsPage;