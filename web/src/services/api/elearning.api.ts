import api from './client';

export type ElearningLessonKind =
  | 'VIDEO'
  | 'DOCUMENT'
  | 'EXERCISE'
  | 'QUIZ'
  | 'EXTERNAL_LINK'
  | 'HOMEWORK';

export type PedagogicalResourceKind =
  | 'DOCUMENT'
  | 'VIDEO'
  | 'AUDIO'
  | 'IMAGE'
  | 'EXTERNAL_LINK'
  | 'MULTIMEDIA';

export const elearningApi = {
  listCourses: async () => {
    const res = await api.get('/elearning/courses');
    return res.data;
  },
  getCourse: async (id: string) => {
    const res = await api.get(`/elearning/courses/${id}`);
    return res.data;
  },
  createCourse: async (data: Record<string, unknown>) => {
    const res = await api.post('/elearning/courses', data);
    return res.data;
  },
  updateCourse: async (id: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/elearning/courses/${id}`, data);
    return res.data;
  },
  deleteCourse: async (id: string) => {
    const res = await api.delete(`/elearning/courses/${id}`);
    return res.data;
  },
  createLesson: async (courseId: string, data: Record<string, unknown>) => {
    const res = await api.post(`/elearning/courses/${courseId}/lessons`, data);
    return res.data;
  },
  updateLesson: async (id: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/elearning/lessons/${id}`, data);
    return res.data;
  },
  deleteLesson: async (id: string) => {
    const res = await api.delete(`/elearning/lessons/${id}`);
    return res.data;
  },
  submitQuizAttempt: async (quizId: string, answers: Record<string, string>) => {
    const res = await api.post(`/elearning/quizzes/${quizId}/attempt`, { answers });
    return res.data;
  },
  completeLesson: async (lessonId: string) => {
    const res = await api.post(`/elearning/lessons/${lessonId}/complete`);
    return res.data;
  },
  listQuizAttempts: async (quizId: string) => {
    const res = await api.get(`/elearning/quizzes/${quizId}/attempts`);
    return res.data;
  },
  listResourceBank: async (params?: { subject?: string; level?: string; q?: string }) => {
    const res = await api.get('/elearning/resource-bank', { params });
    return res.data;
  },
  createResource: async (data: Record<string, unknown>) => {
    const res = await api.post('/elearning/resource-bank', data);
    return res.data;
  },
  updateResource: async (id: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/elearning/resource-bank/${id}`, data);
    return res.data;
  },
  deleteResource: async (id: string) => {
    const res = await api.delete(`/elearning/resource-bank/${id}`);
    return res.data;
  },
  listVirtualSessions: async () => {
    const res = await api.get('/elearning/virtual-sessions');
    return res.data;
  },
  createVirtualSession: async (data: Record<string, unknown>) => {
    const res = await api.post('/elearning/virtual-sessions', data);
    return res.data;
  },
  updateVirtualSession: async (id: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/elearning/virtual-sessions/${id}`, data);
    return res.data;
  },
  deleteVirtualSession: async (id: string) => {
    const res = await api.delete(`/elearning/virtual-sessions/${id}`);
    return res.data;
  },
};

export async function uploadElearningFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('elearning', file);
  const res = await api.post('/upload/elearning', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url as string;
}
