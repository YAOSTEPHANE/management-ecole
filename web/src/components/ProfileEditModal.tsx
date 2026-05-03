'use client';

import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ui/ImageUpload';
import Button from '@/components/ui/Button';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setAvatarUrlInput(user.avatar ?? '');
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      toast.error('Le prénom et le nom sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        firstName: fn,
        lastName: ln,
        phone: phone.trim() === '' ? null : phone.trim(),
      });
      onClose();
    } catch {
      /* toast dans updateProfile */
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFromUpload = async (url: string) => {
    if (url) {
      await refreshUser();
    } else {
      try {
        await updateProfile({ avatar: null });
      } catch {
        /* toast */
      }
    }
  };

  const handleApplyAvatarUrl = async () => {
    const u = avatarUrlInput.trim();
    if (!u) {
      toast.error('Saisissez une URL ou utilisez « Retirer la photo » via l’aperçu.');
      return;
    }
    setSavingUrl(true);
    try {
      await updateProfile({ avatar: u });
    } catch {
      /* toast */
    } finally {
      setSavingUrl(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-stone-200/90 bg-white shadow-lux-soft sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-amber-50/40 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="profile-edit-title" className="font-display text-lg font-bold text-stone-900">
              Modifier mon profil
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Informations visibles dans l’espace connecté. L’e-mail ne peut pas être modifié ici.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 transition hover:bg-white/80 hover:text-stone-800"
            aria-label="Fermer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Photo de profil</h3>
              <p className="mb-3 text-[11px] text-stone-500">
                L’envoi d’un fichier est enregistré tout de suite sur le serveur.
              </p>
              <ImageUpload
                key={`${isOpen}-${user.avatar ?? 'none'}`}
                type="avatar"
                currentImage={user.avatar ?? undefined}
                onUpload={handleAvatarFromUpload}
              />
            </div>

            <div>
              <label htmlFor="profile-avatar-url" className="text-sm font-semibold text-stone-800">
                Ou URL d’image
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="profile-avatar-url"
                  type="url"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://…"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={savingUrl}
                  onClick={handleApplyAvatarUrl}
                  className="shrink-0"
                >
                  Appliquer l’URL
                </Button>
              </div>
            </div>

            <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="profile-email" className="text-sm font-semibold text-stone-800">
                  E-mail
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-600"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-firstname" className="text-sm font-semibold text-stone-800">
                    Prénom
                  </label>
                  <input
                    id="profile-firstname"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                    className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="profile-lastname" className="text-sm font-semibold text-stone-800">
                    Nom
                  </label>
                  <input
                    id="profile-lastname"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="profile-phone" className="text-sm font-semibold text-stone-800">
                  Téléphone
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="Facultatif"
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-stone-100 bg-stone-50/80 px-4 py-3 sm:px-5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="profile-edit-form" size="sm" isLoading={saving}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
