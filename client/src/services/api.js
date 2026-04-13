import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('smartpark_token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

export const getAllSlots = (startTime, endTime, vehicleType) =>
    API.get('/slots', { params: { startTime, endTime, vehicleType } });
export const recommendSlot = (startTime, endTime, vehicleType) =>
    API.get('/slots/recommend', { params: { startTime, endTime, vehicleType } });
export const addSlot = (data) => API.post('/slots', data);
export const deleteSlot = (id) => API.delete(`/slots/${id}`);

export const createBooking = (data) => API.post('/bookings', data);
export const getMyBookings = () => API.get('/bookings/my');
export const cancelBooking = (id) => API.put(`/bookings/cancel/${id}`);
export const getReceipt = (id) => API.get(`/bookings/receipt/${id}`);
export const getAllBookings = () => API.get('/bookings/all');
export const deleteBooking = (id) => API.delete(`/bookings/${id}`);
export const getAnalytics = () => API.get('/bookings/analytics');

// Public — no auth needed
export const getPublicBooking = (id) =>
    axios.get(`${BASE_URL}/bookings/public/${id}`);