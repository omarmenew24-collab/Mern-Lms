import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* =========================
   CREATE TASK
========================= */
export const useCreateTask = (courseId) => {
  const createtask = async ({ title, description, type, dueDate, examDetails }) => {
    const res = await axiosInstance.post(`/courses/${courseId}/tasks`, { title, description, type, dueDate, examDetails });

    if (res.status === 201) {
      toast.success("task create successfully!");
    } else {
      toast.error("Something went wrong");
    }

    return res.data;
  };

  const queryClient = useQueryClient();

  const {
    mutateAsync: createMyTask,
    isPending,
    isError,
    isSuccess,
  } = useMutation({ 
    mutationFn: createtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", courseId] });
    }
  });

  return { createMyTask, isPending, isError, isSuccess };
};

/* =========================
   GET TASKS
========================= */
export const useGetTasks = (courseId) => {
  const gettasks = async () => {
    const res = await axiosInstance.get(`/courses/${courseId}/gettasks`);
    return res.data.tasks;
  };

  const {
    data: tasks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tasks", courseId],
    queryFn: gettasks,
    enabled: !!courseId,
  });

  return { tasks, isLoading, isError };
};

/* =========================
   DELETE TASK
========================= */
export const useDeleteTask = (courseId) => {
  const queryClient = useQueryClient();

  const deletetask = async (taskId) => {
    const res = await axiosInstance.delete(
      `/courses/${courseId}/tasks/${taskId}`
    );
    toast.success("Task deleted");
    return res.data;
  };

  const {
    mutateAsync: deleteMyTask,
    isPending,
    isError,
  } = useMutation({ 
    mutationFn: deletetask,
    onSuccess: () => {
      // ✅ Use the courseId passed into the hook directly
      // This ensures the task list for THIS course refreshes
      queryClient.invalidateQueries({ queryKey: ["tasks", courseId] });
      
      // ✅ Also invalidate progress because deleting a task changes the % calculation
      queryClient.invalidateQueries({ queryKey: ["courseProgress", courseId] });
    }
  });

  return { deleteMyTask, isPending, isError };
};

/* =========================
   UPDATE TASK
========================= */


export const useUpdateTask = (courseId) => {
  const queryClient = useQueryClient();

  const updatetask = async ({ taskId, updatedFields }) => {
    const res = await axiosInstance.put(
      `/courses/${courseId}/tasksupdate/${taskId}`,
      updatedFields
    );
    // Return res.data so we can access the message or task object in onSuccess
    return res.data; 
  };

  const {
    mutateAsync: updateMyTask,
    isPending,
    isError,
  } = useMutation({ 
    mutationFn: updatetask,
    onSuccess: (data) => {
      // ✅ 2. Show the toast message
      // We use data.message if your backend sends one, otherwise a fallback string
      toast.success(data.message || "Task updated successfully! ✨");

      // ✅ 3. Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tasks", courseId] });
    },
    onError: (error) => {
      // ✅ 4. Optional: Add error toast
      const errorMessage = error.response?.data?.message || "Failed to update task";
      toast.error(errorMessage);
    }
  });

  return { updateMyTask, isPending, isError };
};

/* =========================
   SUBMISSIONS
========================= */
export const useGetSubmissionsByTask = (taskId) => {
  const getSubmissionsByTask = async () => {
    const res = await axiosInstance.get(`/submissions/${taskId}`);
    return res.data;
  };

  const {
    data: submissions,
    isLoading,
    isError: isErrorsubmission,
  } = useQuery({
    queryKey: ["submissions", taskId],
    queryFn: getSubmissionsByTask,
    enabled: !!taskId,
  });

  return { submissions, isLoading, isErrorsubmission };
};

export const useGetSubmission = (taskId, studentId) => {
  const getSubmission = async () => {
    const res = await axiosInstance.get(`submission/${studentId}/${taskId}`);
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["submission", taskId, studentId],
    queryFn: getSubmission,
    enabled: !!taskId && !!studentId,
  });

  return { data, isLoading, isError };
};

export const useGetStudentSubmissionsByCourse = (courseId, studentId) => {
  const getStudentSubmissionsByCourse = async () => {
    const res = await axiosInstance.get(
      `/course/${courseId}/student/${studentId}/submissions`,
      { withCredentials: true }
    );
    return res.data.submissions;
  };

  const {
    data: submissions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student-submissions", courseId, studentId],
    queryFn: getStudentSubmissionsByCourse,
    enabled: !!courseId && !!studentId,
  });

  return { submissions, isLoading, isError };
};

export const useGradeSubmission = (taskId) => {
  const gradesubmission = async ({ studentId, grade }) => {
    const res = await axiosInstance.post(
      `/submissions/${taskId}/${studentId}`,
      { grade },
      { withCredentials: true }
    );

    return res.data.submission;
  };

  const queryClient = useQueryClient();

  const {
    mutateAsync: GradeMySubmission,
    isPending,
    isError,
  } = useMutation({ 
    mutationFn: gradesubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", taskId] });
    }
  });

  return { GradeMySubmission, isPending, isError };
};

/* =========================
   MARK TASK AS COMPLETE
========================= */
export const useMarkTask = (courseId) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: markTask,
    isPending,
    isError,
  } = useMutation({
    // We call it taskId here for better logic
    mutationFn: async (taskId) => {
      // Matches your router: /courses/task/:courseId/:lectureId
      const res = await axiosInstance.post(`/courses/task/${courseId}/${taskId}`);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the progress query so the progress bar updates
      queryClient.invalidateQueries({ queryKey: ["courseProgress", courseId] });
      toast.success("Task marked as completed!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update task progress");
    }
  });

  return { markTask, isPending, isError };
};