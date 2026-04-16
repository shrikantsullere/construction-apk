import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const LOCAL_URL = 'http://192.168.1.5:8080/api'; // Correct Laptop IP
// const PROD_URL = 'http://192.168.1.5:8080/api'; // Failover to local

const LOCAL_URL = 'http://192.168.1.4:8080/api';
const PROD_URL = 'https://constuctionbackend-production.up.railway.app/api';

const api = axios.create({
    baseURL: PROD_URL, 
    timeout: 60000, 
});

let inMemoryToken = null;

export const setAuthToken = (token) => {
    inMemoryToken = token;
};

// Add interceptor to include JWT token in requests
api.interceptors.request.use(
    async (config) => {
        // use memory token if available (faster), else fallback to AsyncStorage
        const token = inMemoryToken || await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (!inMemoryToken) inMemoryToken = token; // Sync memory
        } else {
            console.log(`DEBUG [api]: No token found for request to ${config.url}`);
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
            const token = inMemoryToken || await AsyncStorage.getItem('token');
            if (token) {
                console.warn(`Unauthorized access [${error.config?.url}] - Token invalid/expired - Clearing session`);
                inMemoryToken = null;
                await AsyncStorage.multiRemove(['token', 'user']);
            } else {
                console.log(`DEBUG [api]: 401 received for ${error.config?.url} but session already cleared.`);
            }
        }
        return Promise.reject(error);
    }
);

export const getServerUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = 'https://constuctionbackend-production.up.railway.app';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
