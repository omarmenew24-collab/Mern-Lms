import { create } from "zustand";
import { axiosInstance } from "../lib/axios"; // adjust path as needed
import toast from "react-hot-toast";

const usecourseStore = create((set, get) => ({

  // ==========================
  // EXISTING STATE
  // ==========================
  name: null,
  password: null,
  role: null,

  // ==========================
  // NEW STATE VARIABLES YOU ASKED FORSS
  // ==========================


  courseslist: [],
  setCourseslist: (list) => set({ courseslist: list }),

  // ==========================
  // METHODS (UNCHANGED EXCEPT USING SET IF NEEDED)
  // ==========================

  createcourse: async ({ title, teacher, description, category }) => {
    try {
      const res = await axiosInstance.post("/createcourse", {
        title,
        teacher,
        description,
        category,
      });

      if (res.status === 201) {
        toast.success("course create successfully!");
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      const message = error.response?.data?.message || "course creation failed";
      toast.error(message);
    }
  },

  createtask: async (courseId, { title, description, type, dueDate, examDetails }) => {
    try {
      const res = await axiosInstance.post(`/courses/${courseId}/tasks`, {
        title,
        description,
        type,
        dueDate,
        examDetails,
      });

      if (res.status === 201) {
        toast.success("task create successfully!");
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      const message = error.response?.data?.message || "task creation failed";
      toast.error(message);
    }
  },

  gettasks: async (courseId) => {
    try {
      const res = await axiosInstance.get(`/courses/${courseId}/gettasks`);
      return res.data;
    } catch (error) {
      console.log("Error fetching tasks:", error);
      throw error;
    }
  },

  deletetask: async (courseId, taskId) => {
    try {
      const res = await axiosInstance.delete(`/courses/${courseId}/tasks/${taskId}`);
      if (res.status === 200) return res.data.tasks;
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete task");
      return null;
    }
  },

  updatetask: async (courseId, taskId, updatedFields) => {
    try {
      const res = await axiosInstance.put(
        `/courses/${courseId}/tasksupdate/${taskId}`,
        updatedFields
      );
      if (res.status === 200) return res.data.task;
    } catch (error) {
      console.error("Error updating task:", error.response?.data || error.message);
      throw error;
    }
  },

  getteacherslist: async ({ searchquery }) => {
    try {
      const res = await axiosInstance.get("/teachers", {
        params: { searchquery },
      });
      return res.data;
    } catch (error) {
      console.log(error);
    }
  },

  getcourseslist: async () => {
    try {
      const res = await axiosInstance.get("/courses");

      // 👉 store courseslist into Zustand state
      set({ courseslist: res.data });

      return res.data;
    } catch (error) {
      console.log(error);
    }
  },

  getCoursesByTeacher: async (teacherId) => {
    try {
      const res = await axiosInstance.get("/courses/teacher", {
        params: { teacherId },
      });

      // 👉 also store list
      set({ courseslist: res.data });

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch courses");
      return [];
    }
  },

  getCoursesByStudent: async (studentId, form) => {
    try {
      const res = await axiosInstance.get(`/courses/${studentId}`, form);

      if (res.status === 200 && res.data.success) {
        // 👉 store courses into global list
        set({ courseslist: res.data.courses });

        return res.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching student courses:", error);
      return null;
    }
  },

  getSubmissionsByTask: async (taskId) => {
    try {
      const res = await axiosInstance.get(`/submissions/${taskId}`);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  },

  getSubmission: async (taskId, studentId) => {
    try {
      const res = await axiosInstance.get(`submission/${studentId}/${taskId}`);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  },

  getTeacherEnrollments: async (teacherId) => {
    try {
      const res = await axiosInstance.get(`/teacher/${teacherId}/enrollments`, {
        withCredentials: true,
      });

      if (res.status === 200) {
        set({ courseslist: res.data.courses });
        return res.data.courses;
      }

      throw new Error("Failed to fetch enrollments");
    } catch (error) {
      console.error("Error fetching teacher enrollments:", error);
      return [];
    }
  },

  getStudentsByCourse: async (courseId) => {
    try {
      const res = await axiosInstance.get(`/courses/${courseId}/students`, {
        withCredentials: true,
      });
      if (res.status === 200) return res.data.students;
      throw new Error("Failed to fetch students");
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
      return [];
    }
  },

  getStudentSubmissionsByCourse: async (courseId, studentId) => {
    try {
      const res = await axiosInstance.get(
        `/course/${courseId}/student/${studentId}/submissions`,
        { withCredentials: true }
      );
      if (res.status === 200) return res.data.submissions;
      throw new Error("Failed to fetch student submissions");
    } catch (error) {
      console.error("Error fetching student submissions:", error);
      return [];
    }
  },

  createLecture: async (courseId, lecture) => {
    try {
      const res = await axiosInstance.post(`/course/${courseId}/createLecture`, lecture);
      console.log("response from createlecture", res.data)
      return res.data;
    } catch (error) {
      console.log(error);
    }
  },

  getLecturesByCourse: async (courseId) => {
    try {
      const res = await axiosInstance.get(`/course/${courseId}/lectures`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

}));

export default usecourseStore;

