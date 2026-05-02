import axios from 'axios';

/**
 * Base URL sans slash final.
 * - Navigateur sur Vercel : même origine `/api` (ou NEXT_PUBLIC_API_URL).
 * - SSR / Node : URL absolue (VERCEL_URL + préfixe, ou localhost:5000 en dev).
 */
const API_URL = (() => {
  const n = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (n?.startsWith('http')) return n;
  if (typeof window !== 'undefined') {
    return n || (process.env.VERCEL ? '/api' : 'http://localhost:5000/api');
  }
  if (process.env.VERCEL_URL) {
    const path = n?.startsWith('/') ? n : '/api';
    return `https://${process.env.VERCEL_URL}${path}`;
  }
  if (n?.startsWith('/')) {
    return `http://localhost:5000${n}`;
  }
  return n || 'http://localhost:5000/api';
})();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger automatiquement si c'est une erreur de connexion
    // (serveur non démarré)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.warn('Serveur backend non disponible. Assurez-vous que le serveur est démarré.');
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Ne pas rediriger si on est déjà sur la page de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.token && response.data.user) {
        return response.data;
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error: any) {
      console.error('Erreur API login:', error);
      if (error.response) {
        throw error;
      } else {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le serveur est démarré.');
      }
    }
  },
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateMe: async (data: any) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

/** Formulaire public d'inscription et suivi de dossier (sans compte) */
export const publicApi = {
  submitAdmission: async (data: Record<string, unknown>) => {
    const response = await api.post('/public/admissions', data);
    return response.data;
  },
  trackAdmission: async (reference: string) => {
    const response = await api.get(
      `/public/admissions/track/${encodeURIComponent(reference.trim())}`
    );
    return response.data;
  },
};

