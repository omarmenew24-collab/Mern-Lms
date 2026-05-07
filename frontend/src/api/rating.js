import { axiosInstance } from "../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetPublicCourse = (courseId) => {
  const fetchCourse = async () => {
    const res = await axiosInstance.get(`/courses/${courseId}/public`);
    return res.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-course", courseId],
    queryFn: fetchCourse,
    enabled: !!courseId,
  });

  return {
    course: data?.course ?? null,
    meta: data?.meta ?? null,
    isLoading,
    isError,
    error,
  };
};

export const useGetRatingSummary = (courseId) => {
  const fetchSummary = async () => {
    const res = await axiosInstance.get(`/courses/${courseId}/ratings/summary`);
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rating-summary", courseId],
    queryFn: fetchSummary,
    enabled: Boolean(courseId),
  });

  return {
    average: data?.average ?? 0,
    count: data?.count ?? 0,
    policy: {
      ratingsGloballyDisabled: Boolean(data?.policy?.ratingsGloballyDisabled),
      courseRatingsDisabled: Boolean(data?.policy?.courseRatingsDisabled),
    },
    isLoading,
    isError,
  };
};

export const useGetMyRating = (courseId, enabled = true) => {
  const fetchMine = async () => {
    const res = await axiosInstance.get(`/courses/${courseId}/ratings/me`);
    return res.data;
  };

  const { data, isLoading } = useQuery({
    queryKey: ["my-rating", courseId],
    queryFn: fetchMine,
    enabled: !!courseId && enabled,
  });

  return { myRating: data?.value ?? null, isLoading };
};

export const useUpsertRating = (courseId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (value) => {
      const res = await axiosInstance.post(`/courses/${courseId}/ratings`, {
        value,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rating-summary", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-rating", courseId] });
      toast.success("Thanks for your rating!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not save rating");
    },
  });

  return mutation;
};
