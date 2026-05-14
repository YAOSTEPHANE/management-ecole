'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { healthApi } from '@/services/api/health.api';
import MedicalRecordWorkspace from './MedicalRecordWorkspace';
import HealthReportsPanel from './HealthReportsPanel';
import NurseInternalMessaging from './NurseInternalMessaging';
import { FiActivity, FiBarChart2, FiClipboard, FiHeart, FiMessageCircle, FiPlus, FiUser } from 'react-icons/fi';

const OUTCOMES = [
  { value: 'RETURN_TO_CLASS', label: 'Retour en classe' },
  { value: 'SENT_HOME', label: 'Retour à domicile' },
  { value: 'PARENT_PICKUP', label: 'Récupération parent' },
  { value: 'REFERRED_HOSPITAL', label: 'Orientation hôpital / SAMU' },
  { value: 'REST_INFIRMARY', label: 'Repos infirmerie' },
  { value: 'OTHER', label: 'Autre' },
];

const CAMPAIGN_KINDS = [
  { value: 'VACCINATION', label: 'Vaccination' },
  { value: 'HEALTH_CHECKUP', label: 'Bilan de santé' },
  { value: 'AWARENESS', label: 'Sensibilisation' },
  { value: 'EMERGENCY_PREP', label: 'Urgences / exercice' },
];

type Tab = 'dossiers' | 'visites' | 'suivi' | 'rapports' | 'communication';

export default function NurseHealthModule() {
  const [tab, setTab] = useState<Tab>('dossiers');

  const tabs: { id: Tab; label: string; icon: typeof FiHeart }[] = [
    { id: 'dossiers', label: 'Fiches médicales', icon: FiUser },
    { id: 'visites', label: 'Visites infirmerie', icon: FiClipboard },
    { id: 'suivi', label: 'Suivi sanitaire', icon: FiActivity },
    { id: 'rapports', label: 'Rapports & stats', icon: FiBarChart2 },
    { id: 'communication', label: 'Messagerie', icon: FiMessageCircle },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-3 border border-rose-100 bg-rose-50/40 text-xs text-rose-950">
        Données de santé sensibles (RGPD). Accès réservé à l'infirmerie et à l'administration.
      </Card>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
                tab === t.id ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-stone-200 text-stone-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'dossiers' && <MedicalRecordWorkspace />}
      {tab === 'visites' && <VisitesTab />}
      {tab === 'suivi' && <SuiviTab />}
      {tab === 'rapports' && <HealthReportsPanel />}
      {tab === 'communication' && <NurseInternalMessaging />}
    </div>
  );
}

