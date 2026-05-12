import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from './Card';
import Badge from './Badge';
import { FiWifi, FiWifiOff, FiCheckCircle, FiAlertCircle, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface ExternalNFCReceiverProps {
  courseId?: string | null;
  selectedDate?: string;
  onScanReceived?: (data: any) => void;
  pollingInterval?: number; // Intervalle de polling en ms (défaut: 2000)
  apiEndpoint?: string; // Endpoint pour recevoir les scans (optionnel)
}

const ExternalNFCReceiver: React.FC<ExternalNFCReceiverProps> = ({
  courseId = null,
  selectedDate,
  onScanReceived,
  pollingInterval = 2000,
  apiEndpoint,
}) => {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());

  // Si un endpoint est fourni, on peut faire du polling
  // Sinon, on attend que le composant parent envoie les scans via onScanReceived

  const handleScan = (scanData: any) => {
    if (!scanData || !scanData.nfcId) return;

    // Éviter les scans en double
    if (scannedIds.has(scanData.nfcId)) {
      return;
    }

    setLastScan(scanData);
    setScannedIds((prev) => new Set([...prev, scanData.nfcId]));

    if (onScanReceived) {
      onScanReceived(scanData);
    }
  };

  // Exposer une méthode pour recevoir des scans depuis l'extérieur
  useEffect(() => {
    // Créer un event listener global pour recevoir les scans
    const handleExternalScan = (event: CustomEvent) => {
      handleScan(event.detail);
    };

    window.addEventListener('externalNFCScan' as any, handleExternalScan as EventListener);

    return () => {
      window.removeEventListener('externalNFCScan' as any, handleExternalScan as EventListener);
    };
  }, [onScanReceived]);

  const clearLastScan = () => {
    setLastScan(null);
  };

  return (
    <Card className="w-full">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isActive 
                ? 'bg-green-100 animate-pulse' 
                : 'bg-gray-100'
            }`}>
              {isActive ? (
                <FiWifi className="w-6 h-6 text-green-600" />
              ) : (
                <FiWifiOff className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Récepteur externe</h3>
              <p className="text-sm text-gray-600">
                {isActive
                  ? 'En attente de lectures (carte, borne NFC ou terminal biométrique configuré)…'
                  : 'Inactif — lecteurs envoyant un identifiant élève vers l’API'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                isActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isActive ? 'Arrêter' : 'Démarrer'}
            </button>
          </div>
        </div>

        {/* Zone de statut */}
        <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isActive
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50'
        }`}>
          {isActive ? (
            <div className="space-y-3">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="text-green-700 font-medium">En attente de scans depuis l'appareil externe...</p>
              <p className="text-xs text-green-600">
                Connectez votre appareil NFC et configurez-le pour envoyer les scans à cette interface
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <FiWifiOff className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">Récepteur inactif</p>
              <p className="text-xs text-gray-500">
                Cliquez sur "Démarrer" pour activer la réception des scans
              </p>
            </div>
          )}
        </div>

        {/* Dernier scan reçu */}
        {lastScan && (
          <Card className="bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Dernier scan reçu</h4>
              </div>
              <button
                onClick={clearLastScan}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Effacer
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ID NFC:</span>
                <span className="font-mono text-gray-900">{lastScan.nfcId}</span>
              </div>
              {lastScan.timestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Heure:</span>
                  <span className="text-gray-900">
                    {new Date(lastScan.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800 font-medium mb-2">📋 Instructions pour l'appareil externe :</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">1. Configuration de l'appareil NFC :</p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside ml-2">
                <li>Endpoint : <code className="bg-white px-1 rounded">POST {window.location.origin}/api/nfc/scan</code></li>
                <li>Header : <code className="bg-white px-1 rounded">X-NFC-API-Key: votre-cle-api</code></li>
                <li>Content-Type : <code className="bg-white px-1 rounded">application/json</code></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">2. Format de la requête JSON :</p>
              <pre className="text-xs bg-white p-2 rounded border border-blue-300 overflow-x-auto">
{`{
  "nfcId": "ID_CARTE_NFC",
  "courseId": "${courseId || 'ID_DU_COURS'}",
  "date": "${selectedDate || new Date().toISOString().split('T')[0]}",
  "autoStatus": "PRESENT"
}`}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">3. Clé API :</p>
              <p className="text-xs text-blue-700">
                Configurez la variable <code className="bg-white px-1 rounded">NFC_API_KEY</code> dans le fichier <code className="bg-white px-1 rounded">server/.env</code>
              </p>
            </div>
            <div className="pt-2 border-t border-blue-300">
              <p className="text-xs text-blue-600">
                📖 Documentation complète : <code className="bg-white px-1 rounded">server/NFC_DEVICE_API.md</code>
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {scannedIds.size > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Scans reçus aujourd'hui:</span>
              <Badge variant="info">{scannedIds.size}</Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Fonction utilitaire pour déclencher un scan depuis l'extérieur
export const triggerExternalNFCScan = (scanData: { nfcId: string; [key: string]: any }) => {
  const event = new CustomEvent('externalNFCScan', { detail: scanData });
  window.dispatchEvent(event);
};

export default ExternalNFCReceiver;

