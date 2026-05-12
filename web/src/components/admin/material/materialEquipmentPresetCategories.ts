/**
 * Familles d’inventaire « Matériel et équipements » (réf. métier).
 * Les valeurs sont stockées telles quelles dans `MaterialEquipment.category`.
 */
export const MATERIAL_EQUIPMENT_PRESET_CATEGORIES = [
  { value: 'Matériel pédagogique', label: 'Matériel pédagogique' },
  { value: 'Matériel informatique', label: 'Matériel informatique' },
  { value: 'Équipements sportifs', label: 'Équipements sportifs' },
  { value: 'Laboratoires', label: 'Laboratoires' },
] as const;

export type MaterialEquipmentPresetCategoryValue =
  (typeof MATERIAL_EQUIPMENT_PRESET_CATEGORIES)[number]['value'];

const PRESET_VALUES = new Set<string>(
  MATERIAL_EQUIPMENT_PRESET_CATEGORIES.map((c) => c.value)
);

export function isPresetMaterialEquipmentCategory(category: string): boolean {
  return PRESET_VALUES.has(category.trim());
}
