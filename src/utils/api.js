import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: 'https://construction-backend-production-b192.up.railway.app/api',
});

// Add interceptor to include JWT token in requests
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized access - Clearing session');
            await AsyncStorage.multiRemove(['token', 'user']);
        }
        return Promise.reject(error);
    }
);

export const getServerUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = 'https://construction-backend-production-b192.up.railway.app';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
