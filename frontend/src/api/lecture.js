import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation , useQueryClient} from "@tanstack/react-query";

export const useCreateLecture = (courseId) => {
  const queryClient = useQueryClient();
  const createLecture = async (lecture) => {
    const res = await axiosInstance.post(
      `/course/${courseId}/createLecture`,
      lecture
    );
    return res.data;
  };

  const {
    mutateAsync: createMyLecture,
    isPending,
    isError,
  } = useMutation({ mutationFn: createLecture,
       onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
        toast.success("Lecture created successfully!");
      }
   });

  return { createMyLecture, isPending, isError };
};

export const useGetLecturesByCourse = (courseId) => {
  const getLecturesByCourse = async () => {
    const res = await axiosInstance.get(
      `/course/${courseId}/lectures`
    );
    return res.data.lectures;
  };

  const {
    data: lectures,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lectures", courseId],
    queryFn: getLecturesByCourse,
    enabled: !!courseId,
  });

  return { lectures, isLoading, isError };
};

export const useDeleteLecture = (courseId) => {
    const queryClient = useQueryClient();

  const deleteLecture = async (lectureId) => {
    const res = await axiosInstance.delete(
      `/courses/lecture/${courseId}/${lectureId}`
    );
    return res.data;
  };
  const {
    mutateAsync: deleteMyLecture,
    isPending,
    isError,
  } = useMutation({
    mutationFn: deleteLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
      toast.success("Lecture deleted successfully!");
    }
  });

  return { deleteMyLecture, isPending, isError };
}

export const useMarkLecture = (courseId) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: markLecture, // Renamed for standard camelCase
    isPending,
    isError,
  } = useMutation({
    // We pass lectureId here so the hook is flexible
    mutationFn: async (lectureId) => {
      const res = await axiosInstance.post(`/courses/lecture/${courseId}/${lectureId}`);
      return res.data;
    },
    // ✅ CRITICAL: Update the UI automatically
    onSuccess: () => {
      // This matches the key you use to fetch the course or progress data
      queryClient.invalidateQueries({ queryKey: ["courseProgress", courseId] });
      toast.success("Lecture completed!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update progress");
    }
  });

  return { markLecture, isPending, isError };
};