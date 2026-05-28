import api from "../lib/axios";

export const registerSeller = (data) =>
    api.post('/auth/register', data);

export const verifyEmail = (data) =>
    api.post('/auth/verify-email', data);

export const loginSeller = (data) =>
    api.post('/auth/login', data);

export const refreshToken = () =>
    api.post('/auth/refresh');

export const logoutSeller = () =>
    api.post('/auth/logout');

export const forgotPassword = (data) =>
    api.post('/auth/forgot-password', data);

export const resetPassword = (data) =>
    api.post('/auth/reset-password', data);

export const getMe = () =>
    api.get('/auth/me');

export const selectRole = (data) =>
    api.post('/auth/role/select', data);

export const addRole = (data) =>
    api.post('/auth/role/add', data);
