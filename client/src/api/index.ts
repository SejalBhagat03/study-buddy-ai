import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://study-buddy-ai-s5ns.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors centrally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Import toast dynamically or use imported if available
        import('sonner').then(({ toast }) => {
            const message = error.response?.data?.message || error.message || 'Something went wrong';

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Session expired. Please login again.');
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 1000);
            } else {
                toast.error(message);
            }
        }).catch(err => console.error("Toast failed", err));

        return Promise.reject(error);
    }
);

export default api;

