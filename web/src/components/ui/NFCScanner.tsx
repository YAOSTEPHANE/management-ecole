import { useState, useEffect, useCallback } from 'react';
import { FiWifi, FiWifiOff, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import Card from './Card';
import Badge from './Badge';

interface NFCScannerProps {
  onScan: (nfcId: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  autoScan?: boolean;
  className?: string;
}

interface NFCReader extends EventTarget {
  scan: () => Promise<void>;
  cancel: () => Promise<void>;
}

declare global {
  interface Window {
    NDEFReader?: new () => NFCReader;
  }
}

const NFCScanner: React.FC<NFCScannerProps> = ({
  onScan,
  onError,
  enabled = true,
  autoScan = false,
  className = '',
}) => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const readerRef = useState<NFCReader | null>(null)[0];

  // Vérifier le support NFC
  useEffect(() => {
    const checkNFCSupport = () => {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
        if (onError) {
          onError('NFC n\'est pas supporté sur ce navigateur/appareil');
        }
      }
    };

    checkNFCSupport();
  }, [onError]);

  // Scanner NFC
  const startScan = useCallback(async () => {
    if (!isSupported || !enabled) return;

    try {
      if (!window.NDEFReader) {
        throw new Error('NDEFReader n\'est pas disponible');
      }

      const reader = new window.NDEFReader();
      setIsScanning(true);
      setScanStatus('scanning');
      setErrorMessage(null);

      // Écouter les messages NFC
      await reader.scan();

      reader.addEventListener('reading', (event: any) => {
        try {
          const { message } = event;
          if (message && message.records && message.records.length > 0) {
            const record = message.records[0];
            let nfcId = '';

            // Extraire l'ID NFC selon le type de record
            if (record.recordType === 'text') {
              const decoder = new TextDecoder();
              nfcId = decoder.decode(record.data);
            } else if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              nfcId = decoder.decode(record.data);
            } else if (record.recordType === 'mime') {
              const decoder = new TextDecoder();
              nfcId = decoder.decode(record.data);
            } else {
              // Pour les autres types, utiliser l'ID de la carte
              nfcId = record.id || JSON.stringify(record.data);
            }

            if (nfcId) {
              setLastScanned(nfcId);
              setScanStatus('success');
              setIsScanning(false);
              onScan(nfcId);

              // Réinitialiser après 2 secondes
              setTimeout(() => {
                setScanStatus('idle');
                setLastScanned(null);
              }, 2000);
            }
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Erreur lors de la lecture de la carte NFC';
          setErrorMessage(errorMsg);
          setScanStatus('error');
          setIsScanning(false);
          if (onError) {
            onError(errorMsg);
          }
        }
      });

      reader.addEventListener('readingerror', (event: any) => {
        const errorMsg = event.message || 'Erreur lors de la lecture NFC';
        setErrorMessage(errorMsg);
        setScanStatus('error');
        setIsScanning(false);
        if (onError) {
          onError(errorMsg);
        }
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Impossible de démarrer le scanner NFC';
      setErrorMessage(errorMsg);
      setScanStatus('error');
      setIsScanning(false);
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [isSupported, enabled, onScan, onError]);

  // Arrêter le scan
  const stopScan = useCallback(async () => {
    if (readerRef) {
      try {
        await (readerRef as any).cancel();
      } catch (err) {
        // Ignorer les erreurs lors de l'arrêt
      }
    }
    setIsScanning(false);
    setScanStatus('idle');
  }, [readerRef]);

  // Auto-scan si activé
  useEffect(() => {
    if (autoScan && isSupported && enabled && !isScanning) {
      startScan();
    }

    return () => {
      if (isScanning) {
        stopScan();
      }
    };
  }, [autoScan, isSupported, enabled, isScanning, startScan, stopScan]);

  if (isSupported === null) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-8">
          <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Vérification du support NFC...</span>
        </div>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className={`${className} border-2 border-blue-200 bg-blue-50`}>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-3">
            <FiWifiOff className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">NFC du navigateur non supporté</p>
              <p className="text-sm text-blue-700">
                Votre navigateur ou appareil ne supporte pas l'API Web NFC.
              </p>
            </div>
          </div>
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
            <p className="font-semibold text-blue-900 mb-2">💡 Solution : Utilisez un appareil NFC externe</p>
            <p className="text-sm text-blue-800 mb-3">
              Connectez votre lecteur NFC externe et configurez-le pour envoyer les scans à l'API.
            </p>
            <div className="space-y-2 text-xs text-blue-700">
              <p><strong>Endpoint API :</strong> <code className="bg-blue-100 px-2 py-1 rounded">POST /api/nfc/scan</code></p>
              <p><strong>Clé API :</strong> Configurez <code className="bg-blue-100 px-2 py-1 rounded">NFC_API_KEY</code> dans le fichier .env</p>
              <p><strong>Documentation :</strong> Voir <code className="bg-blue-100 px-2 py-1 rounded">server/NFC_DEVICE_API.md</code></p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              scanStatus === 'scanning' 
                ? 'bg-blue-100 animate-pulse' 
                : scanStatus === 'success'
                ? 'bg-green-100'
                : scanStatus === 'error'
                ? 'bg-red-100'
                : 'bg-gray-100'
            }`}>
              {scanStatus === 'scanning' ? (
                <FiWifi className="w-6 h-6 text-blue-600 animate-pulse" />
              ) : scanStatus === 'success' ? (
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              ) : scanStatus === 'error' ? (
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <FiWifi className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scanner NFC</h3>
              <p className="text-sm text-gray-600">
                {scanStatus === 'scanning' 
                  ? 'Approchez la carte...'
                  : scanStatus === 'success'
                  ? 'Carte scannée avec succès'
                  : scanStatus === 'error'
                  ? 'Erreur de scan'
                  : 'Prêt à scanner'}
              </p>
            </div>
          </div>
          {scanStatus === 'scanning' && (
            <Badge variant="info" className="animate-pulse">
              En cours...
            </Badge>
          )}
          {scanStatus === 'success' && (
            <Badge variant="success">
              Succès
            </Badge>
          )}
          {scanStatus === 'error' && (
            <Badge variant="danger">
              Erreur
            </Badge>
          )}
        </div>

        {/* Zone de scan */}
        <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          scanStatus === 'scanning'
            ? 'border-blue-400 bg-blue-50 animate-pulse'
            : scanStatus === 'success'
            ? 'border-green-400 bg-green-50'
            : scanStatus === 'error'
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-gray-50'
        }`}>
          {scanStatus === 'scanning' ? (
            <div className="space-y-3">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-blue-700 font-medium">Approchez la carte NFC...</p>
            </div>
          ) : scanStatus === 'success' ? (
            <div className="space-y-3">
              <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-green-700 font-medium">Carte scannée !</p>
              {lastScanned && (
                <p className="text-xs text-green-600 font-mono bg-white px-3 py-1 rounded inline-block">
                  ID: {lastScanned.substring(0, 20)}...
                </p>
              )}
            </div>
          ) : scanStatus === 'error' ? (
            <div className="space-y-3">
              <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <p className="text-red-700 font-medium">Erreur de scan</p>
              {errorMessage && (
                <p className="text-xs text-red-600">{errorMessage}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <FiWifi className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">Appuyez sur "Démarrer le scan" pour commencer</p>
            </div>
          )}
        </div>

        {/* Dernière carte scannée */}
        {lastScanned && scanStatus !== 'scanning' && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Dernière carte scannée :</p>
            <p className="text-sm font-mono text-gray-900 break-all">{lastScanned}</p>
          </div>
        )}

        {/* Boutons de contrôle */}
        <div className="flex items-center space-x-3">
          {!isScanning ? (
            <button
              onClick={startScan}
              disabled={!enabled}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <FiWifi className="w-5 h-5" />
              <span>Démarrer le scan</span>
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FiWifiOff className="w-5 h-5" />
              <span>Arrêter le scan</span>
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-medium mb-1">Instructions :</p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Appuyez sur "Démarrer le scan"</li>
            <li>Approchez la carte NFC à moins de 5 cm du téléphone</li>
            <li>Attendez la confirmation de scan</li>
            <li>La carte sera automatiquement identifiée</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default NFCScanner;

