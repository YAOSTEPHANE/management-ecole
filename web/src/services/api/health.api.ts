import api from './client';

export const healthApi = {
  searchStudents: async (q: string) => {
    const r = await api.get('/health/students/search', { params: { q } });
    return r.data;
  },
  getDossier: async (studentId: string) => {
    const r = await api.get(`/health/students/${studentId}/dossier`);
    return r.data;
  },
  saveDossier: async (studentId: string, data: Record<string, unknown>) => {
    const r = await api.put(`/health/students/${studentId}/dossier`, data);
    return r.data;
  },
  addVaccination: async (studentId: string, data: Record<string, unknown>) => {
    const r = await api.post(`/health/students/${studentId}/vaccinations`, data);
    return r.data;
  },
  deleteVaccination: async (id: string) => api.delete(`/health/vaccinations/${id}`),
  addAllergy: async (studentId: string, data: Record<string, unknown>) => {
    const r = await api.post(`/health/students/${studentId}/allergies`, data);
    return r.data;
  },
  deleteAllergy: async (id: string) => api.delete(`/health/allergies/${id}`),
  addTreatment: async (studentId: string, data: Record<string, unknown>) => {
    const r = await api.post(`/health/students/${studentId}/treatments`, data);
    return r.data;
  },
  patchTreatment: async (id: string, data: Record<string, unknown>) => {
    const r = await api.patch(`/health/treatments/${id}`, data);
    return r.data;
  },
  listVisits: async (params?: { studentId?: string }) => {
    const r = await api.get('/health/visits', { params });
    return r.data;
  },
  createVisit: async (data: Record<string, unknown>) => {
    const r = await api.post('/health/visits', data);
    return r.data;
  },
  listCampaigns: async () => {
    const r = await api.get('/health/campaigns');
    return r.data;
  },
  createCampaign: async (data: Record<string, unknown>) => {
    const r = await api.post('/health/campaigns', data);
    return r.data;
  },
  patchCampaign: async (id: string, data: Record<string, unknown>) => {
    const r = await api.patch(`/health/campaigns/${id}`, data);
    return r.data;
  },
  listEmergencies: async () => {
    const r = await api.get('/health/emergencies');
    return r.data;
  },
  createEmergency: async (data: Record<string, unknown>) => {
    const r = await api.post('/health/emergencies', data);
    return r.data;
  },
  resolveEmergency: async (id: string, actionsTaken?: string) => {
    const r = await api.patch(`/health/emergencies/${id}/resolve`, { actionsTaken });
    return r.data;
  },
  getStatistics: async () => {
    const r = await api.get('/health/statistics');
    return r.data;
  },
};
