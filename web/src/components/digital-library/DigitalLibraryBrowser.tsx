'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import api from '@/services/api/client';
import { digitalLibraryApi, type DigitalResourceRow } from '@/services/api/digitalLibrary.api';
import { DIGITAL_KIND_LABELS, type DigitalLibraryKind } from '@/lib/digitalLibraryKinds';
import { FiBookOpen, FiDownload, FiEye, FiSearch } from 'react-icons/fi';

function formatBytes(n?: number | null) {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DigitalLibraryBrowser({ title = 'Bibliothèque numérique' }: { title?: string }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'' | DigitalLibraryKind>('');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['digital-library', q, kind],
    queryFn: () => digitalLibraryApi.list({ q: q || undefined, kind: kind || undefined }),
  });

  const downloadMut = useMutation({
    mutationFn: (id: string) => digitalLibraryApi.requestDownloadGrant(id),
    onSuccess: (data) => {
      toast.success(`Lien valide ${data.ttlHours} h — téléchargement…`);
      window.open(data.downloadUrl, '_blank');
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Téléchargement impossible');
    },
  });

  const openOnline = async (row: DigitalResourceRow) => {
    try {
      const response = await api.get(`/digital-library/resources/${row.id}/view`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: row.mimeType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Impossible d’ouvrir le document en ligne');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-800">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{title}</h2>
            <p className="text-xs text-stone-600 mt-1">
              E-books, PDF et ressources pédagogiques — lecture en ligne ou téléchargement temporaire.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              placeholder="Rechercher…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as '' | DigitalLibraryKind)}
            aria-label="Type de ressource"
          >
            <option value="">Tous les types</option>
            {Object.entries(DIGITAL_KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {isLoading ? (
        <Card><p className="text-center py-8 text-stone-500 text-sm">Chargement…</p></Card>
      ) : resources.length === 0 ? (
        <Card><p className="text-center py-8 text-stone-500 text-sm">Aucune ressource disponible.</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resources.map((row) => (
            <Card key={row.id} className="p-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="info">{DIGITAL_KIND_LABELS[row.kind]}</Badge>
                {row.level && <Badge variant="default">{row.level}</Badge>}
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">{row.title}</h3>
                {row.author && <p className="text-xs text-stone-600 mt-0.5">{row.author}</p>}
                {row.subject && <p className="text-[11px] text-stone-500">{row.subject}</p>}
                {row.fileSizeBytes != null && (
                  <p className="text-[11px] text-stone-400 mt-1">{formatBytes(row.fileSizeBytes)}</p>
                )}
              </div>
              {row.description && <p className="text-xs text-stone-600 line-clamp-3">{row.description}</p>}
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {row.onlineAccessEnabled && (
                  <Button type="button" size="sm" variant="outline" onClick={() => openOnline(row)}>
                    <FiEye className="w-3.5 h-3.5 mr-1" />
                    Lire en ligne
                  </Button>
                )}
                {row.tempDownloadEnabled && (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={downloadMut.isPending}
                    onClick={() => downloadMut.mutate(row.id)}
                  >
                    <FiDownload className="w-3.5 h-3.5 mr-1" />
                    Téléchargement temporaire
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

