import { axiosInstance } from "../lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useListCourseComments = (courseId, limit = 30) => {
  const fetchComments = async () => {
    const res = await axiosInstance.get(`/courses/${courseId}/comments`, {
      params: { limit },
    });
    return res.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["course-comments", courseId, limit],
    queryFn: fetchComments,
    enabled: Boolean(courseId),
  });

  return {
    comments: data?.comments ?? [],
    nextCursor: data?.nextCursor ?? null,
    commentPolicy: data?.commentPolicy ?? null,
    isLoading,
    isError,
    error,
  };
};

export const useCreateCourseComment = (courseId) => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload) => {
      const { content, parentComment } =
        typeof payload === "string"
          ? { content: payload, parentComment: undefined }
          : payload;
      const res = await axiosInstance.post(`/courses/${courseId}/comments`, {
        content,
        ...(parentComment ? { parentComment } : {}),
      });
      return res.data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-comments", courseId] });
      toast.success("Comment posted");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to post comment");
    },
  });

  return { createComment: mutateAsync, isPending };
};

export const useDeleteCourseComment = (courseId) => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (commentId) => {
      const res = await axiosInstance.delete(
        `/courses/${courseId}/comments/${commentId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-comments", courseId] });
      toast.success("Comment deleted");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    },
  });

  return { deleteComment: mutateAsync, isPending };
};