export const adminApi = {
  getStudents: async () => {
    const response = await api.get('/admin/students');
    return response.data;
  },
  createStudent: async (data: any) => {
    const response = await api.post('/admin/students', data);
    return response.data;
  },
  getStudent: async (id: string) => {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },
  getStudentByNFC: async (nfcId: string) => {
    const response = await api.get(`/admin/students/nfc/${nfcId}`);
    return response.data;
  },
  getTeacherByNFC: async (nfcId: string) => {
    const response = await api.get(`/admin/teachers/nfc/${nfcId}`);
    return response.data;
  },
  recordTeacherNFCAttendance: async (data: { teacherId: string; date: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }) => {
    const response = await api.post('/admin/teachers/nfc-attendance', data);
    return response.data;
  },
  updateStudent: async (id: string, data: any) => {
    const response = await api.put(`/admin/students/${id}`, data);
    return response.data;
  },
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },
  getClasses: async () => {
    const response = await api.get('/admin/classes');
    return response.data;
  },
  createClass: async (data: any) => {
    const response = await api.post('/admin/classes', data);
    return response.data;
  },
  getTeachers: async () => {
    const response = await api.get('/admin/teachers');
    return response.data;
  },
  createTeacher: async (data: any) => {
    const response = await api.post('/admin/teachers', data);
    return response.data;
  },
  getTeacher: async (id: string) => {
    const response = await api.get(`/admin/teachers/${id}`);
    return response.data;
  },
  updateTeacher: async (id: string, data: any) => {
    const response = await api.put(`/admin/teachers/${id}`, data);
    return response.data;
  },
  deleteTeacher: async (id: string) => {
    const response = await api.delete(`/admin/teachers/${id}`);
    return response.data;
  },
  createTeacherPerformanceReview: async (
    teacherId: string,
    data: {
      periodLabel: string;
      academicYear: string;
      overallScore?: number | null;
      objectives?: string | null;
      achievements?: string | null;
      improvements?: string | null;
      reviewerName?: string | null;
    }
  ) => {
    const response = await api.post(`/admin/teachers/${teacherId}/performance-reviews`, data);
    return response.data;
  },
  updateTeacherLeaveStatus: async (
    teacherId: string,
    leaveId: string,
    data: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; adminComment?: string | null }
  ) => {
    const response = await api.patch(`/admin/teachers/${teacherId}/leaves/${leaveId}`, data);
    return response.data;
  },
  getTeacherPerformanceReviews: async (teacherId: string) => {
    const response = await api.get(`/admin/teachers/${teacherId}/performance-reviews`);
    return response.data;
  },
  getTeacherLeaves: async (teacherId: string) => {
    const response = await api.get(`/admin/teachers/${teacherId}/leaves`);
    return response.data;
  },
  /** Vue RH : tous les congés enseignants */
  getHrTeacherLeaves: async (params?: { status?: string }) => {
    const response = await api.get('/admin/hr/teacher-leaves', { params });
    return response.data;
  },
  /** Vue RH : toutes les fiches d’évaluation */
  getHrTeacherPerformanceReviews: async () => {
    const response = await api.get('/admin/hr/teacher-performance-reviews');
    return response.data;
  },
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  getAllGrades: async (params?: { studentId?: string; courseId?: string; classId?: string }) => {
    const response = await api.get('/admin/grades', { params });
    return response.data;
  },
  getAllAbsences: async (params?: { studentId?: string; courseId?: string; classId?: string; date?: string }) => {
    const response = await api.get('/admin/absences', { params });
    return response.data;
  },
  getAllAssignments: async (params?: { courseId?: string; classId?: string }) => {
    const response = await api.get('/admin/assignments', { params });
    return response.data;
  },
  getAllCourses: async (params?: { classId?: string }) => {
    const response = await api.get('/admin/courses', { params });
    return response.data;
  },
  getCourseById: async (courseId: string) => {
    const response = await api.get(`/admin/courses/${courseId}`);
    return response.data;
  },
  createCourse: async (data: {
    name: string;
    code: string;
    classId: string;
    teacherId: string;
    description?: string | null;
    weeklyHours?: number | null;
  }) => {
    const response = await api.post('/admin/courses', data);
    return response.data;
  },
  updateCourse: async (
    courseId: string,
    data: Partial<{
      name: string;
      code: string;
      classId: string;
      teacherId: string;
      description: string | null;
      weeklyHours: number | null;
    }>
  ) => {
    const response = await api.put(`/admin/courses/${courseId}`, data);
    return response.data;
  },
  deleteCourse: async (courseId: string) => {
    const response = await api.delete(`/admin/courses/${courseId}`);
    return response.data;
  },
  getSchoolCalendarEvents: async (params?: { academicYear?: string }) => {
    const response = await api.get('/admin/school-calendar-events', { params });
    return response.data;
  },
  createSchoolCalendarEvent: async (data: {
    title: string;
    description?: string | null;
    type?: 'HOLIDAY' | 'VACATION' | 'EXAM_PERIOD' | 'MEETING' | 'OTHER';
    startDate: string;
    endDate: string;
    academicYear: string;
    allDay?: boolean;
  }) => {
    const response = await api.post('/admin/school-calendar-events', data);
    return response.data;
  },
  updateSchoolCalendarEvent: async (
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      type: 'HOLIDAY' | 'VACATION' | 'EXAM_PERIOD' | 'MEETING' | 'OTHER';
      startDate: string;
      endDate: string;
      academicYear: string;
      allDay: boolean;
    }>
  ) => {
    const response = await api.put(`/admin/school-calendar-events/${id}`, data);
    return response.data;
  },
  deleteSchoolCalendarEvent: async (id: string) => {
    const response = await api.delete(`/admin/school-calendar-events/${id}`);
    return response.data;
  },
  takeAttendance: async (data: { courseId: string; date: string; attendance: Array<{ studentId: string; status: string; excused?: boolean; reason?: string }> }) => {
    const response = await api.post('/admin/absences/take-attendance', data);
    return response.data;
  },
  getCourseAbsences: async (courseId: string, date?: string) => {
    const response = await api.get('/admin/absences', { params: { courseId, date } });
    return response.data;
  },
  initAttendance: async (data: { courseId: string; date: string }) => {
    const response = await api.post('/admin/absences/init-attendance', data);
    return response.data;
  },
  recordNFCAttendance: async (data: { courseId: string; studentId: string; date: string; status?: 'PRESENT' | 'ABSENT' | 'LATE' }) => {
    const response = await api.post('/admin/absences/nfc-attendance', data);
    return response.data;
  },
  // Grades Management
  getGrade: async (id: string) => {
    const response = await api.get(`/admin/grades/${id}`);
    return response.data;
  },
  createGrade: async (data: any) => {
    const response = await api.post('/admin/grades', data);
    return response.data;
  },
  updateGrade: async (id: string, data: any) => {
    const response = await api.put(`/admin/grades/${id}`, data);
    return response.data;
  },
  deleteGrade: async (id: string) => {
    const response = await api.delete(`/admin/grades/${id}`);
    return response.data;
  },
  // Absences Management
  getAbsence: async (id: string) => {
    const response = await api.get(`/admin/absences/${id}`);
    return response.data;
  },
  createAbsence: async (data: any) => {
    const response = await api.post('/admin/absences', data);
    return response.data;
  },
  updateAbsence: async (id: string, data: any) => {
    const response = await api.put(`/admin/absences/${id}`, data);
    return response.data;
  },
  deleteAbsence: async (id: string) => {
    const response = await api.delete(`/admin/absences/${id}`);
    return response.data;
  },
  // Assignments Management
  getAssignment: async (id: string) => {
    const response = await api.get(`/admin/assignments/${id}`);
    return response.data;
  },
  createAssignment: async (data: any) => {
    const response = await api.post('/admin/assignments', data);
    return response.data;
  },
  updateAssignment: async (id: string, data: any) => {
    const response = await api.put(`/admin/assignments/${id}`, data);
    return response.data;
  },
  deleteAssignment: async (id: string) => {
    const response = await api.delete(`/admin/assignments/${id}`);
    return response.data;
  },
  getAllUsers: async (params?: { role?: string; isActive?: boolean }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  updateUserRole: async (userId: string, role: string) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  getRoleStats: async () => {
    const response = await api.get('/admin/roles/stats');
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  getLibraryBooks: async (params?: { search?: string; category?: string; isActive?: string }) => {
    const response = await api.get('/admin/library/books', { params });
    return response.data;
  },
  createLibraryBook: async (data: {
    isbn?: string | null;
    title: string;
    author: string;
    publisher?: string | null;
    publicationYear?: number | null;
    category?: string | null;
    description?: string | null;
    copiesTotal?: number;
    copiesAvailable?: number;
    shelfLocation?: string | null;
  }) => {
    const response = await api.post('/admin/library/books', data);
    return response.data;
  },
  updateLibraryBook: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/admin/library/books/${id}`, data);
    return response.data;
  },
  deleteLibraryBook: async (id: string) => {
    const response = await api.delete(`/admin/library/books/${id}`);
    return response.data;
  },
  getLibraryLoans: async (params?: { status?: 'ACTIVE' | 'RETURNED' }) => {
    const response = await api.get('/admin/library/loans', { params });
    return response.data;
  },
  createLibraryLoan: async (data: {
    bookId: string;
    borrowerId: string;
    dueDate: string;
    notes?: string | null;
  }) => {
    const response = await api.post('/admin/library/loans', data);
    return response.data;
  },
  returnLibraryLoan: async (loanId: string) => {
    const response = await api.patch(`/admin/library/loans/${loanId}/return`);
    return response.data;
  },
  getLibraryReservations: async (params?: { status?: string }) => {
    const response = await api.get('/admin/library/reservations', { params });
    return response.data;
  },
  createLibraryReservation: async (data: { bookId: string; userId: string }) => {
    const response = await api.post('/admin/library/reservations', data);
    return response.data;
  },
  updateLibraryReservation: async (
    id: string,
    data: { status: 'PENDING' | 'READY' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED' }
  ) => {
    const response = await api.patch(`/admin/library/reservations/${id}`, data);
    return response.data;
  },
  getLibraryPenalties: async (params?: { paid?: string }) => {
    const response = await api.get('/admin/library/penalties', { params });
    return response.data;
  },
  createLibraryPenalty: async (data: {
    loanId?: string | null;
    userId: string;
    amount: number;
    reason: string;
    notes?: string | null;
  }) => {
    const response = await api.post('/admin/library/penalties', data);
    return response.data;
  },
  updateLibraryPenalty: async (
    id: string,
    data: { paid?: boolean; waived?: boolean; notes?: string | null }
  ) => {
    const response = await api.patch(`/admin/library/penalties/${id}`, data);
    return response.data;
  },
  getMaterialRooms: async (params?: { search?: string; isActive?: string }) => {
    const response = await api.get('/admin/material/rooms', { params });
    return response.data;
  },
  createMaterialRoom: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/material/rooms', data);
    return response.data;
  },
  updateMaterialRoom: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/admin/material/rooms/${id}`, data);
    return response.data;
  },
  deleteMaterialRoom: async (id: string) => {
    const response = await api.delete(`/admin/material/rooms/${id}`);
    return response.data;
  },
  getMaterialEquipment: async (params?: {
    search?: string;
    category?: string;
    roomId?: string;
    isActive?: string;
  }) => {
    const response = await api.get('/admin/material/equipment', { params });
    return response.data;
  },
  createMaterialEquipment: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/material/equipment', data);
    return response.data;
  },
  updateMaterialEquipment: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/admin/material/equipment/${id}`, data);
    return response.data;
  },
  deleteMaterialEquipment: async (id: string) => {
    const response = await api.delete(`/admin/material/equipment/${id}`);
    return response.data;
  },
  getMaterialMaintenance: async (params?: { status?: string; equipmentId?: string; roomId?: string }) => {
    const response = await api.get('/admin/material/maintenance', { params });
    return response.data;
  },
  createMaterialMaintenance: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/material/maintenance', data);
    return response.data;
  },
  updateMaterialMaintenance: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/admin/material/maintenance/${id}`, data);
    return response.data;
  },
  getMaterialAllocations: async (params?: { status?: string; equipmentId?: string }) => {
    const response = await api.get('/admin/material/allocations', { params });
    return response.data;
  },
  createMaterialAllocation: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/material/allocations', data);
    return response.data;
  },
  updateMaterialAllocation: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/admin/material/allocations/${id}`, data);
    return response.data;
  },
  getReportsSummary: async () => {
    const response = await api.get('/admin/reports/summary');
    return response.data;
  },
  toggleUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/admin/security/users/${id}/status`, { isActive });
    return response.data;
  },
  getClassStats: async (classId: string) => {
    const response = await api.get('/admin/pedagogical/class-stats', { params: { classId } });
    return response.data;
  },
  getStudentProgress: async (studentId: string, period?: string) => {
    const response = await api.get(`/admin/pedagogical/student-progress/${studentId}`, {
      params: { period },
    });
    return response.data;
  },
  getCourseStats: async (params?: { courseId?: string; classId?: string }) => {
    const response = await api.get('/admin/pedagogical/course-stats', { params });
    return response.data;
  },
  getStudentsAtRisk: async (classId?: string) => {
    const response = await api.get('/admin/pedagogical/students-at-risk', {
      params: classId ? { classId } : {},
    });
    return response.data;
  },
  getMessages: async (params?: { userId?: string; unread?: boolean }) => {
    const response = await api.get('/admin/messages', { params });
    return response.data;
  },
  sendMessage: async (data: { 
    receiverId: string; 
    subject?: string; 
    content: string;
    category?: string;
    channels?: string[];
  }) => {
    const response = await api.post('/admin/messages', data);
    return response.data;
  },
  markMessageAsRead: async (messageId: string) => {
    const response = await api.put(`/admin/messages/${messageId}/read`);
    return response.data;
  },
  getAnnouncements: async (params?: { published?: boolean; targetRole?: string; targetClass?: string }) => {
    const response = await api.get('/admin/announcements', { params });
    return response.data;
  },
  createAnnouncement: async (data: any) => {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },
  publishAnnouncement: async (announcementId: string) => {
    const response = await api.put(`/admin/announcements/${announcementId}/publish`);
    return response.data;
  },
  getNotifications: async (params?: { userId?: string; unread?: boolean }) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },
  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.put(`/admin/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllNotificationsAsRead: async (userId?: string) => {
    const params = userId ? { userId } : {};
    const response = await api.put('/admin/notifications/read-all', {}, { params });
    return response.data;
  },
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/admin/notifications/${notificationId}`);
    return response.data;
  },
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/admin/messages/${messageId}`);
    return response.data;
  },
  updateAnnouncement: async (announcementId: string, data: any) => {
    const response = await api.put(`/admin/announcements/${announcementId}`, data);
    return response.data;
  },
  deleteAnnouncement: async (announcementId: string) => {
    const response = await api.delete(`/admin/announcements/${announcementId}`);
    return response.data;
  },
  getMessage: async (messageId: string) => {
    const response = await api.get(`/admin/messages/${messageId}`);
    return response.data;
  },
  getAnnouncement: async (announcementId: string) => {
    const response = await api.get(`/admin/announcements/${announcementId}`);
    return response.data;
  },
  getSchedules: async (params?: { classId?: string; courseId?: string }) => {
    const response = await api.get('/admin/schedules', { params });
    return response.data;
  },
  getSchedule: async (id: string) => {
    const response = await api.get(`/admin/schedules/${id}`);
    return response.data;
  },
  createSchedule: async (data: any) => {
    const response = await api.post('/admin/schedules', data);
    return response.data;
  },
  updateSchedule: async (id: string, data: any) => {
    const response = await api.put(`/admin/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id: string) => {
    const response = await api.delete(`/admin/schedules/${id}`);
    return response.data;
  },
  getLoginLogs: async (params?: { userId?: string; limit?: number }) => {
    const response = await api.get('/admin/security/login-logs', { params });
    return response.data;
  },
  getSecurityEvents: async (params?: { userId?: string; severity?: string; limit?: number }) => {
    const response = await api.get('/admin/security/events', { params });
    return response.data;
  },
  getSecurityStats: async () => {
    const response = await api.get('/admin/security/stats');
    return response.data;
  },
  changeUserPassword: async (userId: string, newPassword: string) => {
    const response = await api.put(`/admin/security/users/${userId}/password`, { newPassword });
    return response.data;
  },
  changeUserStatus: async (userId: string, isActive: boolean) => {
    const response = await api.put(`/admin/security/users/${userId}/status`, { isActive });
    return response.data;
  },
  // Report Cards
  generateReportCardData: async (params: { classId: string; period: string; academicYear: string }) => {
    const response = await api.get('/admin/report-cards/generate-data', { params });
    return response.data;
  },
  saveReportCards: async (data: { classId: string; period: string; academicYear: string }) => {
    const response = await api.post('/admin/report-cards/save', data);
    return response.data;
  },
  getReportCards: async (params?: { classId?: string; period?: string; academicYear?: string }) => {
    const response = await api.get('/admin/report-cards', { params });
    return response.data;
  },
  // Frais de scolarité
  getTuitionFees: async (params?: { studentId?: string; classId?: string; academicYear?: string; period?: string; isPaid?: boolean; grouped?: boolean }) => {
    const response = await api.get('/admin/tuition-fees', { params });
    return response.data;
  },
  getTuitionFeesGrouped: async (params?: { studentId?: string; classId?: string; academicYear?: string; period?: string; isPaid?: boolean }) => {
    const response = await api.get('/admin/tuition-fees', { params: { ...params, grouped: true } });
    return response.data;
  },
  createTuitionFee: async (data: { studentId: string; academicYear: string; period: string; amount: number; dueDate: string; description?: string }) => {
    const response = await api.post('/admin/tuition-fees', data);
    return response.data;
  },
  createTuitionFeesBulk: async (data: { classId?: string; studentIds?: string[]; academicYear: string; period: string; amount: number; dueDate: string; description?: string }) => {
    const response = await api.post('/admin/tuition-fees/bulk', data);
    return response.data;
  },
  updateTuitionFee: async (id: string, data: { academicYear?: string; period?: string; amount?: number; dueDate?: string; description?: string; isPaid?: boolean }) => {
    const response = await api.put(`/admin/tuition-fees/${id}`, data);
    return response.data;
  },
  deleteTuitionFee: async (id: string) => {
    const response = await api.delete(`/admin/tuition-fees/${id}`);
    return response.data;
  },
  createTestTuitionFees: async () => {
    const response = await api.post('/admin/tuition-fees/create-test');
    return response.data;
  },
  getPaymentsGrouped: async () => {
    const response = await api.get('/admin/payments/grouped');
    return response.data;
  },
  getPayments: async () => {
    const response = await api.get('/admin/payments');
    return response.data;
  },
  getEducators: async () => {
    const response = await api.get('/admin/educators');
    return response.data;
  },
  getEducator: async (id: string) => {
    const response = await api.get(`/admin/educators/${id}`);
    return response.data;
  },
  createEducator: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    employeeId: string;
    specialization: string;
    hireDate: string;
    contractType?: string;
    salary?: number;
  }) => {
    const response = await api.post('/admin/educators', data);
    return response.data;
  },
  updateEducator: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    specialization?: string;
    contractType?: string;
    salary?: number;
  }) => {
    const response = await api.put(`/admin/educators/${id}`, data);
    return response.data;
  },
  deleteEducator: async (id: string) => {
    const response = await api.delete(`/admin/educators/${id}`);
    return response.data;
  },
  getAdmissions: async (params?: { status?: string; academicYear?: string }) => {
    const response = await api.get('/admin/admissions', { params });
    return response.data;
  },
  getAdmissionStats: async () => {
    const response = await api.get('/admin/admissions/stats');
    return response.data;
  },
  getAdmission: async (id: string) => {
    const response = await api.get(`/admin/admissions/${id}`);
    return response.data;
  },
  updateAdmission: async (
    id: string,
    data: {
      status?: string;
      adminNotes?: string;
      proposedClassId?: string | null;
    }
  ) => {
    const response = await api.patch(`/admin/admissions/${id}`, data);
    return response.data;
  },
  enrollFromAdmission: async (
    id: string,
    data: {
      password: string;
      studentId?: string;
      classId?: string;
      address?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
      medicalInfo?: string;
    }
  ) => {
    const response = await api.post(`/admin/admissions/${id}/enroll`, data);
    return response.data;
  },
  getStudentIdentityDocuments: async (studentId: string) => {
    const response = await api.get(`/admin/students/${studentId}/identity-documents`);
    return response.data;
  },
  deleteStudentIdentityDocument: async (studentId: string, documentId: string) => {
    const response = await api.delete(
      `/admin/students/${studentId}/identity-documents/${documentId}`
    );
    return response.data;
  },
};

