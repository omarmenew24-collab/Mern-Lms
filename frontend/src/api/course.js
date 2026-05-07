import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation , useQueryClient} from "@tanstack/react-query";
import { useAuthStore } from "../store/useauthstore";
import useUserStore from "../store/userstore";

/* =========================
   CREATE COURSE
========================= */
export const useCreateCourse = () => {
  const createcourse = async ({ title, teacher, description, category, image }) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("teacher", teacher || "");
    formData.append("description", description);
    formData.append("category", category);
    if (image) {
      formData.append("image", image);
    }

    const res = await axiosInstance.post("/createcourse", formData);

    if (res.status === 201) {
      toast.success("course create successfully!");
    } else {
      toast.error("Something went wrong");
    }

    return res.data;
  };

  const queryClient = useQueryClient();
  const {
    mutateAsync: createmycourse,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: createcourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
    },
  });

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

/* =========================
   ADMIN: GET ALL COURSES
========================= */
export const useGetAllCoursesForAdmin = (enabled = true) => {
  const getAllCourses = async () => {
    const res = await axiosInstance.get("/admin/courses-all");
    return res.data;
  };

  const { data: allcourses, isLoading, isError } = useQuery({
    queryKey: ["admin-courses-all"],
    queryFn: getAllCourses,
    enabled: Boolean(enabled),
  });

  return { allcourses, isLoading, isError };
};

/* =========================
   GET COURSE BY ID (ADMIN/TEACHER)
========================= */
export const useGetCourseById = (courseId, enabled = true) => {
  const getCourse = async () => {
    const res = await axiosInstance.get(`/courses/${courseId}`);
    return res.data.course;
  };

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ["course", courseId],
    queryFn: getCourse,
    enabled: !!courseId && enabled,
  });

  return { course, isLoading, isError };
};

/* =========================
   UPDATE COURSE DETAILS
========================= */
export const useUpdateCourse = (courseId) => {
  const queryClient = useQueryClient();

  const updateCourse = async (payload) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("category", payload.category);
    if (payload.price !== undefined && payload.price !== null && payload.price !== "") {
      formData.append("price", String(payload.price));
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    if (payload.learningOutcomes !== undefined) {
      formData.append("learningOutcomes", JSON.stringify(payload.learningOutcomes));
    }
    if (payload.requirements !== undefined) {
      formData.append("requirements", JSON.stringify(payload.requirements));
    }
    if (payload.includesExtras !== undefined) {
      formData.append("includesExtras", JSON.stringify(payload.includesExtras));
    }
    if (payload.courseLanguage !== undefined) {
      formData.append("courseLanguage", String(payload.courseLanguage));
    }
    if (payload.purchaseNote !== undefined) {
      formData.append("purchaseNote", String(payload.purchaseNote));
    }
    if (payload.showCertificateInCatalog !== undefined) {
      formData.append("showCertificateInCatalog", String(Boolean(payload.showCertificateInCatalog)));
    }
    if (payload.showLifetimeAccessInCatalog !== undefined) {
      formData.append("showLifetimeAccessInCatalog", String(Boolean(payload.showLifetimeAccessInCatalog)));
    }
    if (payload.commentsDisabled !== undefined) {
      formData.append("commentsDisabled", String(Boolean(payload.commentsDisabled)));
    }
    if (payload.ratingsDisabled !== undefined) {
      formData.append("ratingsDisabled", String(Boolean(payload.ratingsDisabled)));
    }

    if (payload.promotionEnabled !== undefined) {
      formData.append("promotionEnabled", String(Boolean(payload.promotionEnabled)));
      formData.append("promotionType", payload.promotionType === "fixed" ? "fixed" : "percent");
      formData.append("promotionValue", String(payload.promotionValue ?? 0));
      formData.append("promotionStartsAt", payload.promotionStartsAt ? String(payload.promotionStartsAt) : "");
      formData.append("promotionEndsAt", payload.promotionEndsAt ? String(payload.promotionEndsAt) : "");
    }

    const res = await axiosInstance.patch(`/courses/${courseId}`, formData);
    return res.data.course;
  };

  const { mutateAsync: saveCourse, isPending, isError } = useMutation({
    mutationFn: updateCourse,
    onSuccess: (updatedCourse) => {
      if (updatedCourse) {
        queryClient.setQueryData(["course", courseId], updatedCourse);
        queryClient.setQueryData(["public-course", courseId], (old) => {
          if (!old) return { course: updatedCourse, meta: null };
          return { ...old, course: { ...old.course, ...updatedCourse } };
        });
      }
      toast.success("Course details updated");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", "teacher"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses-all"] });
      queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
      queryClient.invalidateQueries({ queryKey: ["course-comments", courseId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update course");
    },
  });

  return { saveCourse, isPending, isError };
};

