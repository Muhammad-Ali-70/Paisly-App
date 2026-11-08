import apiClient from './apiClient';

export const signupApi = async ({ name, email, password }) => {
  const response = await apiClient.post('/auth/signup', {
    name,
    email,
    password,
  });
  return response.data;
};

export const loginApi = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

// Returns { token, user, isNewUser }
export const googleAuthApi = async ({ idToken }) => {
  const response = await apiClient.post('/auth/google', { idToken });
  return response.data;
};

export const getMeApi = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const forgotPasswordApi = async ({ email }) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyOtpApi = async ({ email, otp }) => {
  const response = await apiClient.post('/auth/verify-otp', { email, otp });
  return response.data;
  // returns { message, resetToken }
};

export const resetPasswordApi = async ({ resetToken, newPassword }) => {
  const response = await apiClient.post('/auth/reset-password', {
    resetToken,
    newPassword,
  });
  return response.data;
};

export const verifySignupOtpApi = async ({ email, otp }) => {
  const response = await apiClient.post('/auth/verify-signup-otp', {
    email,
    otp,
  });
  return response.data;
};

export const resendSignupOtpApi = async ({ email }) => {
  const response = await apiClient.post('/auth/resend-signup-otp', { email });
  return response.data;
};

export const getProfileApi = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

export const updateProfileApi = async ({ name, phoneNumber }) => {
  const response = await apiClient.put('/users/profile', { name, phoneNumber });
  return response.data;
};

export const uploadAvatarApi = async (imageUri) => {
  const formData = new FormData();
  formData.append('avatar', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  });
  const response = await apiClient.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Pass `password`, or `idToken` from a fresh Google sign-in for Google-only accounts.
export const deleteAccountApi = async ({ password, idToken }) => {
  const response = await apiClient.delete('/users/me', {
    data: { password, idToken },
  });
  return response.data;
};

export const healthCheckApi = async () => {
  const baseURL = apiClient.defaults.baseURL.replace('/api', '');
  const response = await apiClient.get('/health', {
    baseURL,
    timeout: 5000,
  });
  return response.data;
};
