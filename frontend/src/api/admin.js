import { axiosInstance } from "../lib/axios";
import { useQuery , useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const UseGetDashboardStats = () => {
    const getdashboardstats = async () => {
      const res = await axiosInstance.get("/dashboardstats");
      return res.data;
    };

    const {data: dashboardstats , isLoading, isError} = useQuery({
      queryKey: ["dashboardstats"],
      queryFn: getdashboardstats,
      refetchInterval: 60_000,
    });

    return {dashboardstats , isLoading, isError}
  
    
}

export const UseGetAllUsers = () => {
    const getallusers = async () => {
      const res = await axiosInstance.get("/users");
      return res.data;
    };
    const {data: allusers , isLoading, isError} = useQuery({
      queryKey: ["allusers"],
      queryFn: getallusers,
    });

    return {allusers , isLoading, isError}
}

export const useGetDashboardAnalytics = (months = 6) => {
  const fetchAnalytics = async () => {
    const res = await axiosInstance.get("/dashboard-analytics", {
      params: { months },
    });
    return res.data;
  };

  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ["dashboard-analytics", months],
    queryFn: fetchAnalytics,
  });

  return { analytics, isLoading, isError };
};

export const useGetFinanceOverview = (months = 12, limit = 10) => {
  const fetchOverview = async () => {
    const res = await axiosInstance.get("/finance-overview", {
      params: { months, limit },
    });
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["finance-overview", months, limit],
    queryFn: fetchOverview,
  });

  return {
    financeOverview: data,
    isLoading,
    isError,
  };
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  const deleteUser = async (id) => {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  };

  const { mutateAsync: deleteMyUser, isPending } = useMutation({
    mutationFn: deleteUser,

    onSuccess: () => {
      toast.success("User deleted successfully!");

      // 🔥 Refetch users automatically
      queryClient.invalidateQueries({ queryKey: ["allusers"] });
    },

    onError: () => {
      toast.error("Something went wrong while deleting the user.");
    },
  });

  return { deleteMyUser, isPending };
};



export const useGetSiteSettings = () => {
  const fetchSettings = async () => {
    const res = await axiosInstance.get("/site-settings");
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSettings,
  });

  return {
    siteSettings: data,
    isLoading,
    isError,
  };
};

export const usePatchSiteSettings = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (body) => {
      const res = await axiosInstance.patch("/site-settings", body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
      queryClient.invalidateQueries({ queryKey: ["course-comments"] });
      queryClient.invalidateQueries({ queryKey: ["public-home-announcement"] });
      queryClient.invalidateQueries({ queryKey: ["public-about"] });
      queryClient.invalidateQueries({ queryKey: ["public-why-learn"] });
      queryClient.invalidateQueries({ queryKey: ["public-money-back-guarantee"] });
      queryClient.invalidateQueries({ queryKey: ["public-refund-policy"] });
      queryClient.invalidateQueries({ queryKey: ["refund-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-branding"] });
      toast.success("Site settings updated");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update settings");
    },
  });

  return { patchSiteSettings: mutateAsync, isPending };
};

export const usePublicSiteBranding = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-site-branding"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/site-branding");
      return res.data;
    },
    staleTime: 60_000,
  });
  return {
    branding: data,
    isLoading,
    isError,
  };
};

/** Public — home page trust / stats strip (no auth). */
export const usePublicPlatformStats = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-platform-stats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/platform-stats");
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
  return { stats: data, isLoading, isError };
};

/** No auth — home page banner copy. */
/** No auth — public About page. */
export const usePublicAbout = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-about"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/about");
      return res.data;
    },
    staleTime: 60_000,
  });
  return {
    title: data?.title ?? "",
    useBlocks: data?.useBlocks === true,
    blocks: data?.blocks ?? null,
    body: data?.body ?? null,
    updatedAt: data?.updatedAt ?? null,
    isLoading,
    isError,
  };
};

export const usePublicHomeAnnouncement = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-home-announcement"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/home-announcement");
      return res.data;
    },
    staleTime: 60_000,
  });
  return {
    text: data?.text ?? "",
    updatedAt: data?.updatedAt ?? null,
    isLoading,
    isError,
  };
};

/** No auth — home "Why learn" section. */
export const usePublicWhyLearn = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-why-learn"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/why-learn");
      return res.data;
    },
    staleTime: 60_000,
  });
  return {
    title: data?.title ?? "",
    titleHighlight: data?.titleHighlight ?? "",
    subtitle: data?.subtitle ?? "",
    cards: data?.cards ?? [],
    updatedAt: data?.updatedAt ?? null,
    isLoading,
    isError,
  };
};

/** No auth — course sidebar trust copy (admin-configured). */
export const usePublicMoneyBackGuarantee = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-money-back-guarantee"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/money-back-guarantee");
      return res.data;
    },
    staleTime: 60_000,
  });
  return {
    enabled: data?.enabled === true,
    title: data?.title ?? "",
    body: data?.body ?? "",
    linkUrl: data?.linkUrl ?? null,
    updatedAt: data?.updatedAt ?? null,
    isLoading,
    isError,
  };
};

export const UseGetUserById = (userId) => {
    const getuserbyid = async() => {
        const res = await axiosInstance.get(`/users/${userId}`)
        return res.data.user
        } 
    
    
    const {data: userbyid , isLoading, isError} = useQuery({
        queryKey: ["userbyid",userId],
        queryFn: getuserbyid,
    })
    return {userbyid , isLoading, isError}

}

