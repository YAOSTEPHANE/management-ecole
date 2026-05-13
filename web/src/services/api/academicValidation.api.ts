import api from './client';

export type AcademicChangeRequestRow = {
  id: string;
  target: 'GRADE' | 'REPORT_CARD';
  kind: 'CREATE' | 'UPDATE' | 'DELETE';
  status: string;
  statusLabel: string;
  studentId: string;
  classId?: string | null;
  gradeId?: string | null;
  reportCardId?: string | null;
  payload: Record<string, unknown>;
  previousPayload?: Record<string, unknown> | null;
  requestedAt: string;
  student?: {
    user?: { firstName?: string; lastName?: string };
    class?: { name?: string; level?: string };
  } | null;
};

export const academicValidationApi = {
  getPending: async (): Promise<AcademicChangeRequestRow[]> => {
    const response = await api.get('/academic-validation/pending');
    return response.data;
  },
  getMyRequests: async (): Promise<AcademicChangeRequestRow[]> => {
    const response = await api.get('/academic-validation/my-requests');
    return response.data;
  },
  approve: async (id: string, note?: string) => {
    const response = await api.post(`/academic-validation/${id}/approve`, { note });
    return response.data;
  },
  reject: async (id: string, reason?: string) => {
    const response = await api.post(`/academic-validation/${id}/reject`, { reason });
    return response.data;
  },
};
