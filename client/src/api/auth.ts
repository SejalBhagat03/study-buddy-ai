import api from './index';

// Register user
export const register = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data.data; // Return inner data object
};

// Login user
export const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data.data; // Return inner data object
};

export default {
    register,
    login
};