function VisitesTab() {
  const qc = useQueryClient();
  const { data: visits = [], isLoading } = useQuery({ queryKey: ['health-visits'], queryFn: () => healthApi.listVisits() });
  const [studentQ, setStudentQ] = useState('');
  const [studentId, setStudentId] = useState('');
  const { data: search = [] } = useQuery({
    queryKey: ['health-student-search-v', studentQ],
    queryFn: () => healthApi.searchStudents(studentQ),
    enabled: studentQ.trim().length >= 2,
  });
  const [motive, setMotive] = useState('');
  const [care, setCare] = useState('');
  const [meds, setMeds] = useState('');
  const [outcome, setOutcome] = useState('RETURN_TO_CLASS');
  const [certUrl, setCertUrl] = useState('');
  const [parentNotified, setParentNotified] = useState(false);

  const createMut = useMutation({
    mutationFn: () =>
      healthApi.createVisit({
        studentId,
        motive,
        careAdministered: care,
        medicationsGiven: meds,
        outcome,
        medicalCertificateUrl: certUrl || undefined,
        parentNotified,
      }),
    onSuccess: () => {
      toast.success('Visite enregistrée');
      qc.invalidateQueries({ queryKey: ['health-visits'] });
      setMotive('');
      setCare('');
      setMeds('');
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Nouveau passage à l'infirmerie</h3>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Rechercher élève…" value={studentQ} onChange={(e) => setStudentQ(e.target.value)} />
        {search.length > 0 && (
          <ul className="border rounded-lg divide-y text-sm max-h-32 overflow-y-auto">
            {(search as { id: string; user?: { firstName?: string; lastName?: string } }[]).map((s) => (
              <li key={s.id}>
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-stone-50" onClick={() => { setStudentId(s.id); setStudentQ(`${s.user?.lastName} ${s.user?.firstName}`); }}>
                  {s.user?.lastName} {s.user?.firstName}
                </button>
              </li>
            ))}
          </ul>
        )}
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motif de visite *" value={motive} onChange={(e) => setMotive(e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Soins administrés" value={care} onChange={(e) => setCare(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Médicaments donnés" value={meds} onChange={(e) => setMeds(e.target.value)} />
        <select className="w-full border rounded-lg px-3 py-2 text-sm" value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Issue de la visite">
          {OUTCOMES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="URL certificat médical (optionnel)" value={certUrl} onChange={(e) => setCertUrl(e.target.value)} />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={parentNotified} onChange={(e) => setParentNotified(e.target.checked)} />
          Famille prévenue
        </label>
        <Button type="button" size="sm" disabled={!studentId || !motive.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
          <FiPlus className="w-4 h-4 mr-1" /> Enregistrer la visite
        </Button>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Registre des visites</h3>
        {isLoading ? <p className="text-sm text-stone-500">Chargement…</p> : (
          <ul className="space-y-2 text-sm">
            {(visits as { id: string; visitedAt: string; motive: string; outcome: string; student?: { user?: { firstName?: string; lastName?: string } } }[]).map((v) => (
              <li key={v.id} className="border border-stone-100 rounded-lg px-3 py-2">
                <p className="font-medium">{v.student?.user?.lastName} {v.student?.user?.firstName}</p>
                <p className="text-xs text-stone-600">{new Date(v.visitedAt).toLocaleString('fr-FR')} — {v.motive}</p>
                <Badge variant="default">{OUTCOMES.find((o) => o.value === v.outcome)?.label ?? v.outcome}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SuiviTab() {
  const qc = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ['health-stats'], queryFn: healthApi.getStatistics });
  const { data: campaigns = [] } = useQuery({ queryKey: ['health-campaigns'], queryFn: healthApi.listCampaigns });
  const { data: emergencies = [] } = useQuery({ queryKey: ['health-emergencies'], queryFn: healthApi.listEmergencies });

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('VACCINATION');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const campMut = useMutation({
    mutationFn: () => healthApi.createCampaign({ title, kind, startDate }),
    onSuccess: () => {
      toast.success('Campagne créée');
      setTitle('');
      qc.invalidateQueries({ queryKey: ['health-campaigns'] });
    },
  });

  const [emDesc, setEmDesc] = useState('');
  const emMut = useMutation({
    mutationFn: () => healthApi.createEmergency({ description: emDesc, severity: 'HIGH' }),
    onSuccess: () => {
      toast.success('Urgence signalée');
      setEmDesc('');
      qc.invalidateQueries({ queryKey: ['health-emergencies'] });
    },
  });

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="p-3"><p className="text-xs text-stone-500">Visites ce mois</p><p className="text-xl font-bold">{(stats as { visitsMonth: number }).visitsMonth}</p></Card>
          <Card className="p-3"><p className="text-xs text-stone-500">Traitements actifs</p><p className="text-xl font-bold">{(stats as { activeTreatments: number }).activeTreatments}</p></Card>
          <Card className="p-3"><p className="text-xs text-stone-500">Urgences ouvertes</p><p className="text-xl font-bold">{(stats as { openEmergencies: number }).openEmergencies}</p></Card>
        </div>
      )}
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">Campagnes (vaccination, bilans, sensibilisation)</h3>
        <div className="flex flex-wrap gap-2">
          <input className="border rounded-lg px-2 py-1 text-sm flex-1 min-w-[140px]" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="border rounded-lg px-2 py-1 text-sm" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type de campagne">
            {CAMPAIGN_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <input type="date" className="border rounded-lg px-2 py-1 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Date de début" />
          <Button type="button" size="sm" disabled={!title.trim()} onClick={() => campMut.mutate()}>Créer</Button>
        </div>
        <ul className="text-xs space-y-1 mt-2">
          {(campaigns as { id: string; title: string; kind: string }[]).map((c) => (
            <li key={c.id}>{c.title} — {CAMPAIGN_KINDS.find((k) => k.value === c.kind)?.label}</li>
          ))}
        </ul>
      </Card>
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">Gestion des urgences</h3>
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Description de l'urgence" value={emDesc} onChange={(e) => setEmDesc(e.target.value)} />
        <Button type="button" size="sm" variant="primary" disabled={!emDesc.trim()} onClick={() => emMut.mutate()}>Signaler</Button>
        <ul className="text-xs space-y-1 mt-2">
          {(emergencies as { id: string; description: string; severity: string; resolvedAt?: string }[]).map((e) => (
            <li key={e.id} className={e.resolvedAt ? 'text-stone-400' : 'text-rose-800 font-medium'}>{e.description}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
