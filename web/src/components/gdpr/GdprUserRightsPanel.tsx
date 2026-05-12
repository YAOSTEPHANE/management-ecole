'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { FiDownload, FiShield, FiTrash2, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';

/**
 * Panneau RGPD : export des données (portabilité) et demande d’effacement / limitation.
 */
export default function GdprUserRightsPanel() {
  const { user } = useAuth();
  const [details, setDetails] = useState('');
  const [exporting, setExporting] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await authApi.downloadGdprExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-manager-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé (fichier JSON).');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(msg || 'Impossible de générer l’export. Réessayez plus tard.');
    } finally {
      setExporting(false);
    }
  };

  const handleErasureRequest = async () => {
    if (isAdmin) return;
    setRequesting(true);
    try {
      const r = await authApi.requestGdprErasure(details.trim() || undefined);
      toast.success(r.message);
      setDetails('');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(msg || 'Échec de l’envoi de la demande.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Card className="border border-stone-200/90 shadow-sm overflow-hidden">
      <div className="border-b border-stone-200/80 bg-gradient-to-r from-slate-50 to-amber-50/40 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <FiShield className="w-5 h-5 text-amber-800" aria-hidden />
          Données personnelles (RGPD)
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Exercez vos droits d&apos;accès et de portabilité. Pour l&apos;effacement, une obligation de conservation peut
          s&apos;appliquer aux dossiers scolaires.
        </p>
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-stone-200/80 bg-white p-4">
          <div>
            <p className="font-semibold text-stone-900 text-sm">Télécharger mes données</p>
            <p className="text-xs text-stone-600 mt-0.5">
              Fichier JSON lisible (compte, messages, journaux de connexion, données liées à votre rôle).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            isLoading={exporting}
            className="inline-flex items-center gap-2 shrink-0"
          >
            <FiDownload className="w-4 h-4" />
            Exporter (JSON)
          </Button>
        </div>

        {!isAdmin ? (
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 space-y-3">
            <p className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <FiTrash2 className="w-4 h-4 text-stone-600" aria-hidden />
              Demande d&apos;effacement ou de limitation
            </p>
            <p className="text-xs text-stone-600">
              Votre demande est enregistrée et transmise au responsable du traitement (e-mail configuré sur le serveur).
              L&apos;établissement peut conserver certaines informations en application de la réglementation.
            </p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Précisions facultatives (max. 2000 caractères)"
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleErasureRequest}
              disabled={requesting}
              isLoading={requesting}
            >
              Envoyer la demande
            </Button>
          </div>
        ) : (
          <p className="text-xs text-amber-900/90 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
            Compte administrateur : les demandes de suppression de compte ou de limitation se traitent en interne.
            Contactez la direction ou le DPO.
          </p>
        )}

        <p className="text-xs text-stone-500 flex items-start gap-2">
          <FiExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>
            Politique détaillée :{' '}
            <Link href="/privacy" className="font-medium text-amber-900/90 underline-offset-2 hover:underline">
              Confidentialité
            </Link>
            .
          </span>
        </p>
      </div>
    </Card>
  );
}
