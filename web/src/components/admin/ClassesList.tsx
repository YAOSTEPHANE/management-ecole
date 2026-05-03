import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import SearchBar from '../ui/SearchBar';
import AddClassModal from './AddClassModal';
import {
  FiPlus,
  FiUsers,
  FiBook,
  FiCalendar,
  FiDownload,
  FiLayers,
  FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ClassesListProps {
  searchQuery?: string;
  /** Typographie plus petite (ex. onglet Gestion académique) */
  compact?: boolean;
}

const levelColors: Record<string, string> = {
  '6ème': 'bg-blue-100 text-blue-700',
  '5ème': 'bg-emerald-100 text-emerald-700',
  '4ème': 'bg-amber-100 text-amber-700',
  '3ème': 'bg-orange-100 text-orange-700',
  '2nde': 'bg-violet-100 text-violet-700',
  '1ère': 'bg-pink-100 text-pink-700',
  Terminale: 'bg-red-100 text-red-700',
};

const ClassesList: React.FC<ClassesListProps> = ({ searchQuery = '', compact = false }) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (searchQuery) setSearchTerm(searchQuery);
  }, [searchQuery]);

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
  });

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    const term = searchTerm.toLowerCase();
    return classes.filter(
      (c: any) =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.level || '').toLowerCase().includes(term) ||
        (c.academicYear || '').toLowerCase().includes(term) ||
        (c.room || '').toLowerCase().includes(term)
    );
  }, [classes, searchTerm]);

  const stats = useMemo(() => {
    const list = filteredClasses;
    const totalStudents = list.reduce((acc: number, c: any) => acc + (c._count?.students || 0), 0);
    const totalCapacity = list.reduce((acc: number, c: any) => acc + (c.capacity || 0), 0);
    const levels = new Set(list.map((c: any) => c.level).filter(Boolean)).size;
    return {
      total: list.length,
      students: totalStudents,
      levels,
      capacity: totalCapacity,
    };
  }, [filteredClasses]);

  const exportToCSV = () => {
    try {
      const headers = ['Nom', 'Niveau', 'Année scolaire', 'Nombre d\'élèves', 'Capacité', 'Enseignant principal'];
      const rows = (filteredClasses || []).map((c: any) =>
        [
          c.name,
          c.level || 'N/A',
          c.academicYear || 'N/A',
          c._count?.students || 0,
          c.capacity || 0,
          c.teacher?.user ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'N/A',
        ].join(';')
      );
      const csv =
        '\ufeff# School Manager - Export Classes\n' +
        `# ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}\n` +
        headers.join(';') +
        '\n' +
        rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `classes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
        total: filteredClasses?.length || 0,
        classes: (filteredClasses || []).map((c: any) => ({
          nom: c.name,
          niveau: c.level,
          annéeScolaire: c.academicYear,
          nombreÉlèves: c._count?.students || 0,
          capacité: c.capacity || 0,
          enseignantPrincipal: c.teacher?.user
            ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
            : null,
        })),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `classes-${format(new Date(), 'yyyy-MM-dd')}.json`;
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
      doc.setFillColor(124, 58, 237);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      doc.setTextColor(124, 58, 237);
      doc.setFontSize(20);
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Liste des Classes', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 60, 30);

      const useAutoTable = (opts: any) => {
        if (typeof (doc as any).autoTable === 'function') (doc as any).autoTable(opts);
        else if (typeof autoTable === 'function') autoTable(doc, opts);
      };
      const tableData = (filteredClasses || []).map((c: any) => [
        c.name,
        c.level || 'N/A',
        c.academicYear || 'N/A',
        c._count?.students || 0,
        c.capacity || 0,
        c.teacher?.user ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'N/A',
      ]);
      useAutoTable({
        startY: 38,
        head: [['Nom', 'Niveau', 'Année scolaire', 'Élèves', 'Capacité', 'Enseignant principal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
      doc.save(`classes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Export PDF réussi');
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'export PDF");
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${compact ? 'text-sm' : ''}`}>
        <div>
          <h1 className={compact ? 'text-lg font-semibold text-gray-900' : 'text-xl font-semibold text-gray-900'}>
            Classes
          </h1>
          <p className={compact ? 'text-xs text-gray-500 mt-1' : 'text-sm text-gray-500 mt-1'}>
            Chargement des classes...
          </p>
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
    <div className={`space-y-6 ${compact ? 'text-sm' : ''}`}>
      <div>
        <h1 className={compact ? 'text-lg font-semibold text-gray-900' : 'text-xl font-semibold text-gray-900'}>
          Classes
        </h1>
        <p className={compact ? 'text-xs text-gray-500 mt-1' : 'text-sm text-gray-500 mt-1'}>
          Gérez les classes, niveaux, effectifs et professeurs principaux. Recherchez et exportez la liste.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50">
              <FiLayers className="w-5 h-5 text-violet-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
              <p
                className={
                  compact
                    ? 'text-lg font-bold text-gray-900 tabular-nums'
                    : 'text-xl font-bold text-gray-900 tabular-nums'
                }
              >
                {stats.total}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50">
              <FiUsers className="w-5 h-5 text-indigo-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Élèves</p>
              <p
                className={
                  compact
                    ? 'text-lg font-bold text-gray-900 tabular-nums'
                    : 'text-xl font-bold text-gray-900 tabular-nums'
                }
              >
                {stats.students}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <FiBook className="w-5 h-5 text-blue-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Niveaux</p>
              <p
                className={
                  compact
                    ? 'text-lg font-bold text-gray-900 tabular-nums'
                    : 'text-xl font-bold text-gray-900 tabular-nums'
                }
              >
                {stats.levels}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <FiTrendingUp className="w-5 h-5 text-emerald-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Capacité</p>
              <p
                className={
                  compact
                    ? 'text-lg font-bold text-gray-900 tabular-nums'
                    : 'text-xl font-bold text-gray-900 tabular-nums'
                }
              >
                {stats.capacity}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <SearchBar
              compact={compact}
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher par nom, niveau, année ou salle..."
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={exportToCSV}>
              <FiDownload className="w-4 h-4 mr-1" aria-hidden /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={exportToJSON}>
              <FiDownload className="w-4 h-4 mr-1" aria-hidden /> JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={exportToPDF}>
              <FiDownload className="w-4 h-4 mr-1" aria-hidden /> PDF
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <FiPlus className="w-5 h-5 mr-2 inline" aria-hidden />
              Créer une classe
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <h2
          className={
            compact
              ? 'text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4'
              : 'text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4'
          }
        >
          Liste des classes ({filteredClasses.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((classItem: any) => {
            const levelStyle = levelColors[classItem.level] || 'bg-gray-100 text-gray-700';
            const count = classItem._count?.students || 0;
            const cap = classItem.capacity || 1;
            const fillPct = Math.min((count / cap) * 100, 100);
            const barColor =
              fillPct >= 90 ? 'bg-red-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <Card key={classItem.id} className="border border-gray-200 overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className={
                          compact ? 'text-sm font-semibold text-gray-900' : 'font-semibold text-gray-900'
                        }
                      >
                        {classItem.name}
                      </h3>
                      <Badge className={`mt-1 ${levelStyle}`} size="sm">
                        {classItem.level || '—'}
                      </Badge>
                    </div>
                    {classItem.room && (
                      <Badge variant="default" size="sm">
                        {classItem.room}
                      </Badge>
                    )}
                  </div>
                  <div
                    className={
                      compact
                        ? 'flex items-center gap-2 text-xs text-gray-500'
                        : 'flex items-center gap-2 text-sm text-gray-500'
                    }
                  >
                    <FiCalendar className="w-4 h-4 shrink-0" aria-hidden />
                    <span>{classItem.academicYear || '—'}</span>
                  </div>
                  <div className="space-y-1">
                    <div className={compact ? 'flex justify-between text-xs' : 'flex justify-between text-sm'}>
                      <span className="text-gray-600">Élèves</span>
                      <span className="font-medium text-gray-900">
                        {count} / {classItem.capacity || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${barColor}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  {classItem.teacher?.user && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Professeur principal</p>
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={classItem.teacher.user.avatar}
                          name={`${classItem.teacher.user.firstName} ${classItem.teacher.user.lastName}`}
                          size="sm"
                        />
                        <span
                          className={
                            compact
                              ? 'text-xs font-medium text-gray-900 truncate'
                              : 'text-sm font-medium text-gray-900 truncate'
                          }
                        >
                          {classItem.teacher.user.firstName} {classItem.teacher.user.lastName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        {filteredClasses.length === 0 && (
          <Card className="p-8 border border-gray-200 text-center text-gray-500">
            Aucune classe trouvée
          </Card>
        )}
      </div>

      <AddClassModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

export default ClassesList;
