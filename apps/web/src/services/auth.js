import axios from 'axios';

const API_URL = 'http://localhost:8001/api/v1/auth/';

const login = async (email, password) => {
  const response = await axios.post(API_URL + 'login', {
    username: email,
    password,
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
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
  logout,
  getCurrentUser,
};

export default authService;
