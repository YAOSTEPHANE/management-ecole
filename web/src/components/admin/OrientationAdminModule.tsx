"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiBookOpen,
  FiBriefcase,
  FiClipboard,
  FiEdit2,
  FiLayers,
  FiNavigation,
  FiPlus,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { adminApi } from "@/services/api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { ADM } from "./adminModuleLayout";
import {
  ORIENTATION_ADVICE_AUDIENCE_FR,
  ORIENTATION_FOLLOW_UP_STATUS_FR,
  ORIENTATION_PARTNERSHIP_KIND_FR,
  ORIENTATION_PLACEMENT_KIND_FR,
  ORIENTATION_PLACEMENT_STATUS_FR,
} from "@/lib/orientationLabels";

type Tab =
  | "filieres"
  | "partnerships"
  | "tests"
  | "advice"
  | "followups"
  | "placements";

export default function OrientationAdminModule() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("filieres");
  const [fuStudent, setFuStudent] = useState("");
  const [fuYear, setFuYear] = useState("");
  const [plStudent, setPlStudent] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["admin-orientation-students"],
    queryFn: adminApi.getStudents,
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ["admin-orientation-staff-users"],
    queryFn: () => adminApi.getAllUsers({ isActive: true }),
  });

  const counselorOptions = useMemo(() => {
    const arr = (staffUsers as { id: string; role: string; firstName: string; lastName: string }[]).filter(
      (u) => u.role !== "STUDENT" && u.role !== "PARENT"
    );
    return arr.slice(0, 200);
  }, [staffUsers]);

  const { data: filieres = [], isLoading: lf } = useQuery({
    queryKey: ["admin-orientation-filieres"],
    queryFn: () => adminApi.getOrientationFilieres(),
    enabled: tab === "filieres",
  });

  const { data: partnerships = [], isLoading: lp } = useQuery({
    queryKey: ["admin-orientation-partnerships"],
    queryFn: () => adminApi.getOrientationPartnerships(),
    enabled: tab === "partnerships",
  });

  const { data: tests = [], isLoading: lt } = useQuery({
    queryKey: ["admin-orientation-tests"],
    queryFn: () => adminApi.getOrientationAptitudeTests(),
    enabled: tab === "tests",
  });

  const { data: advice = [], isLoading: la } = useQuery({
    queryKey: ["admin-orientation-advice"],
    queryFn: () => adminApi.getOrientationAdvice(),
    enabled: tab === "advice",
  });

  const { data: followUps = [], isLoading: lfu } = useQuery({
    queryKey: ["admin-orientation-followups", fuStudent, fuYear],
    queryFn: () =>
      adminApi.getOrientationFollowUps({
        studentId: fuStudent || undefined,
        academicYear: fuYear.trim() || undefined,
      }),
    enabled: tab === "followups",
  });

  const { data: placements = [], isLoading: lpl } = useQuery({
    queryKey: ["admin-orientation-placements", plStudent],
    queryFn: () => adminApi.getOrientationPlacements({ studentId: plStudent || undefined }),
    enabled: tab === "placements",
  });

  const invalidate = (k: string) => void qc.invalidateQueries({ queryKey: [k] });

  const del = useMutation({
    mutationFn: async ({ path, id, key }: { path: string; id: string; key: string }) => {
      if (path === "filieres") await adminApi.deleteOrientationFiliere(id);
      else if (path === "partnerships") await adminApi.deleteOrientationPartnership(id);
      else if (path === "tests") await adminApi.deleteOrientationAptitudeTest(id);
      else if (path === "advice") await adminApi.deleteOrientationAdvice(id);
      else if (path === "followups") await adminApi.deleteOrientationFollowUp(id);
      else await adminApi.deleteOrientationPlacement(id);
      return key;
    },
    onSuccess: (key) => {
      toast.success("Supprimé.");
      invalidate(key);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  const TabBtn = ({ id, label, icon: Icon }: { id: Tab; label: string; icon: typeof FiLayers }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={ADM.bigTabBtn(tab === id, "bg-gradient-to-r from-indigo-600 to-violet-600")}
    >
      <Icon className={ADM.bigTabIcon} aria-hidden />
      {label}
    </button>
  );

  return (
    <div className={ADM.pageRoot}>
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-[1px] shadow-lg">
        <div className="rounded-[15px] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className={ADM.heroTitle}>Orientation</h2>
              <p className={`${ADM.heroSub} text-stone-600 max-w-2xl`}>
                Filières, tests d’aptitude, conseils, partenariats, suivi individualisé, stages et apprentissages.
              </p>
            </div>
            <FiNavigation className="w-10 h-10 text-violet-600 shrink-0 hidden sm:block" aria-hidden />
          </div>
        </div>
      </div>

      <div className={`${ADM.bigTabRow} flex-wrap`}>
        <TabBtn id="filieres" label="Filières" icon={FiBookOpen} />
        <TabBtn id="partnerships" label="Partenariats" icon={FiBriefcase} />
        <TabBtn id="tests" label="Tests d’aptitude" icon={FiClipboard} />
        <TabBtn id="advice" label="Conseils" icon={FiLayers} />
        <TabBtn id="followups" label="Suivi élèves" icon={FiUsers} />
        <TabBtn id="placements" label="Stages" icon={FiNavigation} />
      </div>

      {tab === "filieres" && (
        <FiliereTab rows={filieres as Record<string, unknown>[]} loading={lf} onInvalidate={() => invalidate("admin-orientation-filieres")} del={del} />
      )}
      {tab === "partnerships" && (
        <PartnershipTab rows={partnerships as Record<string, unknown>[]} loading={lp} onInvalidate={() => invalidate("admin-orientation-partnerships")} del={del} />
      )}
      {tab === "tests" && (
        <TestsTab rows={tests as Record<string, unknown>[]} loading={lt} onInvalidate={() => invalidate("admin-orientation-tests")} del={del} />
      )}
      {tab === "advice" && (
        <AdviceTab rows={advice as Record<string, unknown>[]} loading={la} onInvalidate={() => invalidate("admin-orientation-advice")} del={del} />
      )}
      {tab === "followups" && (
        <FollowUpsTab
          rows={followUps as Record<string, unknown>[]}
          loading={lfu}
          students={students as { id: string; user?: { firstName: string; lastName: string } }[]}
          staff={counselorOptions}
          fuStudent={fuStudent}
          setFuStudent={setFuStudent}
          fuYear={fuYear}
          setFuYear={setFuYear}
          onInvalidate={() => invalidate("admin-orientation-followups")}
          del={del}
        />
      )}
      {tab === "placements" && (
        <PlacementsTab
          rows={placements as Record<string, unknown>[]}
          loading={lpl}
          students={students as { id: string; user?: { firstName: string; lastName: string } }[]}
          plStudent={plStudent}
          setPlStudent={setPlStudent}
          onInvalidate={() => invalidate("admin-orientation-placements")}
          del={del}
        />
      )}
    </div>
  );
}

function FiliereTab({
  rows,
  loading,
  onInvalidate,
  del,
}: {
  rows: Record<string, unknown>[];
  loading: boolean;
  onInvalidate: () => void;
  del: { mutate: (args: { path: string; id: string; key: string }) => void };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [levelHint, setLevelHint] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOrientationFiliere(editing, { title, summary, body, levelHint, externalUrl, sortOrder, isPublished })
        : adminApi.createOrientationFiliere({ title, summary, body, levelHint, externalUrl, sortOrder, isPublished }),
    onSuccess: () => {
      toast.success(editing ? "Mis à jour." : "Créé.");
      onInvalidate();
      setEditing(null);
      setTitle("");
      setSummary("");
      setBody("");
      setLevelHint("");
      setExternalUrl("");
      setSortOrder(0);
      setIsPublished(false);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  const startEdit = (r: Record<string, unknown>) => {
    setEditing(String(r.id));
    setTitle(String(r.title ?? ""));
    setSummary(String(r.summary ?? ""));
    setBody(String(r.body ?? ""));
    setLevelHint(String(r.levelHint ?? ""));
    setExternalUrl(String(r.externalUrl ?? ""));
    setSortOrder(Number(r.sortOrder ?? 0));
    setIsPublished(Boolean(r.isPublished));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card variant="premium" className="!p-4 space-y-2 max-h-[560px] overflow-y-auto">
        <h3 className={ADM.h2}>Fiches filières</h3>
        {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}
        {rows.map((r) => (
          <div key={String(r.id)} className="rounded-lg border border-gray-200 p-2 flex justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{String(r.title)}</p>
              <p className="text-xs text-gray-500">{r.isPublished ? "Publié" : "Brouillon"}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button type="button" className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => startEdit(r)}>
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                onClick={() => {
                  if (confirm("Supprimer ?")) del.mutate({ path: "filieres", id: String(r.id), key: "admin-orientation-filieres" });
                }}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>
      <Card variant="premium" className="!p-4 space-y-2 text-xs">
        <h3 className={ADM.h2}>{editing ? "Modifier" : "Nouvelle fiche"}</h3>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Résumé court" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={6} placeholder="Contenu (détail filière)" value={body} onChange={(e) => setBody(e.target.value)} />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Niveau visé (ex. Terminale)" value={levelHint} onChange={(e) => setLevelHint(e.target.value)} />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Lien externe" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
        <label className="flex items-center gap-2">
          Ordre <input type="number" className="border rounded px-2 py-1 w-20" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Publié (portail)
        </label>
        <div className="flex gap-2">
          <Button type="button" disabled={!title.trim() || !body.trim() || save.isPending} onClick={() => save.mutate()}>
            <FiPlus className="w-4 h-4 mr-1 inline" />
            Enregistrer
          </Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={() => { setEditing(null); setTitle(""); setSummary(""); setBody(""); setLevelHint(""); setExternalUrl(""); setSortOrder(0); setIsPublished(false); }}>
              Annuler
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function PartnershipTab({
  rows,
  loading,
  onInvalidate,
  del,
}: {
  rows: Record<string, unknown>[];
  loading: boolean;
  onInvalidate: () => void;
  del: { mutate: (args: { path: string; id: string; key: string }) => void };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [kind, setKind] = useState<"UNIVERSITY" | "COMPANY" | "OTHER">("UNIVERSITY");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOrientationPartnership(editing, { organizationName, kind, description, website, contactEmail, sortOrder, isPublished })
        : adminApi.createOrientationPartnership({ organizationName, kind, description, website, contactEmail, sortOrder, isPublished }),
    onSuccess: () => {
      toast.success("Enregistré.");
      onInvalidate();
      setEditing(null);
      setOrganizationName("");
      setKind("UNIVERSITY");
      setDescription("");
      setWebsite("");
      setContactEmail("");
      setSortOrder(0);
      setIsPublished(false);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card variant="premium" className="!p-4 space-y-2 max-h-[560px] overflow-y-auto">
        <h3 className={ADM.h2}>Partenariats</h3>
        {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}
        {rows.map((r) => (
          <div key={String(r.id)} className="rounded-lg border p-2 flex justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{String(r.organizationName)}</p>
              <p className="text-xs text-gray-600">{ORIENTATION_PARTNERSHIP_KIND_FR[String(r.kind)] ?? String(r.kind)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setEditing(String(r.id));
                  setOrganizationName(String(r.organizationName ?? ""));
                  setKind((r.kind as typeof kind) || "UNIVERSITY");
                  setDescription(String(r.description ?? ""));
                  setWebsite(String(r.website ?? ""));
                  setContactEmail(String(r.contactEmail ?? ""));
                  setSortOrder(Number(r.sortOrder ?? 0));
                  setIsPublished(Boolean(r.isPublished));
                }}
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-red-600"
                onClick={() => {
                  if (confirm("Supprimer ?")) del.mutate({ path: "partnerships", id: String(r.id), key: "admin-orientation-partnerships" });
                }}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>
      <Card variant="premium" className="!p-4 space-y-2 text-xs">
        <h3 className={ADM.h2}>{editing ? "Modifier" : "Nouveau"}</h3>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Organisme" />
        <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="UNIVERSITY">{ORIENTATION_PARTNERSHIP_KIND_FR.UNIVERSITY}</option>
          <option value="COMPANY">{ORIENTATION_PARTNERSHIP_KIND_FR.COMPANY}</option>
          <option value="OTHER">{ORIENTATION_PARTNERSHIP_KIND_FR.OTHER}</option>
        </select>
        <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Site web" />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact e-mail" />
        <label className="flex items-center gap-2">
          Ordre <input type="number" className="border rounded px-2 w-20" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Publié
        </label>
        <Button type="button" disabled={!organizationName.trim() || save.isPending} onClick={() => save.mutate()}>
          Enregistrer
        </Button>
      </Card>
    </div>
  );
}

function TestsTab({
  rows,
  loading,
  onInvalidate,
  del,
}: {
  rows: Record<string, unknown>[];
  loading: boolean;
  onInvalidate: () => void;
  del: { mutate: (args: { path: string; id: string; key: string }) => void };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [registrationInfo, setRegistrationInfo] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOrientationAptitudeTest(editing, {
            title,
            description,
            provider,
            testUrl,
            registrationInfo,
            academicYear: academicYear.trim() || null,
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
            sortOrder,
            isPublished,
          })
        : adminApi.createOrientationAptitudeTest({
            title,
            description,
            provider,
            testUrl,
            registrationInfo,
            academicYear: academicYear.trim() || null,
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
            sortOrder,
            isPublished,
          }),
    onSuccess: () => {
      toast.success("Enregistré.");
      onInvalidate();
      setEditing(null);
      setTitle("");
      setDescription("");
      setProvider("");
      setTestUrl("");
      setRegistrationInfo("");
      setAcademicYear("");
      setRegistrationDeadline("");
      setSortOrder(0);
      setIsPublished(false);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card variant="premium" className="!p-4 space-y-2 max-h-[560px] overflow-y-auto">
        <h3 className={ADM.h2}>Tests d’aptitude</h3>
        {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}
        {rows.map((r) => (
          <div key={String(r.id)} className="rounded-lg border p-2 flex justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{String(r.title)}</p>
              <p className="text-xs text-gray-500">{r.academicYear ? String(r.academicYear) : "Toutes années"}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setEditing(String(r.id));
                  setTitle(String(r.title ?? ""));
                  setDescription(String(r.description ?? ""));
                  setProvider(String(r.provider ?? ""));
                  setTestUrl(String(r.testUrl ?? ""));
                  setRegistrationInfo(String(r.registrationInfo ?? ""));
                  setAcademicYear(String(r.academicYear ?? ""));
                  setRegistrationDeadline(
                    r.registrationDeadline ? format(new Date(String(r.registrationDeadline)), "yyyy-MM-dd'T'HH:mm") : ""
                  );
                  setSortOrder(Number(r.sortOrder ?? 0));
                  setIsPublished(Boolean(r.isPublished));
                }}
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-red-600"
                onClick={() => {
                  if (confirm("Supprimer ?")) del.mutate({ path: "tests", id: String(r.id), key: "admin-orientation-tests" });
                }}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>
      <Card variant="premium" className="!p-4 space-y-2 text-xs">
        <h3 className={ADM.h2}>{editing ? "Modifier" : "Nouveau test"}</h3>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
        <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Organisme / éditeur" />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="Lien inscription ou infos" />
        <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={2} value={registrationInfo} onChange={(e) => setRegistrationInfo(e.target.value)} placeholder="Modalités / dates clés" />
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="Année scolaire (optionnel)" />
        <label className="block space-y-1">
          <span className="text-gray-500">Date limite d’inscription</span>
          <input type="datetime-local" className="w-full border rounded-lg px-2 py-1.5 text-sm" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
        </label>
        <label className="flex items-center gap-2">
          Ordre <input type="number" className="border rounded px-2 w-20" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Publié
        </label>
        <Button type="button" disabled={!title.trim() || save.isPending} onClick={() => save.mutate()}>
          Enregistrer
        </Button>
      </Card>
    </div>
  );
}

function AdviceTab({
  rows,
  loading,
  onInvalidate,
  del,
}: {
  rows: Record<string, unknown>[];
  loading: boolean;
  onInvalidate: () => void;
  del: { mutate: (args: { path: string; id: string; key: string }) => void };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"ALL" | "PARENT" | "STUDENT">("ALL");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOrientationAdvice(editing, { title, body, audience, sortOrder, isPublished })
        : adminApi.createOrientationAdvice({ title, body, audience, sortOrder, isPublished }),
    onSuccess: () => {
      toast.success("Enregistré.");
      onInvalidate();
      setEditing(null);
      setTitle("");
      setBody("");
      setAudience("ALL");
      setSortOrder(0);
      setIsPublished(false);
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card variant="premium" className="!p-4 space-y-2 max-h-[560px] overflow-y-auto">
        <h3 className={ADM.h2}>Conseils</h3>
        {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}
        {rows.map((r) => (
          <div key={String(r.id)} className="rounded-lg border p-2 flex justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{String(r.title)}</p>
              <p className="text-xs text-gray-600">{ORIENTATION_ADVICE_AUDIENCE_FR[String(r.audience)] ?? String(r.audience)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setEditing(String(r.id));
                  setTitle(String(r.title ?? ""));
                  setBody(String(r.body ?? ""));
                  setAudience((r.audience as typeof audience) || "ALL");
                  setSortOrder(Number(r.sortOrder ?? 0));
                  setIsPublished(Boolean(r.isPublished));
                }}
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-red-600"
                onClick={() => {
                  if (confirm("Supprimer ?")) del.mutate({ path: "advice", id: String(r.id), key: "admin-orientation-advice" });
                }}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>
      <Card variant="premium" className="!p-4 space-y-2 text-xs">
        <h3 className={ADM.h2}>{editing ? "Modifier" : "Nouveau conseil"}</h3>
        <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
        <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Texte du conseil" />
        <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
          <option value="ALL">{ORIENTATION_ADVICE_AUDIENCE_FR.ALL}</option>
          <option value="PARENT">{ORIENTATION_ADVICE_AUDIENCE_FR.PARENT}</option>
          <option value="STUDENT">{ORIENTATION_ADVICE_AUDIENCE_FR.STUDENT}</option>
        </select>
        <label className="flex items-center gap-2">
          Ordre <input type="number" className="border rounded px-2 w-20" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Publié
        </label>
        <Button type="button" disabled={!title.trim() || !body.trim() || save.isPending} onClick={() => save.mutate()}>
          Enregistrer
        </Button>
      </Card>
    </div>
  );
}

function FollowUpsTab({
  rows,
  loading,
  students,
  staff,
  fuStudent,
  setFuStudent,
  fuYear,
  setFuYear,
  onInvalidate,
  del,
}: {
  rows: Record<string, unknown>[];
  loading: boolean;
  students: { id: string; user?: { firstName: string; lastName: string } }[];
  staff: { id: string; firstName: string; lastName: string }[];
  fuStudent: string;
  setFuStudent: (v: string) => void;
  fuYear: string;
  setFuYear: (v: string) => void;
  onInvalidate: () => void;
  del: { mutate: (args: { path: string; id: string; key: string }) => void };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"PLANNED" | "IN_PROGRESS" | "DONE" | "ARCHIVED">("PLANNED");
  const [nextAppointmentAt, setNextAppointmentAt] = useState("");
  const [counselorUserId, setCounselorUserId] = useState("");

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOrientationFollowUp(editing, {
            academicYear,
            title,
            notes,
            status,
            nextAppointmentAt: nextAppointmentAt ? new Date(nextAppointmentAt).toISOString() : null,
            counselorUserId: counselorUserId.trim() ? counselorUserId : null,
          })
        : adminApi.createOrientationFollowUp({
            studentId,
            academicYear,
            title,
            notes,
            status,
            nextAppointmentAt: nextAppointmentAt ? new Date(nextAppointmentAt).toISOString() : null,
            counselorUserId: counselorUserId || undefined,
          }),
    onSuccess: () => {
      toast.success("Enregistré.");
      onInvalidate();
      setEditing(null);
      setStudentId("");
      setAcademicYear("");
      setTitle("");
      setNotes("");
      setStatus("PLANNED");
      setNextAppointmentAt("");
      setCounselorUserId("");
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  return (
    <div className="space-y-4">
      <Card variant="premium" className="!p-4 flex flex-wrap gap-3 items-end text-xs">
        <label className="space-y-1">
          <span className="text-gray-500">Filtrer élève</span>
          <select className="border rounded-lg px-2 py-1.5 text-sm min-w-[200px]" value={fuStudent} onChange={(e) => setFuStudent(e.target.value)}>
            <option value="">Tous</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.user?.firstName ?? "") + " " + (s.user?.lastName ?? "")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-gray-500">Année scolaire</span>
          <input className="border rounded-lg px-2 py-1.5 text-sm" value={fuYear} onChange={(e) => setFuYear(e.target.value)} placeholder="2025-2026" />
        </label>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card variant="premium" className="!p-4 space-y-2 max-h-[480px] overflow-y-auto">
          <h3 className={ADM.h2}>Entrées de suivi</h3>
          {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}
          {rows.map((r) => (
            <div key={String(r.id)} className="rounded-lg border p-2 text-sm">
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{String(r.title)}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1 text-gray-600"
                    onClick={() => {
                  setEditing(String(r.id));
                  setStudentId(String((r as { studentId: string }).studentId));
                  setAcademicYear(String(r.academicYear ?? ""));
                      setTitle(String(r.title ?? ""));
                      setNotes(String(r.notes ?? ""));
                      setStatus((r.status as typeof status) || "PLANNED");
                      setNextAppointmentAt(
                        r.nextAppointmentAt ? format(new Date(String(r.nextAppointmentAt)), "yyyy-MM-dd'T'HH:mm") : ""
                      );
                      const c = (r as { counselor?: { id: string } | null }).counselor;
                      setCounselorUserId(c?.id ?? "");
                    }}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-red-600"
                    onClick={() => {
                      if (confirm("Supprimer ?")) del.mutate({ path: "followups", id: String(r.id), key: "admin-orientation-followups" });
                    }}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {ORIENTATION_FOLLOW_UP_STATUS_FR[String(r.status)] ?? String(r.status)} · {String(r.academicYear)}
              </p>
            </div>
          ))}
        </Card>
        <Card variant="premium" className="!p-4 space-y-2 text-xs">
          <h3 className={ADM.h2}>{editing ? "Modifier le suivi" : "Nouveau suivi"}</h3>
          {!editing ? (
            <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Élève…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.user?.firstName ?? "") + " " + (s.user?.lastName ?? "")}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-gray-500">Élève verrouillé en édition (identifiant conservé côté serveur).</p>
          )}
          <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="Année scolaire" />
          <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. Bilan Terminale)" />
          <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes de suivi" />
          <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {Object.entries(ORIENTATION_FOLLOW_UP_STATUS_FR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input type="datetime-local" className="w-full border rounded-lg px-2 py-1.5 text-sm" value={nextAppointmentAt} onChange={(e) => setNextAppointmentAt(e.target.value)} />
          <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={counselorUserId} onChange={(e) => setCounselorUserId(e.target.value)}>
            <option value="">Conseiller (optionnel)</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={(!editing && !studentId) || !academicYear.trim() || !title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            Enregistrer
          </Button>
        </Card>
      </div>
    </div>
  );
}

function PlacementsTab({
  rows,
  loading,
  students,
  plStudent,
  setPlStudent,
  onInvalidate,
  del,
}: {
  rows: Record<string, unknown>[];
  loading: boolean;
  students: { id: string; user?: { firstName: string; lastName: string } }[];
  plStudent: string;
  setPlStudent: (v: string) => void;
  onInvalidate: () => void;
  del: { mutate: (args: { path: string; id: string; key: string }) => void };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [kind, setKind] = useState<"INTERNSHIP_SCHOOL" | "INTERNSHIP_COMPANY" | "APPRENTICESHIP">("INTERNSHIP_COMPANY");
  const [organizationName, setOrganizationName] = useState("");
  const [roleOrSubject, setRoleOrSubject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("PLANNED");
  const [supervisorContact, setSupervisorContact] = useState("");
  const [notes, setNotes] = useState("");

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateOrientationPlacement(editing, {
            kind,
            organizationName,
            roleOrSubject,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
            status,
            supervisorContact,
            notes,
          })
        : adminApi.createOrientationPlacement({
            studentId,
            kind,
            organizationName,
            roleOrSubject,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
            status,
            supervisorContact,
            notes,
          }),
    onSuccess: () => {
      toast.success("Enregistré.");
      onInvalidate();
      setEditing(null);
      setStudentId("");
      setOrganizationName("");
      setRoleOrSubject("");
      setStartDate("");
      setEndDate("");
      setStatus("PLANNED");
      setSupervisorContact("");
      setNotes("");
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || "Erreur");
    },
  });

  return (
    <div className="space-y-4">
      <Card variant="premium" className="!p-4 text-xs">
        <label className="space-y-1 inline-block">
          <span className="text-gray-500">Filtrer élève</span>
          <select className="border rounded-lg px-2 py-1.5 text-sm block min-w-[220px]" value={plStudent} onChange={(e) => setPlStudent(e.target.value)}>
            <option value="">Tous</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.user?.firstName ?? "") + " " + (s.user?.lastName ?? "")}
              </option>
            ))}
          </select>
        </label>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card variant="premium" className="!p-4 space-y-2 max-h-[480px] overflow-y-auto">
          <h3 className={ADM.h2}>Stages & apprentissages</h3>
          {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}
          {rows.map((r) => (
            <div key={String(r.id)} className="rounded-lg border p-2 text-sm">
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{String(r.organizationName)}</p>
                  <p className="text-xs text-gray-600">
                    {ORIENTATION_PLACEMENT_KIND_FR[String(r.kind)] ?? String(r.kind)} ·{" "}
                    {ORIENTATION_PLACEMENT_STATUS_FR[String(r.status)] ?? String(r.status)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1 text-gray-600"
                    onClick={() => {
                      setEditing(String(r.id));
                      setStudentId(String((r as { studentId: string }).studentId));
                      setKind((r.kind as typeof kind) || "INTERNSHIP_COMPANY");
                      setOrganizationName(String(r.organizationName ?? ""));
                      setRoleOrSubject(String(r.roleOrSubject ?? ""));
                      setStartDate(r.startDate ? format(new Date(String(r.startDate)), "yyyy-MM-dd") : "");
                      setEndDate(r.endDate ? format(new Date(String(r.endDate)), "yyyy-MM-dd") : "");
                      setStatus((r.status as typeof status) || "PLANNED");
                      setSupervisorContact(String(r.supervisorContact ?? ""));
                      setNotes(String(r.notes ?? ""));
                    }}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-red-600"
                    onClick={() => {
                      if (confirm("Supprimer ?")) del.mutate({ path: "placements", id: String(r.id), key: "admin-orientation-placements" });
                    }}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Card>
        <Card variant="premium" className="!p-4 space-y-2 text-xs">
          <h3 className={ADM.h2}>{editing ? "Modifier" : "Nouveau"}</h3>
          {!editing ? (
            <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Élève…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.user?.firstName ?? "") + " " + (s.user?.lastName ?? "")}
                </option>
              ))}
            </select>
          ) : null}
          <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="INTERNSHIP_SCHOOL">{ORIENTATION_PLACEMENT_KIND_FR.INTERNSHIP_SCHOOL}</option>
            <option value="INTERNSHIP_COMPANY">{ORIENTATION_PLACEMENT_KIND_FR.INTERNSHIP_COMPANY}</option>
            <option value="APPRENTICESHIP">{ORIENTATION_PLACEMENT_KIND_FR.APPRENTICESHIP}</option>
          </select>
          <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Organisme / entreprise" />
          <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={roleOrSubject} onChange={(e) => setRoleOrSubject(e.target.value)} placeholder="Poste / matière" />
          <label className="block space-y-1">
            Début
            <input type="date" className="w-full border rounded-lg px-2 py-1.5 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="block space-y-1">
            Fin
            <input type="date" className="w-full border rounded-lg px-2 py-1.5 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <select className="w-full border rounded-lg px-2 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {Object.entries(ORIENTATION_PLACEMENT_STATUS_FR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input className="w-full border rounded-lg px-2 py-1.5 text-sm" value={supervisorContact} onChange={(e) => setSupervisorContact(e.target.value)} placeholder="Contact tuteur / maître de stage" />
          <textarea className="w-full border rounded-lg px-2 py-1.5 text-sm" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
          <Button type="button" disabled={(!editing && !studentId) || !organizationName.trim() || !startDate || save.isPending} onClick={() => save.mutate()}>
            Enregistrer
          </Button>
        </Card>
      </div>
    </div>
  );
}