/* =========================
   ADMIN: PUBLISH / UNPUBLISH
========================= */
export const useSetCoursePublished = (courseId) => {
  const queryClient = useQueryClient();

  const setPublished = async (isPublished) => {
    const res = await axiosInstance.patch(`/courses/${courseId}/publish`, {
      isPublished,
    });
    return res.data;
  };

  const { mutateAsync: setCoursePublished, isPending, isError } = useMutation({
    mutationFn: setPublished,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course visibility updated");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update visibility");
    },
  });

  return { setCoursePublished, isPending, isError };
};

/* =========================
   TEACHER: SUBMIT FOR REVIEW
========================= */
export const useSubmitCourseForReview = (courseId) => {
  const queryClient = useQueryClient();

  const submitCourse = async () => {
    const res = await axiosInstance.post(`/courses/${courseId}/submit-review`);
    return res.data;
  };

  const { mutateAsync: submitForReview, isPending, isError } = useMutation({
    mutationFn: submitCourse,
    onSuccess: () => {
      toast.success("Submitted for review");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses", "teacher"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses-all"] });
    },
    onError: (error) => {
      const checklist = error.response?.data?.checklist;
      if (Array.isArray(checklist) && checklist.length) {
        toast.error(checklist[0]);
      } else {
        toast.error(error.response?.data?.message || "Failed to submit for review");
      }
    },
  });

  return { submitForReview, isPending, isError };
};

/* =========================
   ADMIN: REVIEW COURSE
========================= */
export const useReviewCourse = (courseId) => {
  const queryClient = useQueryClient();

  const review = async ({ action, reviewNote }) => {
    const res = await axiosInstance.patch(`/courses/${courseId}/review`, {
      action,
      reviewNote,
    });
    return res.data;
  };

  const { mutateAsync: reviewCourse, isPending, isError } = useMutation({
    mutationFn: review,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses-all"] });
      toast.success("Course review saved");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to review course");
    },
  });

  return { reviewCourse, isPending, isError };
};

/* =========================
   ADMIN: SOFT DELETE COURSE
========================= */
export const useSoftDeleteCourse = (courseId) => {
  const queryClient = useQueryClient();

  const softDelete = async () => {
    const res = await axiosInstance.patch(`/courses/${courseId}/soft-delete`);
    return res.data;
  };

  const { mutateAsync: softDeleteCourse, isPending, isError } = useMutation({
    mutationFn: softDelete,
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete course");
    },
  });

  return { softDeleteCourse, isPending, isError };
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
    queryKey: ["courseprogress", courseId, studentId], 
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

/** Per-teacher category labels (merged with categories already used on courses). */
export const fetchCourseCategories = async (teacherIdForAdmin) => {
  const params = {};
  if (teacherIdForAdmin) params.teacherId = teacherIdForAdmin;
  const res = await axiosInstance.get("/course-categories", { params });
  return res.data.categories;
};

export const useGetCourseCategories = (teacherId) => {
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const enabled =
    !!user && (user.role === "teacher" || (isAdmin && !!teacherId));
  return useQuery({
    queryKey: ["course-categories", isAdmin ? teacherId : user?._id],
    queryFn: () => fetchCourseCategories(isAdmin ? teacherId : undefined),
    enabled,
  });
};

export const useDeleteCourseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.delete(`/course-categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
      toast.success("Saved label removed (courses unchanged)");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not remove label");
    },
  });
};