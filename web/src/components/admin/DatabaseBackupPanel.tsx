'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import toast from 'react-hot-toast';
import { FiDatabase, FiDownload, FiLoader, FiRefreshCw, FiUpload } from 'react-icons/fi';
import { adminApi } from '../../services/api';
import Button from '../ui/Button';
import FilterDropdown from '../ui/FilterDropdown';
import Modal from '../ui/Modal';

type DatabaseBackupPanelProps = {
  compact?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DatabaseBackupPanel({ compact = false }: DatabaseBackupPanelProps) {
  const queryClient = useQueryClient();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mongo-backups'],
    queryFn: () => adminApi.listMongoBackups(),
  });

  const archives = data?.archives ?? [];

  const backupMutation = useMutation({
    mutationFn: () => adminApi.runMongoBackupNow(),
    onSuccess: async (resp: { ok?: boolean; filename?: string; error?: string }) => {
      if (resp?.ok === false) {
        toast.error(resp.error || 'Échec de la sauvegarde');
        return;
      }
      toast.success('Sauvegarde créée sur le serveur');
      await queryClient.invalidateQueries({ queryKey: ['mongo-backups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-data-protection-summary'] });
      if (resp?.filename) {
        try {
          await adminApi.downloadMongoBackup(resp.filename);
          toast.success('Téléchargement de l’archive démarré');
        } catch {
          toast('Archive enregistrée sur le serveur (téléchargement manuel possible ci-dessous).', {
            icon: 'ℹ️',
          });
        }
      }
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Échec de la sauvegarde');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () =>
      adminApi.restoreMongoBackup({
        filename: selectedFilename,
        confirmPhrase,
      }),
    onSuccess: (resp: { message?: string }) => {
      toast.success(resp?.message || 'Restauration terminée');
      setRestoreOpen(false);
      setConfirmPhrase('');
      setSelectedFilename('');
      void queryClient.invalidateQueries({ queryKey: ['mongo-backups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-data-protection-summary'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Échec de la restauration');
    },
  });

  const openRestore = () => {
    if (archives.length === 0) {
      toast.error('Aucune sauvegarde disponible. Lancez d’abord une sauvegarde.');
      return;
    }
    setSelectedFilename(archives[0]?.filename ?? '');
    setConfirmPhrase('');
    setRestoreOpen(true);
  };

  const handleDownload = async (filename: string) => {
    try {
      await adminApi.downloadMongoBackup(filename);
      toast.success('Téléchargement démarré');
    } catch {
      toast.error('Impossible de télécharger l’archive');
    }
  };

  return (
    <>
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-3 mb-2">
          <FiDatabase className="w-6 h-6 text-blue-600 shrink-0" />
          <h4 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : ''}`}>Base de données</h4>
        </div>
        <p className={`text-gray-600 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          Sauvegarde complète MongoDB (mongodump). La restauration remplace toutes les données de la base
          actuelle.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => backupMutation.mutate()}
            disabled={backupMutation.isPending}
            className="flex-1 min-w-[140px]"
          >
            {backupMutation.isPending ? (
              <FiLoader className="w-4 h-4 mr-2 inline animate-spin" />
            ) : (
              <FiDownload className="w-4 h-4 mr-2 inline" />
            )}
            Sauvegarder
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={openRestore}
            disabled={restoreMutation.isPending}
            className="flex-1 min-w-[140px]"
          >
            <FiUpload className="w-4 h-4 mr-2 inline" />
            Restaurer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Actualiser la liste"
          >
            <FiRefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-xs text-gray-500">Chargement des archives…</p>
        ) : archives.length === 0 ? (
          <p className="text-xs text-gray-500">Aucune archive sur le serveur.</p>
        ) : (
          <ul className={`space-y-2 max-h-40 overflow-y-auto ${compact ? 'text-xs' : 'text-sm'}`}>
            {archives.slice(0, 8).map((a) => (
              <li
                key={a.filename}
                className="flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-white/80 px-2 py-1.5"
              >
                <span className="min-w-0 truncate text-gray-800" title={a.filename}>
                  {format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  <span className="text-gray-500"> · {formatBytes(a.sizeBytes)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload(a.filename)}
                  className="shrink-0 text-blue-700 hover:text-blue-900 text-xs font-medium underline"
                >
                  Télécharger
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        isOpen={restoreOpen}
        onClose={() => !restoreMutation.isPending && setRestoreOpen(false)}
        title="Restaurer la base de données"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            Action destructive : toutes les collections seront remplacées par le contenu de l’archive
            sélectionnée. Créez une sauvegarde avant de continuer.
          </div>

          <div>
            <FilterDropdown
              label="Archive à restaurer"
              value={selectedFilename}
              onChange={setSelectedFilename}
              options={archives.map((a) => ({
                value: a.filename,
                label: `${format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })} (${formatBytes(a.sizeBytes)})`,
              }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tapez <strong>RESTAURER</strong> pour confirmer
            </label>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="RESTAURER"
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setRestoreOpen(false)}
              disabled={restoreMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 border-red-600"
              disabled={
                restoreMutation.isPending ||
                !selectedFilename ||
                confirmPhrase !== 'RESTAURER'
              }
              onClick={() => restoreMutation.mutate()}
            >
              {restoreMutation.isPending ? (
                <>
                  <FiLoader className="w-4 h-4 mr-2 inline animate-spin" />
                  Restauration…
                </>
              ) : (
                'Lancer la restauration'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
