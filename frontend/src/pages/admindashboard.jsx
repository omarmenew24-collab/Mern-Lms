import React from "react";
import { UseGetDashboardStats } from "../api/admin";
import { useNavigate } from "react-router-dom";

import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { dashboardstats, isLoading, isError } = UseGetDashboardStats();

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center gap-2 mb-6">
          <LayoutDashboard className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h1>
        </div>

        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen text-red-500 font-medium">
        Failed to load dashboard stats.
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: dashboardstats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-500",
      link: "/admin/users",
    },
    {
      title: "Students",
      value: dashboardstats?.totalStudents || 0,
      icon: GraduationCap,
      color: "bg-green-500",
      link: "/admin/students",
    },
    {
      title: "Teachers",
      value: dashboardstats?.totalTeachers || 0,
      icon: GraduationCap,
      color: "bg-purple-500",
      link: "/admin/teachers",
    },
    {
      title: "Courses",
      value: dashboardstats?.totalCourses || 0,
      icon: BookOpen,
      color: "bg-orange-500",
      link: "/admin/courses",
    },
    {
      title: "Enrollments",
      value: dashboardstats?.totalEnrollments || 0,
      icon: ClipboardList,
      color: "bg-pink-500",
      link: "/admin/enrollments",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="text-blue-600" size={32} />
        <h1 className="text-2xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              onClick={() => navigate(stat.link)}
              className="
                bg-white
                rounded-xl
                p-6
                shadow-sm
                border border-gray-100
                hover:shadow-lg
                hover:-translate-y-1
                transition-all
                duration-300
                cursor-pointer
                flex items-center justify-between
              "
            >
              {/* Text */}
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {stat.title}
                </p>

                <p className="text-3xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>

              {/* Icon */}
              <div
                className={`
                  ${stat.color}
                  text-white
                  p-3
                  rounded-lg
                  shadow-md
                `}
              >
                <Icon size={22} />
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};

export default AdminDashboard;
