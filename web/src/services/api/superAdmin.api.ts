import api from './client';

export type SuperAdminOverview = {
  counts: {
    usersTotal: number;
    usersActive: number;
    students: number;
    teachers: number;
    parents: number;
    admins: number;
    superAdmins: number;
    classes: number;
    courses: number;
    tuitionOpen: number;
  };
  usersByRole: { role: string; count: number }[];
  recentUsers: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }[];
  branding: Record<string, unknown> | null;
  metrics: unknown;
};

export const superAdminApi = {
  getOverview: async () => {
    const response = await api.get('/super-admin/overview');
    return response.data as SuperAdminOverview;
  },
  getUsers: async (params?: { q?: string; role?: string; limit?: number }) => {
    const response = await api.get('/super-admin/users', { params });
    return response.data as {
      users: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        phone: string | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }[];
    };
  },
  createUser: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  }) => {
    const response = await api.post('/super-admin/users', data);
    return response.data;
  },
  updateUser: async (
    id: string,
    data: Partial<{ role: string; isActive: boolean; firstName: string; lastName: string }>,
  ) => {
    const response = await api.patch(`/super-admin/users/${id}`, data);
    return response.data;
  },
  runBackup: async () => {
    const response = await api.post('/super-admin/backup');
    return response.data;
  },
};