export const teacherApi = {
  getProfile: async () => {
    const response = await api.get('/teacher/profile');
    return response.data;
  },
  getSchedule: async () => {
    const response = await api.get('/teacher/schedule');
    return response.data;
  },
  getPerformanceReviews: async () => {
    const response = await api.get('/teacher/performance-reviews');
    return response.data;
  },
  getLeaves: async () => {
    const response = await api.get('/teacher/leaves');
    return response.data;
  },
  createLeave: async (data: {
    type: 'ANNUAL' | 'SICK' | 'PERSONAL' | 'TRAINING' | 'OTHER';
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    const response = await api.post('/teacher/leaves', data);
    return response.data;
  },
  getCourses: async () => {
    const response = await api.get('/teacher/courses');
    return response.data;
  },
  getStudentByNFC: async (nfcId: string) => {
    const response = await api.get(`/teacher/students/nfc/${nfcId}`);
    return response.data;
  },
  getCourseGrades: async (courseId: string) => {
    const response = await api.get(`/teacher/courses/${courseId}/grades`);
    return response.data;
  },
  createGrade: async (data: any) => {
    const response = await api.post('/teacher/grades', data);
    return response.data;
  },
  updateGrade: async (id: string, data: any) => {
    const response = await api.put(`/teacher/grades/${id}`, data);
    return response.data;
  },
  deleteGrade: async (id: string) => {
    const response = await api.delete(`/teacher/grades/${id}`);
    return response.data;
  },
  takeAttendance: async (data: any) => {
    const response = await api.post('/teacher/absences/take-attendance', data);
    return response.data;
  },
  initAttendance: async (data: { courseId: string; date: string }) => {
    const response = await api.post('/teacher/absences/init-attendance', data);
    return response.data;
  },
  recordNFCAttendance: async (data: { courseId: string; studentId: string; date: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }) => {
    const response = await api.post('/teacher/absences/nfc-attendance', data);
    return response.data;
  },
  getCourseAbsences: async (courseId: string, date?: string) => {
    const response = await api.get(`/teacher/courses/${courseId}/absences`, {
      params: { date },
    });
    return response.data;
  },
  createAssignment: async (data: any) => {
    const response = await api.post('/teacher/assignments', data);
    return response.data;
  },
  getCourseAssignments: async (courseId: string) => {
    const response = await api.get(`/teacher/courses/${courseId}/assignments`);
    return response.data;
  },
  // Conduite (Professeur Principal)
  getConduct: async (params?: { period?: string; academicYear?: string }) => {
    const response = await api.get('/teacher/conduct', { params });
    return response.data;
  },
  createConduct: async (data: any) => {
    const response = await api.post('/teacher/conduct', data);
    return response.data;
  },
  updateConduct: async (id: string, data: any) => {
    const response = await api.put(`/teacher/conduct/${id}`, data);
    return response.data;
  },
};

export const studentApi = {
  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },
  updateProfile: async (data: {
    address?: string | null;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
    medicalInfo?: string | null;
  }) => {
    const response = await api.put('/student/profile', data);
    return response.data;
  },
  getGrades: async () => {
    const response = await api.get('/student/grades');
    return response.data;
  },
  getSchedule: async () => {
    const response = await api.get('/student/schedule');
    return response.data;
  },
  getAbsences: async () => {
    const response = await api.get('/student/absences');
    return response.data;
  },
  getAssignments: async () => {
    const response = await api.get('/student/assignments');
    return response.data;
  },
  submitAssignment: async (assignmentId: string, fileUrl: string) => {
    const response = await api.post(`/student/assignments/${assignmentId}/submit`, {
      fileUrl,
    });
    return response.data;
  },
  getMessages: async (params?: { unread?: boolean }) => {
    const response = await api.get('/student/messages', { params });
    return response.data;
  },
  sendSchoolMessage: async (data: {
    subject?: string;
    content: string;
    category?: string;
  }) => {
    const response = await api.post('/student/messages', data);
    return response.data;
  },
  markMessageAsRead: async (messageId: string) => {
    const response = await api.put(`/student/messages/${messageId}/read`);
    return response.data;
  },
  getAnnouncements: async () => {
    const response = await api.get('/student/announcements');
    return response.data;
  },
  getReportCards: async (params?: { period?: string; academicYear?: string }) => {
    const response = await api.get('/student/report-cards', { params });
    return response.data;
  },
  getConduct: async (params?: { period?: string; academicYear?: string }) => {
    const response = await api.get('/student/conduct', { params });
    return response.data;
  },
  getAcademicHistory: async () => {
    const response = await api.get('/student/academic-history');
    return response.data;
  },
  getIdentityDocuments: async () => {
    const response = await api.get('/student/identity-documents');
    return response.data;
  },
  deleteIdentityDocument: async (documentId: string) => {
    const response = await api.delete(`/student/identity-documents/${documentId}`);
    return response.data;
  },
  justifyAbsence: async (absenceId: string, documentUrl: string, reason?: string) => {
    const response = await api.put(`/student/absences/${absenceId}/justify`, {
      documentUrl,
      reason,
    });
    return response.data;
  },
  getTuitionFees: async () => {
    const response = await api.get('/student/tuition-fees');
    return response.data;
  },
  createPayment: async (tuitionFeeId: string, paymentMethod: string, amount: number, phoneNumber?: string, operator?: string, transactionCode?: string) => {
    const response = await api.post('/student/payments', {
      tuitionFeeId,
      paymentMethod,
      amount,
      phoneNumber,
      operator,
      transactionCode,
    });
    return response.data;
  },
  confirmPayment: async (paymentId: string, transactionId?: string) => {
    const response = await api.post(`/student/payments/${paymentId}/confirm`, {
      transactionId,
    });
    return response.data;
  },
  getPayments: async () => {
    const response = await api.get('/student/payments');
    return response.data;
  },
};

