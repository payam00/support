import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // --- ADDED FOR PUBLIC ROUTES ---
        // For public routes, we don't want to throw an error if there's no token
        // The endpoint itself will handle authorization if needed.
        // We only add the token if it exists.
        // ---------------------------------
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- NEW API FUNCTIONS ---

// ClassTypes API
export const getClassTypes = () => api.get('/classtypes');
export const createClassType = (data: any) => api.post('/classtypes', data);
export const updateClassType = (id: string, data: any) => api.put(`/classtypes/${id}`, data);

// Invoices API
export const createInvoice = (data: any) => api.post('/invoices', data);
export const getInvoices = () => api.get('/invoices');

// Public Invoice API - notice it doesn't need auth
export const getPublicInvoice = (token: string) => api.get(`/invoices/public/${token}`);
export const acceptInvoice = (token: string) => api.post(`/invoices/public/${token}/accept`);

// -------------------------

export default api;