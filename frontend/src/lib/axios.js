import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://mern-lms-backend-ph6i.onrender.com/api" ,
  withCredentials: true,
});