export const parentApi = {
  getChildren: async () => {
    const response = await api.get('/parent/children');
    return response.data;
  },
  getChildTuitionFees: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/tuition-fees`);
    return response.data;
  },
  createPayment: async (studentId: string, tuitionFeeId: string, paymentMethod: string, amount: number, phoneNumber?: string, operator?: string, transactionCode?: string) => {
    const response = await api.post(`/parent/children/${studentId}/payments`, {
      tuitionFeeId,
      paymentMethod,
      amount,
      phoneNumber,
      operator,
      transactionCode,
    });
    return response.data;
  },
  confirmPayment: async (studentId: string, paymentId: string, transactionId?: string) => {
    const response = await api.post(`/parent/children/${studentId}/payments/${paymentId}/confirm`, {
      transactionId,
    });
    return response.data;
  },
  getChildPayments: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/payments`);
    return response.data;
  },
  getChildGrades: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/grades`);
    return response.data;
  },
  getChildAbsences: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/absences`);
    return response.data;
  },
  getChildSchedule: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/schedule`);
    return response.data;
  },
  getChildAssignments: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/assignments`);
    return response.data;
  },
  getChildReportCards: async (studentId: string) => {
    const response = await api.get(`/parent/children/${studentId}/report-cards`);
    return response.data;
  },
  getChildConduct: async (studentId: string, params?: { period?: string; academicYear?: string }) => {
    const response = await api.get(`/parent/children/${studentId}/conduct`, { params });
    return response.data;
  },
  getMessages: async (params?: { unread?: boolean }) => {
    const response = await api.get('/parent/messages', { params });
    return response.data;
  },
  sendSchoolMessage: async (data: {
    subject?: string;
    content: string;
    category?: string;
    studentId?: string;
  }) => {
    const response = await api.post('/parent/messages', data);
    return response.data;
  },
  markMessageAsRead: async (messageId: string) => {
    const response = await api.put(`/parent/messages/${messageId}/read`);
    return response.data;
  },
};

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
};

/** Upload multipart : pièce d'identité (champ fichier `identityDocument`, champs `type`, `label?`, `notes?`, `studentId?` si admin) */
export const uploadIdentityDocument = async (formData: FormData) => {
  const response = await api.post('/upload/identity-document', formData);
  return response.data;
};

export default api;

