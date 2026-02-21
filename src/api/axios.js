import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, 
});


api.interceptors.response.use(
  (response) => response.data, // Return data directly from response
  (error) => {
    const message = error.response?.data?.message || error.message || "Error desconocido";
    return Promise.reject({ ...error, message });
  }
);

export default api;
