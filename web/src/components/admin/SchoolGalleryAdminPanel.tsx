'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

const SchoolGalleryAdminPanel: React.FC = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [published, setPublished] = useState(true);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-school-gallery'],
    queryFn: () => adminApi.getSchoolGalleryItems(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      adminApi.createSchoolGalleryItem({
        title: title.trim() || null,
        caption: caption.trim() || null,
        imageUrl: imageUrl.trim(),
        sortOrder: parseInt(sortOrder, 10) || 0,
        published,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-school-gallery'] });
      toast.success('Photo ajoutée');
      setModalOpen(false);
      setTitle('');
      setCaption('');
      setImageUrl('');
      setSortOrder('0');
      setPublished(true);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erreur'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, published: p }: { id: string; published: boolean }) =>
      adminApi.updateSchoolGalleryItem(id, { published: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-school-gallery'] }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteSchoolGalleryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-school-gallery'] });
      toast.success('Supprimé');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-xs text-gray-600 max-w-2xl">
          Les éléments <strong>publiés</strong> apparaissent dans le fil portail (familles et élèves), mélangés aux
          annonces et au calendrier scolaire.
        </p>
        <Button type="button" size="sm" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5">
          <FiPlus size={16} />
          Ajouter une photo
        </Button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Chargement…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(items as any[] | undefined)?.map((it) => (
          <Card key={it.id} className="overflow-hidden border border-gray-200">
            <div className="aspect-video bg-gray-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
              <span
                className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  it.published ? 'bg-emerald-600 text-white' : 'bg-gray-800/80 text-white'
                }`}
              >
                {it.published ? 'Publié' : 'Brouillon'}
              </span>
            </div>
            <div className="p-3 space-y-1">
              {it.title ? <p className="font-medium text-sm text-gray-900">{it.title}</p> : null}
              {it.caption ? <p className="text-xs text-gray-600 line-clamp-2">{it.caption}</p> : null}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleMut.mutate({ id: it.id, published: !it.published })}
                  disabled={toggleMut.isPending}
                  className="inline-flex items-center gap-1"
                >
                  {it.published ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  {it.published ? 'Masquer' : 'Publier'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Supprimer cette photo ?')) delMut.mutate(it.id);
                  }}
                  disabled={delMut.isPending}
                  className="inline-flex items-center gap-1"
                >
                  <FiTrash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle photo — galerie">
        <div className="space-y-3 p-1">
          <Input label="URL de l’image *" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          <Input label="Titre (optionnel)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Légende</label>
            <textarea
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm min-h-[72px]"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <Input label="Ordre d’affichage" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} type="number" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              aria-label="Publier immédiatement sur le portail"
            />
            Publier immédiatement sur le portail
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={!imageUrl.trim() || createMut.isPending}
            >
              {createMut.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SchoolGalleryAdminPanel;
