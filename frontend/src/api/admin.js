import { use } from "react";
import { axiosInstance } from "../lib/axios";
import { useQuery } from "@tanstack/react-query";

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