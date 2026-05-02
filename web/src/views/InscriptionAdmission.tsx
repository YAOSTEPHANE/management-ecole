'use client';

import { useState } from 'react';
import Link from 'next/link';
import { publicApi } from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Footer from '../components/Footer';
import { getCurrentAcademicYear } from '../utils/academicYear';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiSend,
  FiSearch,
  FiCheckCircle,
  FiBook,
  FiUser,
  FiCalendar,
} from 'react-icons/fi';

const LEVEL_SUGGESTIONS = [
  'Maternelle',
  'CP',
  'CE1',
  'CE2',
  'CM1',
  'CM2',
  '6ème',
  '5ème',
  '4ème',
  '3ème',
  '2nde',
  '1ère',
  'Terminale',
];

const InscriptionAdmission = () => {
  const defaultYear = getCurrentAcademicYear();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    desiredLevel: '',
    academicYear: defaultYear,
    previousSchool: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    motivation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const [trackRef, setTrackRef] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessRef(null);
    try {
      const res = await publicApi.submitAdmission({
        ...form,
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
      });
      const ref = res.admission?.reference;
      if (ref) setSuccessRef(ref);
      toast.success(res.message || 'Demande enregistrée');
      setForm((prev) => ({
        ...prev,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        previousSchool: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        motivation: '',
      }));
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.reference) {
        setSuccessRef(null);
        toast.error(err.response.data.error || 'Demande déjà en cours');
        setTrackRef(err.response.data.reference);
      } else {
        toast.error(err.response?.data?.error || 'Envoi impossible. Réessayez plus tard.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;
    setTracking(true);
    setTrackResult(null);
    try {
      const data = await publicApi.trackAdmission(trackRef.trim());
      setTrackResult(data);
    } catch {
      toast.error('Dossier introuvable. Vérifiez le numéro de référence.');
    } finally {
      setTracking(false);
    }
  };

  const statusFr: Record<string, string> = {
    PENDING: 'En attente de traitement',
    UNDER_REVIEW: 'Dossier à l’étude',
    ACCEPTED: 'Admission acceptée',
    REJECTED: 'Demande refusée',
    WAITLIST: "Liste d'attente",
    ENROLLED: 'Inscription finalisée',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/40">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Candidature
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Inscription & admission
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Déposez une demande de pré-inscription pour l’année scolaire. Le service scolaire étudiera le dossier
            et vous pourrez suivre l’avancement avec le numéro attribué.
          </p>
        </div>

        {successRef && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 text-emerald-900">
            <FiCheckCircle className="w-8 h-8 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Demande bien reçue</p>
              <p className="text-sm mt-1">
                Votre numéro de dossier :{' '}
                <span className="font-mono font-bold text-lg">{successRef}</span>
              </p>
              <p className="text-sm text-emerald-800/90 mt-1">
                Conservez ce numéro pour le suivi ci-dessous ou pour vos échanges avec l’établissement.
              </p>
            </div>
          </div>
        )}

        <Card className="shadow-lg border-0 ring-1 ring-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
              <FiUser className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Formulaire de pré-inscription</h2>
              <p className="text-sm text-gray-500">Tous les champs marqués * sont obligatoires</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Date de naissance *
                </label>
                <input
                  name="dateOfBirth"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MALE">Masculin</option>
                  <option value="FEMALE">Féminin</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FiBook className="w-4 h-4" />
                  Niveau souhaité *
                </label>
                <input
                  name="desiredLevel"
                  required
                  list="levels-suggestions"
                  value={form.desiredLevel}
                  onChange={handleChange}
                  placeholder="Ex. 6ème"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="levels-suggestions">
                  {LEVEL_SUGGESTIONS.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire *</label>
                <input
                  name="academicYear"
                  required
                  value={form.academicYear}
                  onChange={handleChange}
                  placeholder="2025-2026"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Établissement fréquenté précédemment
              </label>
              <input
                name="previousSchool"
                value={form.previousSchool}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable légal</label>
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tél. responsable</label>
                <input
                  name="parentPhone"
                  type="tel"
                  value={form.parentPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email responsable</label>
                <input
                  name="parentEmail"
                  type="email"
                  value={form.parentEmail}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message / motivation</label>
              <textarea
                name="motivation"
                rows={4}
                value={form.motivation}
                onChange={handleChange}
                placeholder="Informations utiles au traitement du dossier…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button type="submit" disabled={submitting} isLoading={submitting} className="inline-flex items-center gap-2">
                <FiSend className="w-4 h-4" />
                Envoyer la demande
              </Button>
              <p className="text-xs text-gray-500 max-w-md">
                En soumettant ce formulaire, vous acceptez que l’établissement traite ces données dans le cadre de
                la procédure d’admission. Consultez aussi nos{' '}
                <Link href="/privacy" className="text-indigo-600 underline">
                  règles de confidentialité
                </Link>
                .
              </p>
            </div>
          </form>
        </Card>

        <Card className="shadow-lg border-0 ring-1 ring-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <FiSearch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Suivi de dossier</h2>
              <p className="text-sm text-gray-500">Saisissez le numéro reçu après votre demande (ex. ADM-2026-ABC12D)</p>
            </div>
          </div>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={trackRef}
              onChange={(e) => setTrackRef(e.target.value.toUpperCase())}
              placeholder="ADM-2026-…"
              className="flex-1 font-mono rounded-lg border border-gray-200 px-3 py-2.5 uppercase focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="submit" variant="secondary" disabled={tracking} isLoading={tracking}>
              Consulter
            </Button>
          </form>

          {trackResult && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Dossier</span>{' '}
                <span className="font-mono font-semibold">{trackResult.reference}</span>
              </p>
              <p>
                <span className="text-gray-500">Candidat</span>{' '}
                <strong>
                  {trackResult.firstName} {trackResult.lastName}
                </strong>
              </p>
              <p>
                <span className="text-gray-500">Statut</span>{' '}
                <strong className="text-indigo-700">
                  {statusFr[trackResult.status] || trackResult.status}
                </strong>
              </p>
              <p>
                <span className="text-gray-500">Niveau visé</span> {trackResult.desiredLevel} —{' '}
                {trackResult.academicYear}
              </p>
              {trackResult.proposedClass && (
                <p>
                  <span className="text-gray-500">Classe proposée</span>{' '}
                  {trackResult.proposedClass.name} ({trackResult.proposedClass.level})
                </p>
              )}
              {trackResult.enrolledStudent && (
                <p className="text-emerald-700 font-medium">
                  Compte élève créé — identifiant : {trackResult.enrolledStudent.studentId}
                </p>
              )}
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default InscriptionAdmission;
