import { use } from "react";
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

export const useChangeUserRole = () => {
  const queryClient = useQueryClient();

  const changeRole = async ({ id, role }) => {
    const res = await axiosInstance.patch(`/users/${id}/role`, { role });
    return res.data;
  };

  const { mutateAsync: changeUserRoleMutate, isPending } = useMutation({
    mutationFn: changeRole,

    onSuccess: () => {
      toast.success("Role updated successfully!");

      // 🔥 Refetch users
      queryClient.invalidateQueries({ queryKey: ["allusers"] });
    },

    onError: () => {
      toast.error("Failed to update role");
    },
  });

  return { changeUserRoleMutate, isPending };
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

