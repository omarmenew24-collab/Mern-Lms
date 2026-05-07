import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateLecture = (courseId) => {
  const queryClient = useQueryClient();

  const createLecture = async (data) => {
    const body = {
      title: data.title,
      description: data.description || "",
      contentType: data.contentType || "video",
      level: data.level,
      order: data.order ?? 0,
      duration: data.duration,
      videoUrl: data.videoUrl,
      isFreePreview: Boolean(data.isFreePreview),
    };
    if (data.vimeoVideoId) body.vimeoVideoId = data.vimeoVideoId;
    if (data.fileUrl !== undefined) body.fileUrl = data.fileUrl;
    if (data.fileName !== undefined) body.fileName = data.fileName;
    if (data.linkUrl !== undefined) body.linkUrl = data.linkUrl;
    if (data.linkLabel !== undefined) body.linkLabel = data.linkLabel;
    if (data.textContent !== undefined) body.textContent = data.textContent;
    if (data.attachments !== undefined) body.attachments = data.attachments;
    const res = await axiosInstance.post(`/course/${courseId}/createLecture`, body);
    return res.data;
  };

  const {
    mutateAsync: createMyLecture,
    isPending,
    isError,
  } = useMutation({
    mutationFn: createLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
      queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
      toast.success("Lecture created successfully!");
    },
  });

  return { createMyLecture, isPending, isError };
};

export const useUpdateLecture = (courseId) => {
  const queryClient = useQueryClient();

  const updateLecture = async ({ lectureId, ...data }) => {
    const body = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.description !== undefined) body.description = data.description;
    if (data.contentType !== undefined) body.contentType = data.contentType;
    if (data.level) body.level = data.level;
    if (data.order !== undefined) body.order = data.order;
    if (data.duration !== undefined) body.duration = data.duration;
    if (data.videoUrl) body.videoUrl = data.videoUrl;
    if (data.vimeoVideoId !== undefined) body.vimeoVideoId = data.vimeoVideoId;
    if (data.isFreePreview !== undefined) body.isFreePreview = data.isFreePreview;
    if (data.fileUrl !== undefined) body.fileUrl = data.fileUrl;
    if (data.fileName !== undefined) body.fileName = data.fileName;
    if (data.linkUrl !== undefined) body.linkUrl = data.linkUrl;
    if (data.linkLabel !== undefined) body.linkLabel = data.linkLabel;
    if (data.textContent !== undefined) body.textContent = data.textContent;
    if (data.attachments !== undefined) body.attachments = data.attachments;
    const res = await axiosInstance.patch(
      `/course/${courseId}/lecture/${lectureId}`,
      body,
    );
    return res.data;
  };

  const {
    mutateAsync: saveLecture,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
      queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
      toast.success("Lecture updated successfully!");
    },
  });

  return { saveLecture, isPending, isError };
};

/** Teacher/admin: is Vimeo TUS available on the server. */
export const getVimeoUploadStatus = async (courseId) => {
  const res = await axiosInstance.get(
    `/course/${courseId}/lectures/vimeo/upload-status`,
  );
  return res.data;
};

/** Create Vimeo placeholder; browser uploads file to `uploadLink` (TUS). */
export const initVimeoLectureUpload = async (courseId, { fileName, fileSize }) => {
  const res = await axiosInstance.post(
    `/course/${courseId}/lectures/vimeo/init-upload`,
    { fileName, fileSize },
  );
  return res.data;
};

export const useGetLecturesByCourse = (courseId) => {
  const getLecturesByCourse = async () => {
    const res = await axiosInstance.get(`/course/${courseId}/lectures`);
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
      `/courses/lecture/${courseId}/${lectureId}`,
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
      queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
      toast.success("Lecture deleted successfully!");
    },
  });

  return { deleteMyLecture, isPending, isError };
};

/** Silently update the `order` field on a lecture — no success toast to avoid noise during batch reorder. */
export const useReorderLecture = (courseId) => {
  const queryClient = useQueryClient();

  const { mutateAsync: reorderLecture } = useMutation({
    mutationFn: async ({ lectureId, order }) => {
      const res = await axiosInstance.patch(
        `/course/${courseId}/lecture/${lectureId}`,
        { order },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
      queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
    },
  });

  return { reorderLecture };
};

export const useMarkLecture = (courseId) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: markLecture,
    isPending,
    isError,
  } = useMutation({
    mutationFn: async (lectureId) => {
      const res = await axiosInstance.post(
        `/courses/lecture/${courseId}/${lectureId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courseprogress", courseId],
      });
      toast.success("Lecture completed!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update progress",
      );
    },
  });

  return { markLecture, isPending, isError };
};
