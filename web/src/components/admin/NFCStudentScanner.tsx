import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import NFCScanner from '../ui/NFCScanner';
import ExternalNFCReceiver from '../ui/ExternalNFCReceiver';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { FiUser, FiMail, FiPhone, FiBook, FiCalendar, FiCheckCircle, FiXCircle, FiWifi } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const NFCStudentScanner: React.FC = () => {
  const [scannedNFCId, setScannedNFCId] = useState<string | null>(null);
  const [useExternalDevice, setUseExternalDevice] = useState(false);

  // Rechercher l'étudiant par NFC ID
  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: ['student-nfc', scannedNFCId],
    queryFn: () => adminApi.getStudentByNFC(scannedNFCId!),
    enabled: !!scannedNFCId,
    retry: false,
  });

  const handleScan = (nfcId: string) => {
    setScannedNFCId(nfcId);
    refetch();
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const handleClear = () => {
    setScannedNFCId(null);
  };

  // Vérifier si NFC est supporté
  const isNFCSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  return (
    <div className="space-y-6">
      {/* Option pour basculer entre scanner navigateur et appareil externe */}
      {!isNFCSupported && (
        <Card className="bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiWifi className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">NFC du navigateur non supporté</p>
                <p className="text-sm text-blue-700">
                  Utilisez un appareil NFC externe pour scanner les cartes
                </p>
              </div>
            </div>
            <button
              onClick={() => setUseExternalDevice(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Activer Appareil Externe
            </button>
          </div>
        </Card>
      )}

      {isNFCSupported && (
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => setUseExternalDevice(!useExternalDevice)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {useExternalDevice ? 'Utiliser Scanner Navigateur' : 'Utiliser Appareil Externe'}
          </button>
        </div>
      )}

      {!useExternalDevice ? (
        <NFCScanner
          onScan={handleScan}
          onError={handleError}
          className="w-full"
        />
      ) : (
        <ExternalNFCReceiver
          onScanReceived={(scanData) => {
            if (scanData && scanData.nfcId) {
              setScannedNFCId(scanData.nfcId);
            }
          }}
        />
      )}

      {/* Résultats du scan */}
      {scannedNFCId && (
        <Card className="w-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Résultat du scan</h3>
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Recherche de l'étudiant...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FiXCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Étudiant non trouvé</p>
                    <p className="text-sm text-red-700">
                      Aucun étudiant n'est associé à cet ID NFC: <span className="font-mono">{scannedNFCId}</span>
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      Assurez-vous que la carte NFC est correctement enregistrée dans le système.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {student && !isLoading && (
              <div className="space-y-4">
                {/* En-tête avec succès */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FiCheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Étudiant trouvé !</p>
                      <p className="text-sm text-green-700">Carte NFC identifiée avec succès</p>
                    </div>
                  </div>
                </div>

                {/* Informations de l'étudiant */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4 mb-6">
                    <Avatar
                      src={student.user?.avatar}
                      name={`${student.user?.firstName} ${student.user?.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">
                        {student.user?.firstName} {student.user?.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">ID Étudiant: {student.studentId}</p>
                      {student.nfcId && (
                        <p className="text-xs text-gray-500 font-mono mt-1">NFC ID: {student.nfcId}</p>
                      )}
                    </div>
                    <Badge variant={student.isActive ? 'success' : 'danger'}>
                      {student.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Informations de contact */}
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <FiUser className="w-4 h-4" />
                        <span>Informations personnelles</span>
                      </h5>
                      <div className="space-y-2 text-sm">
                        {student.user?.email && (
                          <div className="flex items-center space-x-2 text-gray-700">
                            <FiMail className="w-4 h-4 text-gray-400" />
                            <span>{student.user.email}</span>
                          </div>
                        )}
                        {student.user?.phone && (
                          <div className="flex items-center space-x-2 text-gray-700">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            <span>{student.user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-gray-700">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          <span>
                            Né(e) le: {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          <span>
                            Inscrit(e) le: {new Date(student.enrollmentDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informations académiques */}
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <FiBook className="w-4 h-4" />
                        <span>Informations académiques</span>
                      </h5>
                      <div className="space-y-2 text-sm">
                        {student.class ? (
                          <div className="flex items-center space-x-2 text-gray-700">
                            <FiBook className="w-4 h-4 text-gray-400" />
                            <span>
                              {student.class.name} - {student.class.level}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">Aucune classe assignée</div>
                        )}
                        <div className="flex items-center space-x-2 text-gray-700">
                          <FiUser className="w-4 h-4 text-gray-400" />
                          <span>Genre: {student.gender}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations d'urgence */}
                  {student.emergencyContact && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-2">Contact d'urgence</h5>
                      <div className="text-sm text-gray-700">
                        <p>{student.emergencyContact}</p>
                        {student.emergencyPhone && (
                          <p className="mt-1">{student.emergencyPhone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parents */}
                  {student.parents && student.parents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-2">Parents / Tuteurs</h5>
                      <div className="space-y-2">
                        {student.parents.map((parentRelation: any, index: number) => (
                          <div key={index} className="text-sm text-gray-700">
                            <p className="font-medium">
                              {parentRelation.parent.user.firstName} {parentRelation.parent.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {parentRelation.relation} • {parentRelation.parent.user.phone}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NFCStudentScanner;

