'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { healthApi } from '@/services/api/health.api';
import { FiActivity, FiClipboard, FiHeart, FiPlus, FiSearch, FiUser } from 'react-icons/fi';

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

type Tab = 'dossiers' | 'visites' | 'suivi';

export default function NurseHealthModule() {
  const [tab, setTab] = useState<Tab>('dossiers');

  const tabs: { id: Tab; label: string; icon: typeof FiHeart }[] = [
    { id: 'dossiers', label: '8.1 Dossiers médicaux', icon: FiUser },
    { id: 'visites', label: '8.2 Visites infirmerie', icon: FiClipboard },
    { id: 'suivi', label: '8.3 Suivi sanitaire', icon: FiActivity },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-3 border border-rose-100 bg-rose-50/40 text-xs text-rose-950">
        Données de santé sensibles (RGPD). Accès réservé à l’infirmerie et à l’administration.
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
      {tab === 'dossiers' && <DossiersTab />}
      {tab === 'visites' && <VisitesTab />}
      {tab === 'suivi' && <SuiviTab />}
    </div>
  );
}

function DossiersTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [studentId, setStudentId] = useState('');
  const { data: search = [] } = useQuery({
    queryKey: ['health-student-search', q],
    queryFn: () => healthApi.searchStudents(q),
    enabled: q.trim().length >= 2,
  });
  const { data: dossier, isLoading } = useQuery({
    queryKey: ['health-dossier', studentId],
    queryFn: () => healthApi.getDossier(studentId),
    enabled: !!studentId,
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const saveMut = useMutation({
    mutationFn: () => healthApi.saveDossier(studentId, form),
    onSuccess: () => {
      toast.success('Dossier enregistré');
      qc.invalidateQueries({ queryKey: ['health-dossier', studentId] });
    },
    onError: () => toast.error('Erreur enregistrement'),
  });

  const loadDossier = (d: Record<string, unknown>) => {
    const hd = (d.healthDossier as Record<string, string>) || {};
    setForm({
      medicalHistory: hd.medicalHistory || '',
      familyDoctorName: hd.familyDoctorName || '',
      familyDoctorPhone: hd.familyDoctorPhone || '',
      preferredHospital: hd.preferredHospital || '',
      insuranceInfo: hd.insuranceInfo || '',
      additionalNotes: hd.additionalNotes || '',
      medicalInfo: String(d.medicalInfo || ''),
      allergies: String(d.allergies || ''),
      emergencyContact: String(d.emergencyContact || ''),
      emergencyPhone: String(d.emergencyPhone || ''),
      emergencyContact2: String(d.emergencyContact2 || ''),
      emergencyPhone2: String(d.emergencyPhone2 || ''),
    });
  };

  useEffect(() => {
    if (dossier) loadDossier(dossier as Record<string, unknown>);
  }, [dossier, studentId]);

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Rechercher un élève (min. 2 caractères)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {search.length > 0 && (
          <ul className="border rounded-lg divide-y max-h-40 overflow-y-auto text-sm">
            {(search as { id: string; studentId: string; user?: { firstName?: string; lastName?: string } }[]).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-stone-50 ${studentId === s.id ? 'bg-rose-50' : ''}`}
                  onClick={() => {
                    setStudentId(s.id);
                    setQ(`${s.user?.lastName} ${s.user?.firstName}`);
                  }}
                >
                  {s.user?.lastName} {s.user?.firstName} — {s.studentId}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {studentId && (
        isLoading ? (
          <p className="text-sm text-stone-500">Chargement du dossier…</p>
        ) : dossier ? (
          <div className="space-y-4">
            <Card className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
              <Field label="Historique médical" k="medicalHistory" form={form} setForm={setForm} rows={3} span />
              <Field label="Infos médicales (fiche élève)" k="medicalInfo" form={form} setForm={setForm} rows={2} span />
              <Field label="Allergies (texte libre)" k="allergies" form={form} setForm={setForm} span />
              <Field label="Médecin traitant" k="familyDoctorName" form={form} setForm={setForm} />
              <Field label="Tél. médecin" k="familyDoctorPhone" form={form} setForm={setForm} />
              <Field label="Hôpital de référence" k="preferredHospital" form={form} setForm={setForm} />
              <Field label="Assurance / mutuelle" k="insuranceInfo" form={form} setForm={setForm} />
              <Field label="Contact urgence 1" k="emergencyContact" form={form} setForm={setForm} />
              <Field label="Tél. urgence 1" k="emergencyPhone" form={form} setForm={setForm} />
              <Field label="Contact urgence 2" k="emergencyContact2" form={form} setForm={setForm} />
              <Field label="Tél. urgence 2" k="emergencyPhone2" form={form} setForm={setForm} />
              <Field label="Notes infirmerie" k="additionalNotes" form={form} setForm={setForm} rows={2} span />
              <div className="sm:col-span-2">
                <Button type="button" size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                  Enregistrer le dossier
                </Button>
              </div>
            </Card>
            <VaccinationsBlock studentId={studentId} dossier={dossier} />
            <AllergiesBlock studentId={studentId} dossier={dossier} />
            <TreatmentsBlock studentId={studentId} dossier={dossier} />
          </div>
        ) : null
      )}
    </div>
  );
}

function Field({
  label,
  k,
  form,
  setForm,
  rows = 1,
  span,
}: {
  label: string;
  k: string;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  rows?: number;
  span?: boolean;
}) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label className="text-xs font-medium text-stone-700">{label}</label>
      {rows > 1 ? (
        <textarea
          className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
          rows={rows}
          value={form[k] || ''}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        />
      ) : (
        <input
          className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
          value={form[k] || ''}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        />
      )}
    </div>
  );
}

function VaccinationsBlock({ studentId, dossier }: { studentId: string; dossier: unknown }) {
  const qc = useQueryClient();
  const rows = (dossier as { vaccinations?: { id: string; vaccineName: string; administeredAt: string }[] }).vaccinations || [];
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const addMut = useMutation({
    mutationFn: () => healthApi.addVaccination(studentId, { vaccineName: name, administeredAt: date }),
    onSuccess: () => {
      toast.success('Vaccination ajoutée');
      setName('');
      qc.invalidateQueries({ queryKey: ['health-dossier', studentId] });
    },
  });
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-2">Vaccinations</h3>
      <ul className="text-xs space-y-1 mb-3">
        {rows.map((v) => (
          <li key={v.id}>{v.vaccineName} — {new Date(v.administeredAt).toLocaleDateString('fr-FR')}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input className="border rounded-lg px-2 py-1 text-sm" placeholder="Vaccin" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="date" className="border rounded-lg px-2 py-1 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="button" size="sm" disabled={!name.trim()} onClick={() => addMut.mutate()}>Ajouter</Button>
      </div>
    </Card>
  );
}

function AllergiesBlock({ studentId, dossier }: { studentId: string; dossier: unknown }) {
  const qc = useQueryClient();
  const rows = (dossier as { allergyRecords?: { id: string; allergen: string; severity?: string }[] }).allergyRecords || [];
  const [allergen, setAllergen] = useState('');
  const addMut = useMutation({
    mutationFn: () => healthApi.addAllergy(studentId, { allergen }),
    onSuccess: () => {
      setAllergen('');
      qc.invalidateQueries({ queryKey: ['health-dossier', studentId] });
    },
  });
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-2">Allergies et intolérances</h3>
      <ul className="text-xs space-y-1 mb-3">
        {rows.map((a) => (
          <li key={a.id}>{a.allergen}{a.severity ? ` (${a.severity})` : ''}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="border rounded-lg px-2 py-1 text-sm flex-1" placeholder="Allergène" value={allergen} onChange={(e) => setAllergen(e.target.value)} />
        <Button type="button" size="sm" disabled={!allergen.trim()} onClick={() => addMut.mutate()}>Ajouter</Button>
      </div>
    </Card>
  );
}

function TreatmentsBlock({ studentId, dossier }: { studentId: string; dossier: unknown }) {
  const qc = useQueryClient();
  const rows = (dossier as { treatments?: { id: string; medication: string; isActive: boolean }[] }).treatments || [];
  const [medication, setMedication] = useState('');
  const addMut = useMutation({
    mutationFn: () => healthApi.addTreatment(studentId, { medication }),
    onSuccess: () => {
      setMedication('');
      qc.invalidateQueries({ queryKey: ['health-dossier', studentId] });
    },
  });
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-2">Traitements en cours</h3>
      <ul className="text-xs space-y-1 mb-3">
        {rows.filter((t) => t.isActive).map((t) => (
          <li key={t.id}>{t.medication}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="border rounded-lg px-2 py-1 text-sm flex-1" placeholder="Médicament" value={medication} onChange={(e) => setMedication(e.target.value)} />
        <Button type="button" size="sm" disabled={!medication.trim()} onClick={() => addMut.mutate()}>Ajouter</Button>
      </div>
    </Card>
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
        <h3 className="font-semibold text-sm">Nouveau passage à l’infirmerie</h3>
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
          <input type="date" className="border rounded-lg px-2 py-1 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Description de l’urgence" value={emDesc} onChange={(e) => setEmDesc(e.target.value)} />
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


