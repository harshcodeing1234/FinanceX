import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('financex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('financex_token');
      localStorage.removeItem('financex_user');
      // Let app context redirect to login
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  }
};

export const transactionService = {
  getAll: async (params) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/transactions', data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  }
};

export const categoryService = {
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  }
};

export const budgetService = {
  getAll: async (month, year) => {
    const res = await api.get('/budgets', { params: { month, year } });
    return res.data;
  },
  set: async (data) => {
    const res = await api.post('/budgets', data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/budgets/${id}`);
    return res.data;
  }
};

export const goalService = {
  getAll: async () => {
    const res = await api.get('/goals');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/goals', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/goals/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  }
};

export const analyticsService = {
  getDashboard: async () => {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  }
};

export const mlService = {
  getInsights: async () => {
    const res = await api.get('/ml/insights');
    return res.data;
  },
  predictSpending: async (data) => {
    const res = await api.post('/ml/predict-spending', data);
    return res.data;
  },
  predictBudgetRisk: async (data) => {
    const res = await api.post('/ml/predict-budget-risk', data);
    return res.data;
  },
  checkAnomaly: async (data) => {
    const res = await api.post('/ml/check-anomaly', data);
    return res.data;
  }
};
