import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    // withCredentials must be true so the browser sends the JWT cookie on every request
    withCredentials: true,
});