import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Footer from '../components/Footer';
import {
  FiSearch,
  FiUsers,
  FiBook,
  FiUserCheck,
  FiClipboard,
  FiCalendar,
  FiUpload,
  FiX,
  FiFilter,
  FiClock,
} from 'react-icons/fi';

type SearchCategory = 'all' | 'students' | 'classes' | 'teachers' | 'grades' | 'absences' | 'assignments';

const Search = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const urlQuery = searchParams?.get('q')?.trim() ?? '';
  const effectiveQuery = searchQuery.trim() || urlQuery;

  const [debouncedQuery, setDebouncedQuery] = useState(effectiveQuery);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(effectiveQuery), 350);
    return () => window.clearTimeout(id);
  }, [effectiveQuery]);

  /** Ne charge les jeux de données lourds que lorsqu’il y a une requête (évite 6 appels au chargement de la page). */
  const queriesEnabled = debouncedQuery.length >= 1;

  // Update search query from URL params
  useEffect(() => {
    const query = searchParams?.get('q');
    if (query) {
      setSearchQuery(query);
      if (query.trim()) {
        const saved = localStorage.getItem('recentSearches');
        const recent = saved ? JSON.parse(saved) : [];
        const updated = [query, ...recent.filter((s: string) => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      }
    }
  }, [searchParams]);

  const queryOptions = {
    enabled: queriesEnabled,
    staleTime: 60_000,
  } as const;

  const { data: students } = useQuery({
    queryKey: ['search', 'students'],
    queryFn: () => adminApi.getStudents(),
    ...queryOptions,
  });

  const { data: classes } = useQuery({
    queryKey: ['search', 'classes'],
    queryFn: () => adminApi.getClasses(),
    ...queryOptions,
  });

  const { data: teachers } = useQuery({
    queryKey: ['search', 'teachers'],
    queryFn: () => adminApi.getTeachers(),
    ...queryOptions,
  });

  const { data: grades } = useQuery({
    queryKey: ['search', 'admin-grades'],
    queryFn: () => adminApi.getAllGrades(),
    ...queryOptions,
  });

  const { data: absences } = useQuery({
    queryKey: ['search', 'admin-absences'],
    queryFn: () => adminApi.getAllAbsences(),
    ...queryOptions,
  });

  const { data: assignments } = useQuery({
    queryKey: ['search', 'admin-assignments'],
    queryFn: () => adminApi.getAllAssignments(),
    ...queryOptions,
  });

  // Save search to recent searches
  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return { students: [], classes: [], teachers: [], grades: [], absences: [], assignments: [] };

    const query = searchQuery.toLowerCase();
    const results = {
      students: [] as any[],
      classes: [] as any[],
      teachers: [] as any[],
      grades: [] as any[],
      absences: [] as any[],
      assignments: [] as any[],
    };

    // Search students
    if (activeCategory === 'all' || activeCategory === 'students') {
      results.students = students?.filter((student: any) => {
        return (
          student.user.firstName.toLowerCase().includes(query) ||
          student.user.lastName.toLowerCase().includes(query) ||
          student.user.email.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          student.class?.name.toLowerCase().includes(query)
        );
      }) || [];
    }

    // Search classes
    if (activeCategory === 'all' || activeCategory === 'classes') {
      results.classes = classes?.filter((cls: any) => {
        return (
          cls.name.toLowerCase().includes(query) ||
          cls.level.toLowerCase().includes(query) ||
          cls.academicYear.toLowerCase().includes(query) ||
          cls.room?.toLowerCase().includes(query)
        );
      }) || [];
    }

    // Search teachers
    if (activeCategory === 'all' || activeCategory === 'teachers') {
      results.teachers = teachers?.filter((teacher: any) => {
        return (
          teacher.user.firstName.toLowerCase().includes(query) ||
          teacher.user.lastName.toLowerCase().includes(query) ||
          teacher.user.email.toLowerCase().includes(query) ||
          teacher.employeeId.toLowerCase().includes(query) ||
          teacher.specialization.toLowerCase().includes(query)
        );
      }) || [];
    }

    // Search grades
    if (activeCategory === 'all' || activeCategory === 'grades') {
      results.grades = grades?.filter((grade: any) => {
        return (
          grade.student.user.firstName.toLowerCase().includes(query) ||
          grade.student.user.lastName.toLowerCase().includes(query) ||
          grade.course.name.toLowerCase().includes(query) ||
          grade.title.toLowerCase().includes(query) ||
          grade.type.toLowerCase().includes(query)
        );
      }) || [];
    }

    // Search absences
    if (activeCategory === 'all' || activeCategory === 'absences') {
      results.absences = absences?.filter((absence: any) => {
        return (
          absence.student.user.firstName.toLowerCase().includes(query) ||
          absence.student.user.lastName.toLowerCase().includes(query) ||
          absence.course.name.toLowerCase().includes(query) ||
          absence.status.toLowerCase().includes(query)
        );
      }) || [];
    }

    // Search assignments
    if (activeCategory === 'all' || activeCategory === 'assignments') {
      results.assignments = assignments?.filter((assignment: any) => {
        return (
          assignment.title.toLowerCase().includes(query) ||
          assignment.description?.toLowerCase().includes(query) ||
          assignment.course.name.toLowerCase().includes(query) ||
          assignment.course.class.name.toLowerCase().includes(query)
        );
      }) || [];
    }

    return results;
  }, [searchQuery, activeCategory, students, classes, teachers, grades, absences, assignments]);

  const totalResults = Object.values(filteredResults).reduce((sum, arr) => sum + arr.length, 0);

  const categories = [
    { id: 'all' as SearchCategory, label: 'Tout', icon: FiSearch, count: totalResults },
    { id: 'students' as SearchCategory, label: 'Élèves', icon: FiUsers, count: filteredResults.students.length },
    { id: 'classes' as SearchCategory, label: 'Classes', icon: FiBook, count: filteredResults.classes.length },
    { id: 'teachers' as SearchCategory, label: 'Enseignants', icon: FiUserCheck, count: filteredResults.teachers.length },
    { id: 'grades' as SearchCategory, label: 'Notes', icon: FiClipboard, count: filteredResults.grades.length },
    { id: 'absences' as SearchCategory, label: 'Absences', icon: FiCalendar, count: filteredResults.absences.length },
    { id: 'assignments' as SearchCategory, label: 'Devoirs', icon: FiUpload, count: filteredResults.assignments.length },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      saveSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      saveSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-center">Recherche Globale</h1>
          <p className="text-xl text-blue-100 text-center mb-8">
            Recherchez dans tous les éléments de votre établissement
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
              <FiSearch className="w-6 h-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher des élèves, classes, enseignants, notes..."
              className="w-full pl-16 pr-12 py-4 text-lg rounded-2xl border-2 border-white/30 bg-white/95 backdrop-blur-sm focus:ring-4 focus:ring-white/30 focus:border-white transition-all duration-200 shadow-xl text-gray-800 placeholder-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => handleSearch('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="text-center mt-6">
              <p className="text-blue-100 text-lg">
                <span className="font-bold text-white">{totalResults}</span> résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Catégories</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  <span>{category.label}</span>
                  {category.count > 0 && (
                    <Badge
                      className={`${
                        isActive
                          ? 'bg-white/30 text-white'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {category.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recent Searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FiClock className="w-5 h-5 mr-2 text-gray-400" />
              Recherches récentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors flex items-center space-x-2"
                >
                  <FiSearch className="w-3 h-3" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Results */}
        {searchQuery ? (
          <div className="space-y-6">
            {/* Students Results */}
            {(activeCategory === 'all' || activeCategory === 'students') && filteredResults.students.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiUsers className="w-6 h-6 mr-2 text-blue-600" />
                    Élèves ({filteredResults.students.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.students.map((student: any) => (
                    <div
                      key={student.id}
                      className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push('/admin?tab=students')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.user.firstName[0]}{student.user.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {student.user.firstName} {student.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{student.studentId}</p>
                          {student.class && (
                            <Badge className="bg-blue-100 text-blue-800 mt-1">
                              {student.class.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Classes Results */}
            {(activeCategory === 'all' || activeCategory === 'classes') && filteredResults.classes.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiBook className="w-6 h-6 mr-2 text-purple-600" />
                    Classes ({filteredResults.classes.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.classes.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push('/admin?tab=classes')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-lg">{cls.name}</p>
                          <p className="text-sm text-gray-600">{cls.level} - {cls.academicYear}</p>
                          {cls.room && (
                            <p className="text-xs text-gray-500 mt-1">Salle: {cls.room}</p>
                          )}
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {cls._count?.students || 0} élèves
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Teachers Results */}
            {(activeCategory === 'all' || activeCategory === 'teachers') && filteredResults.teachers.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiUserCheck className="w-6 h-6 mr-2 text-indigo-600" />
                    Enseignants ({filteredResults.teachers.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.teachers.map((teacher: any) => (
                    <div
                      key={teacher.id}
                      className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push('/admin?tab=teachers')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {teacher.user.firstName} {teacher.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{teacher.employeeId}</p>
                          <Badge className="bg-indigo-100 text-indigo-800 mt-1">
                            {teacher.specialization}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Grades Results */}
            {(activeCategory === 'all' || activeCategory === 'grades') && filteredResults.grades.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiClipboard className="w-6 h-6 mr-2 text-green-600" />
                    Notes ({filteredResults.grades.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredResults.grades.slice(0, 10).map((grade: any) => (
                    <div
                      key={grade.id}
                      className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push('/admin?tab=management')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {grade.student.user.firstName} {grade.student.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{grade.course.name} - {grade.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(grade.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {((grade.score / grade.maxScore) * 20).toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">/ 20</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Absences Results */}
            {(activeCategory === 'all' || activeCategory === 'absences') && filteredResults.absences.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiCalendar className="w-6 h-6 mr-2 text-orange-600" />
                    Absences ({filteredResults.absences.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredResults.absences.slice(0, 10).map((absence: any) => (
                    <div
                      key={absence.id}
                      className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push('/admin?tab=management')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {absence.student.user.firstName} {absence.student.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{absence.course.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(absence.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Badge
                          className={
                            absence.excused
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {absence.excused ? 'Excusée' : 'Non excusée'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Assignments Results */}
            {(activeCategory === 'all' || activeCategory === 'assignments') && filteredResults.assignments.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiUpload className="w-6 h-6 mr-2 text-purple-600" />
                    Devoirs ({filteredResults.assignments.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredResults.assignments.slice(0, 10).map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push('/admin?tab=management')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{assignment.title}</p>
                          <p className="text-sm text-gray-600">{assignment.course.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Échéance: {new Date(assignment.dueDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {assignment._count?.students || 0} élèves
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* No Results */}
            {totalResults === 0 && (
              <Card>
                <div className="text-center py-12">
                  <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun résultat trouvé</h3>
                  <p className="text-gray-600 mb-6">
                    Essayez avec d'autres mots-clés ou vérifiez l'orthographe
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-sm text-gray-500">Suggestions :</span>
                    <button
                      onClick={() => handleSearch('élève')}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
                    >
                      élève
                    </button>
                    <button
                      onClick={() => handleSearch('classe')}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
                    >
                      classe
                    </button>
                    <button
                      onClick={() => handleSearch('enseignant')}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
                    >
                      enseignant
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FiSearch className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Commencez votre recherche</h3>
              <p className="text-gray-600 mb-6">
                Recherchez des élèves, classes, enseignants, notes, absences ou devoirs
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <FiUsers className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Élèves</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <FiBook className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Classes</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <FiUserCheck className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Enseignants</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Search;

