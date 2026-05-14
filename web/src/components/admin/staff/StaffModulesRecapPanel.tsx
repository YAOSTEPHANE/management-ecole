'use client';

import { useMemo, useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import SearchBar from '../../ui/SearchBar';
import { ADM } from '../adminModuleLayout';
import { FiEdit2, FiCheckSquare } from 'react-icons/fi';
import { resolveStaffSupportKind } from '@/views/staff/staffSpaceConfig';
import {
  STAFF_MODULE_LABELS,
  getEligibleModulesForSupportKind,
  resolveVisibleStaffModules,
  type StaffModuleId,
} from '@/lib/staffModules';

const KIND_LABEL: Record<string, string> = {
  LIBRARIAN: 'Bibliothécaire',
  NURSE: 'Infirmier(e)',
  SECRETARY: 'Secrétaire',
  ACCOUNTANT: 'Comptabilité',
  STUDIES_DIRECTOR: 'Directeur(trice) des études',
  BURSAR: 'Économe',
  IT: 'Informatique',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Autre',
};

const CAT_LABEL: Record<string, string> = {
  ADMINISTRATION: 'Administration',
  SUPPORT: 'Soutien',
  SECURITY: 'Sécurité',
};

type StaffRow = {
  id: string;
  employeeId: string;
  staffCategory: string;
  supportKind?: string | null;
  jobTitle?: string | null;
  visibleStaffModules?: string[];
  user?: { firstName?: string; lastName?: string; email?: string; isActive?: boolean };
};

type Props = {
  staffList: StaffRow[] | undefined;
  isLoading?: boolean;
  onEditStaff: (staffId: string) => void;
};

function effectiveModules(row: StaffRow): { modules: StaffModuleId[]; isCustom: boolean } {
  if (row.staffCategory !== 'SUPPORT') {
    return { modules: ['overview'], isCustom: false };
  }
  const kind = resolveStaffSupportKind(row.supportKind);
  const stored = row.visibleStaffModules;
  const isCustom = Array.isArray(stored) && stored.length > 0;
  const modules = resolveVisibleStaffModules(kind, isCustom ? stored : undefined, row.staffCategory);
  return { modules, isCustom };
}

export default function StaffModulesRecapPanel({ staffList, isLoading, onEditStaff }: Props) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  const rows = useMemo(() => {
    const list = staffList ?? [];
    const t = search.trim().toLowerCase();
    return list
      .filter((s) => s.staffCategory === 'SUPPORT')
      .filter((s) => {
        if (kindFilter && (s.supportKind ?? 'OTHER') !== kindFilter) return false;
        if (!t) return true;
        const name = `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.toLowerCase();
        return (
          name.includes(t) ||
          (s.user?.email ?? '').toLowerCase().includes(t) ||
          (s.employeeId ?? '').toLowerCase().includes(t)
        );
      })
      .map((s) => {
        const { modules, isCustom } = effectiveModules(s);
        const kind = resolveStaffSupportKind(s.supportKind);
        const eligible = getEligibleModulesForSupportKind(kind).filter((m) => m !== 'overview');
        const active = modules.filter((m) => m !== 'overview');
        const missing = eligible.filter((m) => !active.includes(m));
        return { ...s, modules: active, isCustom, eligible, missing };
      })
      .sort((a, b) =>
        `${a.user?.lastName} ${a.user?.firstName}`.localeCompare(
          `${b.user?.lastName} ${b.user?.firstName}`,
          'fr',
        ),
      );
  }, [staffList, search, kindFilter]);

  const supportKinds = useMemo(() => {
    const set = new Set<string>();
    for (const s of staffList ?? []) {
      if (s.staffCategory === 'SUPPORT' && s.supportKind) set.add(s.supportKind);
    }
    return [...set].sort();
  }, [staffList]);

  return (
    <Card className="p-3 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-stone-900">Espace personnel — modules STAFF</h3>
        <p className="text-xs text-stone-600 mt-1 max-w-3xl">
          Vue d&apos;ensemble des modules visibles pour chaque agent de <strong>soutien</strong> sur son
          tableau de bord <code className="text-[11px]">/staff</code>. Sans personnalisation, les modules par
          défaut du métier s&apos;appliquent. Cliquez sur Modifier pour ajuster les cases à cocher dans la fiche
          (catégorie <strong>Soutien</strong>).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un agent…"
          className="max-w-md flex-1"
        />
        <select
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          aria-label="Filtrer par métier"
        >
          <option value="">Tous les métiers</option>
          {supportKinds.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k] ?? k}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 p-4 space-y-2">
          <p className="text-sm font-medium text-stone-800">Aucun agent avec espace personnel configuré</p>
          <p className="text-xs text-stone-600 leading-relaxed">
            Créez un membre du personnel avec la catégorie <strong>Soutien</strong> (secrétaire, économe,
            directeur des études, etc.) dans l&apos;onglet Personnel, puis cochez les modules dans la fiche.
            Après connexion, l&apos;agent accède à son espace sur <code className="text-[11px]">/staff</code>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-[10px] uppercase text-stone-600">
              <tr>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Métier</th>
                <th className="px-3 py-2">Modules actifs</th>
                <th className="px-3 py-2">Profil</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-stone-100 align-top hover:bg-stone-50/80">
                  <td className="px-3 py-3">
                    <p className="font-medium text-stone-900">
                      {row.user?.lastName} {row.user?.firstName}
                      {row.user?.isActive === false && (
                        <Badge className="ml-1 text-[9px] bg-stone-200 text-stone-700">Inactif</Badge>
                      )}
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">{row.employeeId}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-stone-700">
                    {KIND_LABEL[row.supportKind ?? 'OTHER'] ?? row.supportKind}
                    {row.jobTitle && (
                      <span className="block text-[10px] text-stone-500 mt-0.5">{row.jobTitle}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {row.modules.length === 0 ? (
                        <span className="text-xs text-stone-500">Vue d&apos;ensemble uniquement</span>
                      ) : (
                        row.modules.map((m) => (
                          <Badge key={m} className="text-[9px] bg-teal-50 text-teal-900 border border-teal-100">
                            {STAFF_MODULE_LABELS[m]}
                          </Badge>
                        ))
                      )}
                    </div>
                    {row.missing.length > 0 && (
                      <p className="text-[10px] text-amber-800 mt-1.5">
                        Non activés (disponibles pour ce métier) :{' '}
                        {row.missing.map((m) => STAFF_MODULE_LABELS[m]).join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {row.isCustom ? (
                      <Badge className="text-[9px] bg-indigo-100 text-indigo-900">Personnalisé</Badge>
                    ) : (
                      <Badge className="text-[9px] bg-stone-100 text-stone-700">Défaut métier</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onEditStaff(row.id)}>
                      <FiEdit2 className="w-3.5 h-3.5 mr-1 inline" />
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-stone-500 border-t border-stone-100 pt-3">
        <FiCheckSquare className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
        Les catégories {CAT_LABEL.ADMINISTRATION} et {CAT_LABEL.SECURITY} n&apos;ont pas de modules métiers
        configurables (vue d&apos;ensemble STAFF seulement).
      </p>
    </Card>
  );
}