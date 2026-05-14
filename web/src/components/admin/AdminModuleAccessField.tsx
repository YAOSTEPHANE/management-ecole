'use client';

import {
  ADMIN_MODULE_CATEGORIES,
  ADMIN_MODULE_DESCRIPTIONS,
  ADMIN_MODULE_LABELS,
  getAllConfigurableAdminModules,
  type AdminModuleId,
} from '@/lib/adminModules';

type Props = {
  value: AdminModuleId[];
  onChange: (modules: AdminModuleId[]) => void;
};

export default function AdminModuleAccessField({ value, onChange }: Props) {
  const allModules = getAllConfigurableAdminModules();
  const selected = new Set(value);

  const toggle = (id: AdminModuleId) => {
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  };

  const toggleCategory = (ids: AdminModuleId[], select: boolean) => {
    const set = new Set(value);
    for (const id of ids) {
      if (select) set.add(id);
      else set.delete(id);
    }
    onChange([...set]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-stone-800">Modules & fonctionnalités</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Cochez les onglets du tableau de bord accessibles dans cet espace.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onChange([...allModules])}
            className="text-[10px] font-semibold px-2 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
          >
            Tout cocher
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-semibold px-2 py-1 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          >
            Tout décocher
          </button>
        </div>
      </div>

      {ADMIN_MODULE_CATEGORIES.map((cat) => {
        const catIds = cat.moduleIds.filter((id) => id !== 'dashboard' && id !== 'workspaces');
        if (catIds.length === 0) return null;
        const allSelected = catIds.every((id) => selected.has(id));
        const someSelected = catIds.some((id) => selected.has(id));
        return (
          <div key={cat.title} className="rounded-xl border border-stone-200 bg-stone-50/50 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-stone-800">{cat.title}</p>
                {cat.hint ? <p className="text-[10px] text-stone-500">{cat.hint}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => toggleCategory(catIds, !allSelected)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 shrink-0"
              >
                {allSelected ? 'Retirer' : someSelected ? 'Compléter' : 'Sélectionner'}
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {catIds.map((id) => (
                <label
                  key={id}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors ${
                    selected.has(id)
                      ? 'border-indigo-400 bg-indigo-50/60'
                      : 'border-stone-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-stone-300 text-indigo-700 focus:ring-indigo-500"
                    checked={selected.has(id)}
                    onChange={() => toggle(id)}
                  />
                  <span className="min-w-0">
                    <span className="text-xs font-medium text-stone-800 leading-snug block">
                      {ADMIN_MODULE_LABELS[id]}
                    </span>
                    {ADMIN_MODULE_DESCRIPTIONS[id] ? (
                      <span className="text-[10px] text-stone-500 leading-snug block mt-0.5">
                        {ADMIN_MODULE_DESCRIPTIONS[id]}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
