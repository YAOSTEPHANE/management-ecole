import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../../services/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ImageUpload from '../ui/ImageUpload';
import Modal from '../ui/Modal';
import { FiCalendar, FiBook, FiUpload, FiCheck, FiClock, FiFile, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentAssignments = ({ searchQuery = '', searchCategory = 'all', searchDateRange = 'all' }: { searchQuery?: string; searchCategory?: string; searchDateRange?: string }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: studentApi.getAssignments,
  });

  const submitMutation = useMutation({
    mutationFn: ({ assignmentId, fileUrl }: { assignmentId: string; fileUrl: string }) =>
      studentApi.submitAssignment(assignmentId, fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      toast.success('Devoir soumis avec succès');
      setShowSubmitModal(false);
      setSelectedAssignment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission');
    },
  });

  const handleSubmit = (fileUrl: string) => {
    if (selectedAssignment) {
      submitMutation.mutate({
        assignmentId: selectedAssignment.assignment.id,
        fileUrl,
      });
    }
  };

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    
    let filtered = assignments;
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((sa: any) => {
        const title = sa.assignment?.title?.toLowerCase() || '';
        const courseName = sa.assignment?.course?.name?.toLowerCase() || '';
        const description = sa.assignment?.description?.toLowerCase() || '';
        const teacherName = `${sa.assignment?.teacher?.user?.firstName || ''} ${sa.assignment?.teacher?.user?.lastName || ''}`.toLowerCase();
        return title.includes(query) || courseName.includes(query) || description.includes(query) || teacherName.includes(query);
      });
    }
    
    // Filtre par période
    if (searchDateRange !== 'all') {
      const now = new Date();
      let dateLimit = new Date();
      if (searchDateRange === 'week') {
        dateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (searchDateRange === 'month') {
        dateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (searchDateRange === 'semester') {
        dateLimit = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      }
      filtered = filtered.filter((sa: any) => {
        const dueDate = new Date(sa.assignment.dueDate);
        return dueDate >= dateLimit;
      });
    }
    
    return filtered;
  }, [assignments, searchQuery, searchDateRange]);

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des devoirs...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de recherche */}
      {(searchQuery || searchDateRange !== 'all') && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiSearch className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {searchQuery && <>Recherche: <span className="text-purple-600">"{searchQuery}"</span></>}
                </p>
                <p className="text-sm text-gray-600">
                  {filteredAssignments.length} devoir(s) trouvé(s)
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Devoirs</h2>
        {filteredAssignments && filteredAssignments.length > 0 ? (
          <div className="space-y-4">
            {filteredAssignments.map((sa: any) => {
              const isOverdue = new Date(sa.assignment.dueDate) < new Date() && !sa.submitted;
              
              return (
                <Card key={sa.id} hover className="border-l-4 border-blue-500">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {sa.assignment.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <FiBook className="w-4 h-4" />
                              <span>{sa.assignment.course.name}</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                              <FiCalendar className="w-4 h-4" />
                              <span>
                                {new Date(sa.assignment.dueDate).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={sa.submitted ? 'success' : isOverdue ? 'danger' : 'warning'}
                          size="md"
                        >
                          {sa.submitted ? (
                            <>
                              <FiCheck className="w-4 h-4 mr-1 inline" />
                              Rendu
                            </>
                          ) : isOverdue ? (
                            <>
                              <FiClock className="w-4 h-4 mr-1 inline" />
                              En retard
                            </>
                          ) : (
                            <>
                              <FiClock className="w-4 h-4 mr-1 inline" />
                              À faire
                            </>
                          )}
                        </Badge>
                      </div>

                      {sa.assignment.description && (
                        <p className="text-gray-700 mb-3">{sa.assignment.description}</p>
                      )}

                      {sa.assignment.attachments && sa.assignment.attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Pièces jointes :</p>
                          <div className="flex flex-wrap gap-2">
                            {sa.assignment.attachments.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                              >
                                <FiFile className="w-4 h-4" />
                                <span>Fichier {idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {sa.submitted && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Soumis le {new Date(sa.submittedAt).toLocaleDateString('fr-FR')}
                              </p>
                              {sa.fileUrl && (
                                <a
                                  href={sa.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-600 hover:text-green-800 flex items-center space-x-1 mt-1"
                                >
                                  <FiFile className="w-4 h-4" />
                                  <span>Voir le fichier</span>
                                </a>
                              )}
                            </div>
                            {sa.grade !== null && sa.grade !== undefined && (
                              <div className="text-right">
                                <p className="text-xs text-green-600 mb-1">Note</p>
                                <p className="text-2xl font-bold text-green-700">
                                  {sa.grade.toFixed(1)} / 20
                                </p>
                              </div>
                            )}
                          </div>
                          {sa.feedback && (
                            <p className="text-sm text-green-700 mt-2 italic">"{sa.feedback}"</p>
                          )}
                        </div>
                      )}
                    </div>

                    {!sa.submitted && (
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => {
                            setSelectedAssignment(sa);
                            setShowSubmitModal(true);
                          }}
                          variant={isOverdue ? 'danger' : 'primary'}
                        >
                          <FiUpload className="w-4 h-4 mr-2 inline" />
                          {isOverdue ? 'Soumettre (en retard)' : 'Soumettre'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiBook className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">Aucun devoir disponible</p>
            <p className="text-sm">Vos devoirs apparaîtront ici une fois créés par vos enseignants</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setSelectedAssignment(null);
        }}
        title="Soumettre un devoir"
        size="md"
      >
        {selectedAssignment && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{selectedAssignment.assignment.title}</h3>
              <p className="text-sm text-gray-600">
                Cours: {selectedAssignment.assignment.course.name}
              </p>
            </div>
            <ImageUpload
              onUpload={handleSubmit}
              type="assignment"
              label="Fichier du devoir"
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedAssignment(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentAssignments;

