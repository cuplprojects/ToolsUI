
// Import axios library for making HTTP requests
import axios from 'axios';

// Set the base URL for the API
const API_BASE_URL = import.meta.env.VITE_API_URL; // Base URL from Vite env or fallback

// Create an Axios instance
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Use localStorage instead of sessionStorage

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific HTTP errors
      switch (error.response.status) {
        case 401:
          // Unauthorized: Clear token and redirect to login
          localStorage.removeItem('token');
          // Implement redirect to login page here
          break;
        case 403:
          // Forbidden: Handle access denied
          console.error('Access denied');
          break;
        // Add more cases as needed
      }
    }
    return Promise.reject(error);
  }
);

export default API;
