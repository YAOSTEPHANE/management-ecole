import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { FiClock, FiMapPin, FiUser, FiCalendar, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  course: {
    name: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
  room?: string;
}

interface StudentScheduleCalendarProps {
  schedule: ScheduleItem[];
}

const DAYS = [
  { value: 0, label: 'Dimanche', short: 'Dim' },
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const StudentScheduleCalendar: React.FC<StudentScheduleCalendarProps> = ({ schedule }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'weekly'>('weekly');

  const getDaySchedule = (date: Date) => {
    const dayOfWeek = date.getDay();
    return schedule.filter((item) => item.dayOfWeek === dayOfWeek);
  };

  const daySchedule = getDaySchedule(selectedDate);

  // Organiser l'emploi du temps par jour de la semaine
  const weeklySchedule = useMemo(() => {
    const organized: { [key: number]: ScheduleItem[] } = {};
    DAYS.forEach((day) => {
      organized[day.value] = schedule.filter((item) => item.dayOfWeek === day.value);
    });
    return organized;
  }, [schedule]);

  // Fonction d'export PDF
  const exportToPDF = () => {
    if (!schedule || schedule.length === 0) {
      toast.error('Aucun emploi du temps à exporter');
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape pour un meilleur affichage
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Header
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Emploi du Temps', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 60, 30);

      // Organiser les cours par jour
      const scheduleByDay: Record<number, ScheduleItem[]> = {};
      DAYS.forEach(day => {
        scheduleByDay[day.value] = schedule.filter((s: ScheduleItem) => s.dayOfWeek === day.value);
      });

      // Créer les données du tableau
      const tableData: any[][] = [];
      
      // Trouver le nombre maximum de cours par jour
      const maxCoursesPerDay = Math.max(...Object.values(scheduleByDay).map(daySchedule => daySchedule.length));

      // Créer les lignes pour chaque créneau
      for (let i = 0; i < maxCoursesPerDay; i++) {
        const row: any[] = [];
        DAYS.forEach(day => {
          const daySchedule = scheduleByDay[day.value] || [];
          if (daySchedule[i]) {
            const course = daySchedule[i];
            const timeRange = `${course.startTime} - ${course.endTime}`;
            const courseInfo = `${course.course.name}\n${course.course.teacher.user.firstName} ${course.course.teacher.user.lastName}\n${timeRange}${course.room ? `\nSalle: ${course.room}` : ''}`;
            row.push(courseInfo);
          } else {
            row.push('');
          }
        });
        tableData.push(row);
      }

      // En-têtes des colonnes (jours de la semaine)
      const headers = DAYS.map(day => day.label);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      useAutoTable({
        startY: 38,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [139, 92, 246], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { cellWidth: 35 },
          6: { cellWidth: 35 },
        },
        margin: { left: 14, right: 14, top: 38 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`emploi-du-temps-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Emploi du temps exporté en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const tileContent = ({ date }: { date: Date }) => {
    const daySchedule = getDaySchedule(date);
    if (daySchedule.length > 0) {
      return (
        <div className="flex flex-wrap gap-1 justify-center mt-1">
          {daySchedule.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-sm transform-gpu transition-transform duration-200 hover:scale-125"
              title={item.course.name}
              style={{
                boxShadow: '0 2px 4px rgba(147, 51, 234, 0.3)',
              }}
            />
          ))}
          {daySchedule.length > 2 && (
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full" 
              title={`+${daySchedule.length - 2} autres`}
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            />
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'export */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mon Emploi du Temps</h2>
            <p className="text-sm text-gray-600">Visualisez et téléchargez votre emploi du temps</p>
          </div>
          <Button
            onClick={exportToPDF}
            variant="primary"
            size="sm"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </Card>
      {/* Mode Toggle */}
      <Card className="relative overflow-hidden group perspective-3d transform-gpu transition-all duration-300 hover:shadow-2xl"
        style={{
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Choisissez votre mode d'affichage</p>
          </div>
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 border-2 border-purple-200 shadow-lg"
            style={{
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
          >
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform-gpu ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                boxShadow: viewMode === 'weekly' ? '0 4px 12px rgba(147, 51, 234, 0.4)' : 'none',
              }}
            >
              <FiCalendar className="w-4 h-4 inline mr-2" />
              Hebdomadaire
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform-gpu ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                boxShadow: viewMode === 'calendar' ? '0 4px 12px rgba(147, 51, 234, 0.4)' : 'none',
              }}
            >
              <FiCalendar className="w-4 h-4 inline mr-2" />
              Calendrier
            </button>
          </div>
        </div>
      </Card>

      {viewMode === 'weekly' ? (
        <Card 
          className="relative overflow-hidden group perspective-3d transform-gpu transition-all duration-300 hover:shadow-2xl"
          style={{
            transform: 'translateZ(0)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Effet 3D de fond animé */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Ombres 3D */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.1) 0%, transparent 70%)',
              transform: 'translateZ(-30px)',
              filter: 'blur(30px)',
            }}
          ></div>
          
          <div className="relative z-10">
            <h3 
              className="text-xl font-bold text-gray-800 mb-6 relative"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(300px) translateZ(10px)',
              }}
            >
              Planning Hebdomadaire
            </h3>

            {/* Weekly Schedule Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th 
                      className="border border-gray-200 p-3 bg-gradient-to-br from-purple-100 to-pink-100 font-semibold text-gray-700 relative min-w-[100px]"
                      style={{
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)',
                        transform: 'perspective(200px) rotateX(5deg)',
                      }}
                    >
                      Heure
                    </th>
                    {DAYS.slice(1, 6).map((day) => (
                      <th
                        key={day.value}
                        className="border border-gray-200 p-3 bg-gradient-to-br from-purple-100 to-pink-100 font-semibold text-gray-700 min-w-[150px] relative"
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
                        {DAYS.slice(1, 6).map((day) => {
                          const scheduleForSlot = weeklySchedule[day.value]?.find((s: ScheduleItem) => {
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
                                  className="relative group/course bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 border-2 border-purple-300 rounded-lg p-3 mb-1 transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                                  style={{
                                    boxShadow: '0 4px 12px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
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
                                      background: 'radial-gradient(ellipse at 30% 30%, rgba(147, 51, 234, 0.2) 0%, transparent 70%)',
                                      transform: 'translateZ(-10px)',
                                      filter: 'blur(10px)',
                                    }}
                                  ></div>
                                  
                                  <div className="relative z-10">
                                    <p 
                                      className="font-bold text-sm text-gray-800 relative mb-1"
                                      style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                        transform: 'translateZ(5px)',
                                      }}
                                    >
                                      {scheduleForSlot.course?.name}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-600 mb-1">
                                      <FiUser className="w-3 h-3 mr-1" />
                                      {scheduleForSlot.course?.teacher?.user?.firstName}{' '}
                                      {scheduleForSlot.course?.teacher?.user?.lastName}
                                    </div>
                                    {scheduleForSlot.room && (
                                      <div className="flex items-center text-xs text-gray-500 mb-1">
                                        <FiMapPin className="w-3 h-3 mr-1" />
                                        {scheduleForSlot.room}
                                      </div>
                                    )}
                                    <div className="flex items-center text-xs text-purple-600 font-semibold">
                                      <FiClock className="w-3 h-3 mr-1" />
                                      {scheduleForSlot.startTime} - {scheduleForSlot.endTime}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="h-20 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 opacity-50"
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card 
            className="lg:col-span-2 relative overflow-hidden group perspective-3d transform-gpu transition-all duration-300 hover:shadow-2xl"
            style={{
              transform: 'translateZ(0)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <h3 
                className="text-lg font-bold text-gray-800 mb-4 relative"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transform: 'perspective(300px) translateZ(10px)',
                }}
              >
                Calendrier
              </h3>
              <div className="custom-calendar">
                <Calendar
                  onChange={(v) => {
                    if (v instanceof Date) setSelectedDate(v);
                  }}
                  value={selectedDate}
                  tileContent={tileContent}
                  className="w-full border-0 rounded-lg"
                />
              </div>
            </div>
          </Card>

          <Card 
            className="relative overflow-hidden group perspective-3d transform-gpu transition-all duration-300 hover:shadow-2xl"
            style={{
              transform: 'translateZ(0)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <h3 
                className="text-lg font-bold text-gray-800 mb-4 relative"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transform: 'perspective(300px) translateZ(10px)',
                }}
              >
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              {daySchedule.length > 0 ? (
                <div className="space-y-3">
                  {daySchedule
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="relative group/course p-4 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 rounded-lg border-2 border-purple-300 transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                        style={{
                          boxShadow: '0 4px 12px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
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
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-2">
                            <h4 
                              className="font-bold text-gray-900 relative"
                              style={{
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                transform: 'translateZ(5px)',
                              }}
                            >
                              {item.course.name}
                            </h4>
                            <Badge 
                              variant="info" 
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform-gpu transition-transform duration-300 hover:scale-110"
                              style={{
                                boxShadow: '0 2px 8px rgba(147, 51, 234, 0.4)',
                              }}
                            >
                              {item.startTime} - {item.endTime}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <FiUser className="w-4 h-4 mr-1" />
                            {item.course.teacher.user.firstName} {item.course.teacher.user.lastName}
                          </div>
                          {item.room && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <FiMapPin className="w-3 h-3 mr-1" />
                              Salle: {item.room}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun cours prévu ce jour</p>
                </div>
              )}
            </div>
          </Card>
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
        
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
        }
        
        .custom-calendar .react-calendar {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.1);
        }
        
        .custom-calendar .react-calendar__tile {
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .custom-calendar .react-calendar__tile:hover {
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1));
          transform: scale(1.05);
        }
        
        .custom-calendar .react-calendar__tile--active {
          background: linear-gradient(135deg, #9333ea, #ec4899);
          color: white;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
        }
      `}</style>
    </div>
  );
};

export default StudentScheduleCalendar;

