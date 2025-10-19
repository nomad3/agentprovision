import axios from 'axios';

const API_URL = '/api/v1/auth/';

const login = async (email, password) => {
  const response = await axios.post(API_URL + 'login', new URLSearchParams({
    username: email,
    password,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const register = async (email, password, fullName, tenantName) => {
  const response = await axios.post(API_URL + 'register', {
    user_in: {
      email,
      password,
      full_name: fullName,
    },
    tenant_in: {
      name: tenantName,
    },
  });
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
};

export default authService;