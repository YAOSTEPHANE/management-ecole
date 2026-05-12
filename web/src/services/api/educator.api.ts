import api from './client';

export const educatorApi = {
  getProfile: async () => {
    const response = await api.get('/educator/profile');
    return response.data;
  },
  updateProfile: async (data: { phone?: string; avatar?: string }) => {
    const response = await api.put('/educator/profile', data);
    return response.data;
  },
  getStudents: async () => {
    const response = await api.get('/educator/students');
    return response.data;
  },
  getStudent: async (studentId: string) => {
    const response = await api.get(`/educator/students/${studentId}`);
    return response.data;
  },
  getConducts: async (params?: { studentId?: string; period?: string; academicYear?: string }) => {
    const response = await api.get('/educator/conducts', { params });
    return response.data;
  },
  getConduct: async (conductId: string) => {
    const response = await api.get(`/educator/conducts/${conductId}`);
    return response.data;
  },
  createConduct: async (data: {
    studentId: string;
    period: string;
    academicYear: string;
    punctuality: number;
    respect: number;
    participation: number;
    behavior: number;
    comments?: string;
  }) => {
    const response = await api.post('/educator/conducts', data);
    return response.data;
  },
  updateConduct: async (conductId: string, data: {
    punctuality?: number;
    respect?: number;
    participation?: number;
    behavior?: number;
    comments?: string;
  }) => {
    const response = await api.put(`/educator/conducts/${conductId}`, data);
    return response.data;
  },
  deleteConduct: async (conductId: string) => {
    const response = await api.delete(`/educator/conducts/${conductId}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/educator/stats');
    return response.data;
  },
  getNotifications: async () => {
    const response = await api.get('/educator/notifications');
    return response.data;
  },
  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.put(`/educator/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllNotificationsAsRead: async () => {
    const response = await api.put('/educator/notifications/read-all');
    return response.data;
  },
};
