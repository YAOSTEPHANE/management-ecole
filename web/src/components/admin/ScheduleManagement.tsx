import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import FilterDropdown from '../ui/FilterDropdown';
import SearchBar from '../ui/SearchBar';
import ScheduleDetailsModal from './ScheduleDetailsModal';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiClock,
  FiBook,
  FiUsers,
  FiMapPin,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
  FiEye,
  FiDownload,
  FiFileText,
  FiSearch,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const ScheduleManagement = () => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
    classId: '',
    courseId: '',
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '09:00',
    room: '',
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-schedules', selectedClass],
    queryFn: () => adminApi.getSchedules(selectedClass !== 'all' ? { classId: selectedClass } : {}),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminApi.getAllCourses(),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: adminApi.getTeachers,
  });

  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: adminApi.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success('Emploi du temps créé avec succès');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success('Emploi du temps mis à jour avec succès');
      setIsModalOpen(false);
      setEditingSchedule(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: adminApi.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success('Emploi du temps supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const resetForm = () => {
    setScheduleForm({
      classId: '',
      courseId: '',
      dayOfWeek: '1',
      startTime: '08:00',
      endTime: '09:00',
      room: '',
    });
  };

  const handleSubmit = () => {
    if (!scheduleForm.classId || !scheduleForm.courseId) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: scheduleForm });
    } else {
      createScheduleMutation.mutate(scheduleForm);
    }
  };

  const handleView = (schedule: any) => {
    setSelectedScheduleId(schedule.id);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      classId: schedule.classId,
      courseId: schedule.courseId,
      dayOfWeek: schedule.dayOfWeek.toString(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room || '',
    });
    setIsModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  // Obtenir toutes les salles uniques
  const uniqueRooms: string[] = Array.from(
    new Set((schedules || []).map((s: any) => s.room).filter(Boolean) as string[]),
  ).sort();

  // Filtrer les emplois du temps
  let filteredSchedulesList = schedules || [];

  // Filtre par classe
  if (selectedClass !== 'all') {
    filteredSchedulesList = filteredSchedulesList.filter(
      (s: any) => s.classId === selectedClass
    );
  }

  // Filtre par enseignant
  if (selectedTeacher !== 'all') {
    filteredSchedulesList = filteredSchedulesList.filter(
      (s: any) => s.course?.teacher?.id === selectedTeacher
    );
  }

  // Filtre par salle
  if (selectedRoom !== 'all') {
    filteredSchedulesList = filteredSchedulesList.filter(
      (s: any) => s.room === selectedRoom
    );
  }

  // Filtre par recherche
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredSchedulesList = filteredSchedulesList.filter(
      (s: any) =>
        s.course?.name?.toLowerCase().includes(query) ||
        s.class?.name?.toLowerCase().includes(query) ||
        s.course?.teacher?.user?.firstName?.toLowerCase().includes(query) ||
        s.course?.teacher?.user?.lastName?.toLowerCase().includes(query) ||
        s.room?.toLowerCase().includes(query)
    );
  }

  // Organiser les horaires par jour et classe
  const organizedSchedules = filteredSchedulesList.reduce((acc: any, schedule: any) => {
    const dayKey = schedule.dayOfWeek;
    const classKey = schedule.class?.name || 'Autre';

    if (!acc[classKey]) {
      acc[classKey] = {};
    }
    if (!acc[classKey][dayKey]) {
      acc[classKey][dayKey] = [];
    }
    acc[classKey][dayKey].push(schedule);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white transform-gpu perspective-1000">
        {/* Effet 3D de fond animé */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Ombres 3D */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
            mixBlendMode: 'overlay',
          }}
        ></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="transform-gpu" style={{ transform: 'translateZ(20px)' }}>
            <h2 
              className="text-3xl font-black mb-2 relative"
              style={{
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.2)',
                transform: 'perspective(500px) rotateX(2deg)',
              }}
            >
              Emploi du Temps
            </h2>
            <p className="text-orange-100 text-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
              Calendrier interactif et gestion intelligente des cours
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => {
                  const menu = document.getElementById('export-schedule-menu');
                  menu?.classList.toggle('hidden');
                }}
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <div
                id="export-schedule-menu"
                className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
              >
                <button
                  onClick={() => {
                    exportSchedulesToCSV();
                    document.getElementById('export-schedule-menu')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <FiFileText className="w-4 h-4 text-green-600" />
                  <span>Exporter en CSV</span>
                </button>
                <button
                  onClick={() => {
                    exportSchedulesToJSON();
                    document.getElementById('export-schedule-menu')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <FiFileText className="w-4 h-4 text-blue-600" />
                  <span>Exporter en JSON</span>
                </button>
                <button
                  onClick={() => {
                    exportSchedulesToPDF();
                    document.getElementById('export-schedule-menu')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <FiFileText className="w-4 h-4 text-red-600" />
                  <span>Exporter en PDF</span>
                </button>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setEditingSchedule(null);
                setIsModalOpen(true);
              }}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Nouvel horaire
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par matière, classe, enseignant ou salle..."
          />
          <div className="flex flex-col md:flex-row gap-4">
            <FilterDropdown
              label="Classe"
              value={selectedClass}
              onChange={setSelectedClass}
              options={[
                { value: 'all', label: 'Toutes les classes' },
                ...(classes?.map((c: any) => ({ value: c.id, label: c.name })) || []),
              ]}
            />
            <FilterDropdown
              label="Enseignant"
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              options={[
                { value: 'all', label: 'Tous les enseignants' },
                ...(teachers?.map((t: any) => ({
                  value: t.id,
                  label: `${t.user?.firstName} ${t.user?.lastName}`,
                })) || []),
              ]}
            />
            <FilterDropdown
              label="Salle"
              value={selectedRoom}
              onChange={setSelectedRoom}
              options={[
                { value: 'all', label: 'Toutes les salles' },
                ...(uniqueRooms.map((r) => ({ value: r, label: r }))),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Schedule Display */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des emplois du temps...</p>
          </div>
        </Card>
      ) : Object.keys(organizedSchedules).length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun emploi du temps configuré</p>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-4"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Créer le premier horaire
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(organizedSchedules).map(([className, days]: [string, any]) => (
            <Card 
              key={className}
              className="relative overflow-hidden group perspective-3d transform-gpu transition-all duration-300 hover:shadow-2xl"
              style={{
                transform: 'translateZ(0)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Effet 3D de fond animé */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Ombres 3D */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
                  transform: 'translateZ(-30px)',
                  filter: 'blur(30px)',
                }}
              ></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 
                    className="text-xl font-bold text-gray-800 relative"
                    style={{
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transform: 'perspective(300px) translateZ(10px)',
                    }}
                  >
                    {className}
                  </h3>
                  <Badge 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform-gpu transition-transform duration-300 hover:scale-110"
                    style={{
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      transform: 'translateZ(10px)',
                    }}
                  >
                    {Object.values(days).flat().length} cours
                  </Badge>
                </div>

              {/* Weekly Schedule Grid */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th 
                        className="border border-gray-200 p-2 bg-gradient-to-br from-gray-100 to-gray-200 font-semibold text-gray-700 relative"
                        style={{
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)',
                          transform: 'perspective(200px) rotateX(5deg)',
                        }}
                      >
                        Heure
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day.value}
                          className="border border-gray-200 p-2 bg-gradient-to-br from-gray-100 to-gray-200 font-semibold text-gray-700 min-w-[150px] relative"
                          style={{
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)',
                            transform: 'perspective(200px) rotateX(5deg)',
                          }}
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((time, idx) => {
                      if (idx % 2 !== 0) return null; // Afficher seulement les heures pleines
                      return (
                        <tr key={time}>
                          <td 
                            className="border border-gray-200 p-2 text-sm text-gray-600 font-medium bg-gradient-to-br from-gray-50 to-gray-100 relative"
                            style={{
                              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            {time}
                          </td>
                          {DAYS.map((day) => {
                            const scheduleForSlot = days[day.value]?.find((s: any) => {
                              const start = s.startTime;
                              const end = s.endTime;
                              return start <= time && end > time;
                            });

                            return (
                              <td
                                key={day.value}
                                className="border border-gray-200 p-2 align-top"
                              >
                                {scheduleForSlot ? (
                                  <div 
                                    className="relative group/course bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-lg p-2 mb-1 transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                                    style={{
                                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                                      transform: 'perspective(500px) translateZ(0) rotateX(2deg)',
                                      transformStyle: 'preserve-3d',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'perspective(500px) translateZ(15px) rotateX(0deg) scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'perspective(500px) translateZ(0) rotateX(2deg) scale(1)';
                                    }}
                                  >
                                    {/* Effet de brillance 3D */}
                                    <div 
                                      className="absolute inset-0 opacity-0 group-hover/course:opacity-100 transition-opacity duration-300 rounded-lg"
                                      style={{
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                                        mixBlendMode: 'overlay',
                                      }}
                                    ></div>
                                    
                                    {/* Ombres 3D au survol */}
                                    <div 
                                      className="absolute inset-0 opacity-0 group-hover/course:opacity-100 transition-opacity duration-300 rounded-lg"
                                      style={{
                                        background: 'radial-gradient(ellipse at 30% 30%, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
                                        transform: 'translateZ(-10px)',
                                        filter: 'blur(10px)',
                                      }}
                                    ></div>
                                    
                                    <div className="relative z-10 flex items-start justify-between">
                                      <div className="flex-1">
                                        <p 
                                          className="font-bold text-sm text-gray-800 relative"
                                          style={{
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                            transform: 'translateZ(5px)',
                                          }}
                                        >
                                          {scheduleForSlot.course?.name}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                          {scheduleForSlot.course?.teacher?.user?.firstName}{' '}
                                          {scheduleForSlot.course?.teacher?.user?.lastName}
                                        </p>
                                        {scheduleForSlot.room && (
                                          <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <FiMapPin className="w-3 h-3 mr-1" />
                                            {scheduleForSlot.room}
                                          </div>
                                        )}
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                          <FiClock className="w-3 h-3 mr-1" />
                                          {scheduleForSlot.startTime} - {scheduleForSlot.endTime}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-1 ml-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleView(scheduleForSlot);
                                          }}
                                          className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 transform-gpu hover:scale-110 hover:shadow-md"
                                          style={{
                                            boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
                                          }}
                                          title="Voir les détails"
                                        >
                                          <FiEye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(scheduleForSlot);
                                          }}
                                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 transform-gpu hover:scale-110 hover:shadow-md"
                                          style={{
                                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                                          }}
                                          title="Modifier"
                                        >
                                          <FiEdit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(scheduleForSlot.id);
                                          }}
                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 transform-gpu hover:scale-110 hover:shadow-md"
                                          style={{
                                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                          }}
                                          title="Supprimer"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div 
                                    className="h-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 opacity-50"
                                    style={{
                                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                                    }}
                                  ></div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Styles CSS pour les effets 3D */}
      <style>{`
        @keyframes float3d {
          0%, 100% {
            transform: translateY(0px) translateZ(0);
          }
          50% {
            transform: translateY(-10px) translateZ(10px);
          }
        }
        
        .perspective-3d {
          perspective: 1000px;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
        }
      `}</style>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
          resetForm();
        }}
        title={editingSchedule ? 'Modifier l\'horaire' : 'Nouvel horaire'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Classe <span className="text-red-500">*</span>
            </label>
            <FilterDropdown
              value={scheduleForm.classId}
              onChange={(value) => setScheduleForm({ ...scheduleForm, classId: value })}
              options={[
                { value: '', label: 'Sélectionner une classe' },
                ...(classes?.map((c: any) => ({ value: c.id, label: c.name })) || []),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Matière <span className="text-red-500">*</span>
            </label>
            <FilterDropdown
              value={scheduleForm.courseId}
              onChange={(value) => setScheduleForm({ ...scheduleForm, courseId: value })}
              options={[
                { value: '', label: 'Sélectionner une matière' },
                ...(courses?.map((c: any) => ({ value: c.id, label: c.name })) || []),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jour <span className="text-red-500">*</span>
              </label>
              <FilterDropdown
                value={scheduleForm.dayOfWeek}
                onChange={(value) => setScheduleForm({ ...scheduleForm, dayOfWeek: value })}
                options={DAYS.map((d) => ({ value: d.value.toString(), label: d.label }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Salle</label>
              <Input
                value={scheduleForm.room}
                onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                placeholder="Ex: A101"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Heure de début <span className="text-red-500">*</span>
              </label>
              <FilterDropdown
                value={scheduleForm.startTime}
                onChange={(value) => setScheduleForm({ ...scheduleForm, startTime: value })}
                options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Heure de fin <span className="text-red-500">*</span>
              </label>
              <FilterDropdown
                value={scheduleForm.endTime}
                onChange={(value) => setScheduleForm({ ...scheduleForm, endTime: value })}
                options={TIME_SLOTS.filter((t) => t > scheduleForm.startTime).map((t) => ({
                  value: t,
                  label: t,
                }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSchedule(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createScheduleMutation.isPending || updateScheduleMutation.isPending
              }
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createScheduleMutation.isPending || updateScheduleMutation.isPending ? (
                <>
                  <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {editingSchedule ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  {editingSchedule ? 'Modifier' : 'Créer'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Details Modal */}
      <ScheduleDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedScheduleId(null);
        }}
        scheduleId={selectedScheduleId}
        onEdit={() => {
          if (selectedScheduleId) {
            const schedule = schedules?.find((s: any) => s.id === selectedScheduleId);
            if (schedule) {
              handleEdit(schedule);
            }
          }
        }}
      />
    </div>
  );

  // Export functions
  const exportSchedulesToCSV = () => {
    try {
      const headers = ['Jour', 'Heure', 'Matière', 'Classe', 'Enseignant', 'Salle'];
      const csvContent =
        '\ufeff' + // BOM for UTF-8
        headers.join(';') +
        '\n' +
        (filteredSchedulesList || [])
          .map((s: any) =>
            [
              DAYS.find((d) => d.value === s.dayOfWeek)?.label || 'Inconnu',
              `${s.startTime} - ${s.endTime}`,
              s.course?.name || 'N/A',
              s.class?.name || 'N/A',
              s.course?.teacher?.user
                ? `${s.course.teacher.user.firstName} ${s.course.teacher.user.lastName}`
                : 'N/A',
              s.room || 'N/A',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `emploi-du-temps-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Emploi du temps exporté en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportSchedulesToJSON = () => {
    try {
      const jsonData = {
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        emploisDuTemps: (filteredSchedulesList || []).map((s: any) => ({
          jour: DAYS.find((d) => d.value === s.dayOfWeek)?.label || 'Inconnu',
          heureDebut: s.startTime,
          heureFin: s.endTime,
          matiere: s.course?.name || 'N/A',
          codeMatiere: s.course?.code || 'N/A',
          classe: s.class?.name || 'N/A',
          niveau: s.class?.level || 'N/A',
          enseignant: s.course?.teacher?.user
            ? `${s.course.teacher.user.firstName} ${s.course.teacher.user.lastName}`
            : 'N/A',
          emailEnseignant: s.course?.teacher?.user?.email || 'N/A',
          salle: s.room || 'N/A',
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `emploi-du-temps-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Emploi du temps exporté en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportSchedulesToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      doc.setFontSize(20);
      doc.setTextColor(249, 115, 22);
      doc.text('School Manager', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Emploi du Temps', 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 14, 37);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      const tableData = (filteredSchedulesList || []).map((s: any) => [
        DAYS.find((d) => d.value === s.dayOfWeek)?.label || 'Inconnu',
        `${s.startTime} - ${s.endTime}`,
        s.course?.name || 'N/A',
        s.class?.name || 'N/A',
        s.course?.teacher?.user
          ? `${s.course.teacher.user.firstName} ${s.course.teacher.user.lastName}`
          : 'N/A',
        s.room || 'N/A',
      ]);

      useAutoTable({
        startY: 45,
        head: [['Jour', 'Heure', 'Matière', 'Classe', 'Enseignant', 'Salle']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`emploi-du-temps-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Emploi du temps exporté en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };
};

export default ScheduleManagement;

