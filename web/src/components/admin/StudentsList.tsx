import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import SearchBar from '../ui/SearchBar';
import FilterDropdown from '../ui/FilterDropdown';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import AddStudentModal from './AddStudentModal';
import StudentDetailsModal from './StudentDetailsModal';
import EditStudentModal from './EditStudentModal';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiDownload,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiUserCheck,
  FiUserX,
  FiBook,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import {
  ENROLLMENT_STATUS_LABELS,
  enrollmentBadgeVariant,
  type EnrollmentStatusValue,
} from '../../lib/enrollmentStatus';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface StudentsListProps {
  searchQuery?: string;
  /** Affiche un filtre par classe (affectation des élèves) */
  showClassFilter?: boolean;
}

const StudentsList: React.FC<StudentsListProps> = ({ searchQuery = '', showClassFilter = false }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [groupByClass, setGroupByClass] = useState(true);

  useEffect(() => {
    if (searchQuery) setSearchTerm(searchQuery);
  }, [searchQuery]);

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
  });

  const { data: classesForFilter } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
    enabled: showClassFilter,
  });

  const deleteStudentMutation = useMutation({
    mutationFn: adminApi.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Élève supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erreur lors de la suppression de l'élève");
    },
  });

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDetailsModalOpen(true);
  };

  const handleEditStudent = (studentId: string) => {
    setEditingStudentId(studentId);
    setIsEditModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'élève "${studentName}" ?\n\nCette action est irréversible.`
      )
    ) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const filteredStudents = students?.filter((student: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      student.user.firstName.toLowerCase().includes(term) ||
      student.user.lastName.toLowerCase().includes(term) ||
      student.user.email.toLowerCase().includes(term) ||
      (student.studentId && student.studentId.toLowerCase().includes(term));
    const es = (student.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ACTIVE' && es === 'ACTIVE') ||
      (statusFilter === 'SUSPENDED' && es === 'SUSPENDED') ||
      (statusFilter === 'GRADUATED' && es === 'GRADUATED');
    const matchesClass =
      !showClassFilter ||
      classFilter === 'all' ||
      (classFilter === 'unassigned' && !student.classId) ||
      (classFilter !== 'unassigned' && student.classId === classFilter);
    return matchesSearch && matchesStatus && matchesClass;
  });

  const studentsByClass = useMemo(() => {
    if (!filteredStudents || !groupByClass) return null;
    const grouped: { [key: string]: any[] } = {};
    filteredStudents.forEach((student: any) => {
      const className = student.class?.name || 'Non assigné';
      if (!grouped[className]) grouped[className] = [];
      grouped[className].push(student);
    });
    const sortedClasses = Object.keys(grouped).sort((a, b) => {
      if (a === 'Non assigné') return 1;
      if (b === 'Non assigné') return -1;
      return a.localeCompare(b);
    });
    sortedClasses.forEach((className) => {
      grouped[className].sort((a: any, b: any) => {
        const nameA = `${a.user.lastName} ${a.user.firstName}`;
        const nameB = `${b.user.lastName} ${b.user.firstName}`;
        return nameA.localeCompare(nameB);
      });
    });
    return { grouped, sortedClasses };
  }, [filteredStudents, groupByClass]);

  useEffect(() => {
    if (
      groupByClass &&
      studentsByClass &&
      expandedClasses.size === 0 &&
      studentsByClass.sortedClasses.length > 0
    ) {
      setExpandedClasses(new Set(studentsByClass.sortedClasses));
    }
  }, [groupByClass, studentsByClass?.sortedClasses.join(',')]);

  const toggleClass = (className: string) => {
    const next = new Set(expandedClasses);
    if (next.has(className)) next.delete(className);
    else next.add(className);
    setExpandedClasses(next);
  };

  const stats = useMemo(() => {
    const list = filteredStudents || [];
    const enrollmentOf = (st: string) =>
      list.filter((s: any) => ((s.enrollmentStatus as string) || 'ACTIVE') === st).length;
    const classesCount = new Set(list.map((s: any) => s.class?.name || 'Non assigné')).size;
    return {
      total: list.length,
      enrollmentActive: enrollmentOf('ACTIVE'),
      suspended: enrollmentOf('SUSPENDED'),
      graduated: enrollmentOf('GRADUATED'),
      classes: classesCount,
    };
  }, [filteredStudents]);

  const exportToCSV = () => {
    try {
      const headers = [
        'ID',
        'Nom',
        'Prénom',
        'Email',
        'Téléphone',
        'Classe',
        'Niveau',
        "Statut d'inscription",
        'Fiche',
      ];
      const rows = (filteredStudents || []).map((s: any) => {
        const es = ((s.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE');
        return [
          s.studentId || s.id,
          s.user?.lastName || 'N/A',
          s.user?.firstName || 'N/A',
          s.user?.email || 'N/A',
          s.user?.phone || 'N/A',
          s.class?.name || 'N/A',
          s.class?.level || 'N/A',
          ENROLLMENT_STATUS_LABELS[es],
          s.isActive ? 'Fiche active' : 'Fiche inactive',
        ].join(';');
      });
      const csv = '\ufeff# School Manager - Export Élèves\n' + `# ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}\n` + headers.join(';') + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `eleves-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Export CSV réussi');
    } catch {
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const exportToJSON = () => {
    try {
      const data = {
        application: 'School Manager',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: filteredStudents?.length || 0,
        élèves: (filteredStudents || []).map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          nom: s.user?.lastName,
          prénom: s.user?.firstName,
          email: s.user?.email,
          téléphone: s.user?.phone,
          classe: s.class?.name,
          niveau: s.class?.level,
          statutInscription:
            ENROLLMENT_STATUS_LABELS[(s.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE'],
          fiche: s.isActive ? 'Fiche active' : 'Fiche inactive',
        })),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `eleves-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Export JSON réussi');
    } catch {
      toast.error("Erreur lors de l'export JSON");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(20);
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Liste des Élèves', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 60, 30);

      const useAutoTable = (opts: any) => {
        if (typeof (doc as any).autoTable === 'function') (doc as any).autoTable(opts);
        else if (typeof autoTable === 'function') autoTable(doc, opts);
      };
      const tableData = (filteredStudents || []).map((s: any) => {
        const es = (s.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE';
        return [
          s.studentId || s.id,
          `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
          s.user?.email || 'N/A',
          s.class?.name || 'N/A',
          ENROLLMENT_STATUS_LABELS[es],
        ];
      });
      useAutoTable({
        startY: 38,
        head: [['ID', 'Nom complet', 'Email', 'Classe', "Statut d'inscription"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
      doc.save(`eleves-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Export PDF réussi');
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'export PDF");
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      render: (student: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={student.user?.avatar}
            name={`${student.user?.firstName || ''} ${student.user?.lastName || ''}`}
            size="md"
          />
          <div>
            <p className="font-medium text-gray-900">
              {student.user?.firstName} {student.user?.lastName}
            </p>
            <p className="text-sm text-gray-500">ID: {student.studentId || student.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (student: any) => <span className="text-gray-600">{student.user?.email || '—'}</span>,
    },
    {
      key: 'class',
      header: 'Classe',
      render: (student: any) => (
        <Badge variant={student.class ? 'info' : 'default'}>
          {student.class?.name || 'Non assigné'}
        </Badge>
      ),
    },
    {
      key: 'enrollment',
      header: "Inscription",
      render: (student: any) => {
        const es = (student.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE';
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant={enrollmentBadgeVariant(es)}>
              {ENROLLMENT_STATUS_LABELS[es]}
            </Badge>
            <span className="text-xs text-gray-500">
              Fiche {student.isActive ? 'active' : 'inactive'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (student: any) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleViewStudent(student.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Voir les détails"
            aria-label="Voir les détails"
          >
            <FiEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleEditStudent(student.id)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Modifier"
            aria-label="Modifier"
          >
            <FiEdit className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              handleDeleteStudent(
                student.id,
                `${student.user?.firstName || ''} ${student.user?.lastName || ''}`
              )
            }
            disabled={deleteStudentMutation.isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Supprimer"
            aria-label="Supprimer"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Élèves</h1>
          <p className="text-sm text-gray-500 mt-1">Chargement des élèves...</p>
        </div>
        <Card className="p-8 border border-gray-200">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {showClassFilter ? 'Élèves et affectation aux classes' : 'Élèves'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {showClassFilter
            ? 'Filtrez par classe et modifiez la classe d’un élève via « Modifier » (onglet scolarité).'
            : 'Gérez les élèves, leurs classes et leur statut. Recherchez, filtrez et exportez la liste.'}
        </p>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50">
              <FiUsers className="w-5 h-5 text-indigo-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <FiUserCheck className="w-5 h-5 text-emerald-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inscr. active</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{stats.enrollmentActive}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50">
              <FiUserX className="w-5 h-5 text-red-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Suspendus</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{stats.suspended}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50">
              <FiUserCheck className="w-5 h-5 text-sky-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Diplômés</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{stats.graduated}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <FiBook className="w-5 h-5 text-blue-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{stats.classes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card className="p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher par nom, email ou ID..."
            />
          </div>
          <FilterDropdown
            options={[
              { label: 'Tous', value: 'all' },
              { label: 'Inscription active', value: 'ACTIVE' },
              { label: 'Inscription suspendue', value: 'SUSPENDED' },
              { label: 'Diplômé·e', value: 'GRADUATED' },
            ]}
            selected={statusFilter}
            onChange={setStatusFilter}
            label="Inscription"
          />
          {showClassFilter && (
            <FilterDropdown
              options={[
                { label: 'Toutes les classes', value: 'all' },
                { label: 'Non assigné', value: 'unassigned' },
                ...(classesForFilter || []).map((cl: any) => ({
                  label: `${cl.name} (${cl.level})`,
                  value: cl.id,
                })),
              ]}
              selected={classFilter}
              onChange={setClassFilter}
              label="Classe"
            />
          )}
          <Button
            variant={groupByClass ? 'primary' : 'secondary'}
            size="default"
            onClick={() => {
              setGroupByClass(!groupByClass);
              if (!groupByClass && studentsByClass?.sortedClasses.length) {
                setExpandedClasses(new Set(studentsByClass.sortedClasses));
              }
            }}
          >
            <FiUsers className="w-5 h-5 mr-2 inline" aria-hidden />
            {groupByClass ? 'Par classe' : 'Liste simple'}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={exportToCSV}>
              <FiDownload className="w-4 h-4 mr-1" aria-hidden /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={exportToJSON}>
              <FiDownload className="w-4 h-4 mr-1" aria-hidden /> JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={exportToPDF}>
              <FiDownload className="w-4 h-4 mr-1" aria-hidden /> PDF
            </Button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <FiPlus className="w-5 h-5 mr-2 inline" aria-hidden />
            Ajouter un élève
          </Button>
        </div>
      </Card>

      {/* Liste */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Liste des élèves ({filteredStudents?.length ?? 0})
          </h2>
        </div>

        {groupByClass && studentsByClass ? (
          <div className="divide-y divide-gray-200">
            {studentsByClass.sortedClasses.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Aucun élève trouvé</div>
            ) : (
              studentsByClass.sortedClasses.map((className) => {
                const classStudents = studentsByClass.grouped[className];
                const isExpanded = expandedClasses.has(className);
                const classLevel = classStudents[0]?.class?.level || '';

                return (
                  <div key={className}>
                    <button
                      type="button"
                      onClick={() => toggleClass(className)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <FiChevronUp className="w-5 h-5 text-gray-500 shrink-0" aria-hidden />
                        ) : (
                          <FiChevronDown className="w-5 h-5 text-gray-500 shrink-0" aria-hidden />
                        )}
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <FiBook className="w-5 h-5 text-indigo-600" aria-hidden />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{className}</span>
                          {classLevel && (
                            <span className="text-sm text-gray-500 ml-2">— {classLevel}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="info">{classStudents.length} élève(s)</Badge>
                    </button>
                    {isExpanded && (
                      <div className="bg-gray-50/50 border-t border-gray-100">
                        <Table
                          data={classStudents}
                          columns={columns}
                          emptyMessage="Aucun élève dans cette classe"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <Table
            data={filteredStudents || []}
            columns={columns}
            emptyMessage="Aucun élève trouvé"
          />
        )}
      </Card>

      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {selectedStudentId && (
        <StudentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedStudentId(null);
          }}
          studentId={selectedStudentId}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            setEditingStudentId(selectedStudentId);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {editingStudentId && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingStudentId(null);
          }}
          studentId={editingStudentId}
        />
      )}
    </div>
  );
};

export default StudentsList;
