import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation , useQueryClient} from "@tanstack/react-query";
import Student from "../pages/studentpage";
import { useAuthStore } from "../store/useauthstore";

/* =========================
   CREATE COURSE
========================= */
export const useCreateCourse = () => {
  const createcourse = async ({ title, teacher, description, category }) => {
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

    return res.data;
  };

  const {
    mutateAsync: createmycourse,
    isPending,
    isError,
    isSuccess,
  } = useMutation({ mutationFn: createcourse });

  return { createmycourse, isPending, isError, isSuccess };
};


export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  const deletecourse = async (courseId) => {
    const res = await axiosInstance.delete(`/deletecourse/${courseId}`);
    return res.data;
  };

  const {
    mutateAsync: deletemycourse,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: deletecourse,
    onSuccess: () => {
      toast.success("Course deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete course");
    },
  });

  return { deletemycourse, isPending, isError, isSuccess };
};

/* =========================
   GET ALL COURSES
========================= */
export const useGetCourses = () => {
  const getcourseslist = async () => {
    const res = await axiosInstance.get("/courses");
    return res.data;
  };

  const {
    data: allcourses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: getcourseslist,
  });

  return { allcourses, isLoading, isError };
};



// Pass the search query into the hook so it can react to changes
export const useGetTeachersList = (searchquery) => {
  const getteacherslist = async () => {
    // If there's no query, don't waste an API call
    if (!searchquery) return [];
    
    const res = await axiosInstance.get("/teachers", {
      params: { searchquery },
    });
    return res.data;
  };

  const { data: teacherslist, isLoading, isError } = useQuery({
    // IMPORTANT: searchquery must be in the key so it re-fetches when you type
    queryKey: ["teachers", searchquery],
    queryFn: getteacherslist,
    enabled: !!searchquery, // Only run the query if searchquery exists
  });

  // Return the data directly (it's an array, not a function)
  return { teacherslist, isLoading, isError };
};
/* =========================
   COURSES BY TEACHER
========================= */
export const useGetCoursesByTeacher = (teacherId) => {
  
  const token = useAuthStore((state) => state.accessToken);

  const getCoursesByTeacher = async () => {
    const res = await axiosInstance.get("/courses/teacher", {
      params: { teacherId },
    });
    return res.data;
  };

  const {
    data: coursesbyteacher,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses", "teacher", teacherId],
    queryFn: getCoursesByTeacher,
    enabled: !!teacherId && !!token,
  });

  return { coursesbyteacher, isLoading, isError };
};

/* =========================
   COURSES BY STUDENT
========================= */
export const useGetCoursesByStudent = () => {
  const getCoursesByStudent = async () => {
    // The backend now gets the ID from the token in the header
    const res = await axiosInstance.get(`/courses/enrolled`); 
    return res.data.courses;
  };

  const {
    data: coursesbystudent = [], // Rename 'data' to your variable name
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses", "enrolled"], // Simplified key
    queryFn: getCoursesByStudent,
    // No 'enabled' check needed if we rely on the user being logged in
  });

  return { coursesbystudent, isLoading, isError };
};
/* =========================
   TEACHER ENROLLMENTS
========================= */
export const useGetTeacherEnrollments = (teacherId) => {
  const getTeacherEnrollments = async () => {
    const res = await axiosInstance.get(
      `/teacher/${teacherId}/enrollments`
    );
    return res.data.enrollments;
  };

  const {
    data: teacherenrollments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teacher-enrollments", teacherId],
    queryFn: getTeacherEnrollments,
    enabled: !!teacherId,
  });

  return { teacherenrollments, isLoading, isError };
};

/* =========================
   STUDENTS BY COURSE
========================= */
export const useGetStudentsByCourse = (courseId) => {
  const getStudentsByCourse = async () => {
    const res = await axiosInstance.get(
      `/courses/${courseId}/students`,
    );
    return res.data.students;
  };

  const {
    data: students,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["students", courseId],
    queryFn: getStudentsByCourse,
    enabled: !!courseId,
  });

  return { students, isLoading, isError };
};



export const useGetCourseProgress = (courseId, studentId) => {
  const getCourseProgress = async () => {
    try {
      // ✅ Build the URL dynamically
      let url = `/progress/${courseId}`;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      
      const res = await axiosInstance.get(url);
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const {data: progressData , isLoading , isError} =  useQuery({
    // ✅ Add studentId to queryKey so it refetches when the student changes
    queryKey: ["courseProgress", courseId, studentId], 
    queryFn: getCourseProgress,
    // ✅ Keep enabled logic flexible
    enabled: !!courseId, 
  });

  return {progressData , isLoading , isError}
};

export const useGetBulkProgress = (courseId) => {
  const getBulkProgress = async () => {
    try {
        const res = await axiosInstance.get(`/progress/bulk/${courseId}`);
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
  };

  const {
    data: bulkprogressData,
    // ✅ FIX: useQuery doesn't have "isbulkLoading". 
    // You must rename them like this:
    isLoading: isbulkLoading,
    isError: isbulkError,
  } = useQuery({
    queryKey: ["courseProgress", "bulk", courseId],
    queryFn: getBulkProgress,
    enabled: !!courseId,
  });

  return { bulkprogressData, isbulkLoading, isbulkError };
};


export const useToggleCertificatePermission = () => {
  const queryClient = useQueryClient();

  const togglecertificate = async ({ courseId, studentId }) => {
    const res = await axiosInstance.post(
      `/togglecertificate/${courseId}/${studentId}`
    );

    if (res.status === 200 || res.status === 201) {
      toast.success("Certificate permission updated!");
    } else {
      toast.error("Something went wrong");
    }

    // Invalidate queries to refresh the UI data
    queryClient.invalidateQueries(["courseProgress", courseId]);
    queryClient.invalidateQueries(["courseProgress", "bulk", courseId]);

    return res.data.progress;
  };

  const {
    mutateAsync: togglecertpermission,
    isPending,
    isError,
    isSuccess,
  } = useMutation({ mutationFn: togglecertificate });

  return { togglecertpermission, isPending, isError, isSuccess };
};