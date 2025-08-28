import axios from 'axios';

const api = axios.create({
    // متغیر VITE_API_URL از فایل .env خوانده می‌شود
    baseURL: import.meta.env.VITE_API_URL, 
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;