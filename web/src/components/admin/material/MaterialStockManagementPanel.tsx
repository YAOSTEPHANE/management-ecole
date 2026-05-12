import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STOCK_TYPES = [
  { value: 'SCHOOL_SUPPLY', label: 'Fournitures scolaires' },
  { value: 'CLEANING_PRODUCT', label: "Produits d'entretien" },
  { value: 'SAFETY_STOCK', label: 'Stock de sécurité' },
  { value: 'OTHER', label: 'Autre' },
];

const MOVE_TYPES = [
  { value: 'IN', label: 'Entrée' },
  { value: 'OUT', label: 'Sortie' },
  { value: 'ADJUSTMENT', label: 'Ajustement' },
  { value: 'INVENTORY_COUNT', label: 'Inventaire périodique' },
];

const MaterialStockManagementPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    type: 'SCHOOL_SUPPLY',
    unit: 'unité',
    currentQty: 0,
    safetyQty: 0,
    reorderQty: '',
    location: '',
    notes: '',
  });
  const [movementForm, setMovementForm] = useState({
    type: 'IN',
    quantity: 1,
    countedQty: '',
    unitCost: '',
    note: '',
    reference: '',
  });
  const [orderForm, setOrderForm] = useState({
    supplierName: '',
    expectedAt: '',
    notes: '',
    itemId: '',
    qtyOrdered: 1,
    unitCost: '',
  });

  const { data: stockItems, isLoading } = useQuery({
    queryKey: ['material-stock-items', typeFilter, lowStockOnly],
    queryFn: () =>
      adminApi.getMaterialStockItems({
        ...(typeFilter && { type: typeFilter }),
        ...(lowStockOnly && { lowStockOnly: 'true' }),
        isActive: 'true',
      }),
  });

  const { data: stockOrders } = useQuery({
    queryKey: ['material-stock-orders'],
    queryFn: () => adminApi.getMaterialStockOrders({}),
  });

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);
  const { data: periodicInventories } = useQuery({
    queryKey: ['material-stock-periodic', from.toISOString()],
    queryFn: () =>
      adminApi.getMaterialStockPeriodicInventories({
        from: from.toISOString(),
        to: now.toISOString(),
      }),
  });

  const createItemMutation = useMutation({
    mutationFn: () =>
      adminApi.createMaterialStockItem({
        ...itemForm,
        reorderQty: itemForm.reorderQty === '' ? null : Number(itemForm.reorderQty),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-stock-items'] });
      toast.success('Article de stock créé');
      setItemModalOpen(false);
      setItemForm({
        name: '',
        category: '',
        type: 'SCHOOL_SUPPLY',
        unit: 'unité',
        currentQty: 0,
        safetyQty: 0,
        reorderQty: '',
        location: '',
        notes: '',
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const createMovementMutation = useMutation({
    mutationFn: () =>
      adminApi.createMaterialStockMovement(selectedItemId, {
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        countedQty: movementForm.countedQty === '' ? null : Number(movementForm.countedQty),
        unitCost: movementForm.unitCost === '' ? null : Number(movementForm.unitCost),
        note: movementForm.note || null,
        reference: movementForm.reference || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['material-stock-periodic'] });
      toast.success('Mouvement enregistré');
      setMovementModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const createOrderMutation = useMutation({
    mutationFn: () =>
      adminApi.createMaterialStockOrder({
        supplierName: orderForm.supplierName,
        expectedAt: orderForm.expectedAt || null,
        notes: orderForm.notes || null,
        lines: [
          {
            itemId: orderForm.itemId,
            qtyOrdered: Number(orderForm.qtyOrdered),
            unitCost: orderForm.unitCost === '' ? null : Number(orderForm.unitCost),
          },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-stock-orders'] });
      toast.success('Commande créée');
      setOrderModalOpen(false);
      setOrderForm({
        supplierName: '',
        expectedAt: '',
        notes: '',
        itemId: '',
        qtyOrdered: 1,
        unitCost: '',
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const items = (stockItems as any[]) ?? [];
  const orders = (stockOrders as any[]) ?? [];
  const inventories = (periodicInventories as any[]) ?? [];

  const summaries = useMemo(() => {
    const low = items.filter((i) => Number(i.currentQty) <= Number(i.safetyQty)).length;
    const school = items.filter((i) => i.type === 'SCHOOL_SUPPLY').length;
    const cleaning = items.filter((i) => i.type === 'CLEANING_PRODUCT').length;
    const safety = items.filter((i) => i.type === 'SAFETY_STOCK').length;
    return { low, school, cleaning, safety };
  }, [items]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Gestion de stock: fournitures scolaires, produits d’entretien, stock de sécurité, commandes/approvisionnement et inventaires périodiques.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border border-emerald-100 bg-emerald-50/40 text-sm">Fournitures: <strong>{summaries.school}</strong></Card>
        <Card className="p-3 border border-cyan-100 bg-cyan-50/40 text-sm">Entretien: <strong>{summaries.cleaning}</strong></Card>
        <Card className="p-3 border border-violet-100 bg-violet-50/40 text-sm">Stock sécurité: <strong>{summaries.safety}</strong></Card>
        <Card className="p-3 border border-rose-100 bg-rose-50/40 text-sm">Alerte stock bas: <strong>{summaries.low}</strong></Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filtrer par type de stock"
        >
          <option value="">Tous les types</option>
          {STOCK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <label className="text-sm text-gray-700 flex items-center gap-2">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Stock bas uniquement
        </label>
        <Button type="button" onClick={() => setItemModalOpen(true)}>
          <FiPlus className="w-4 h-4 mr-2" />
          Nouvel article
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSelectedItemId('');
            setMovementModalOpen(true);
          }}
        >
          Mouvement de stock
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOrderModalOpen(true)}>
          Nouvelle commande
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun article de stock.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Qté</th>
                  <th className="py-3 px-4 text-right">Seuil sécurité</th>
                  <th className="py-3 px-4">Unité</th>
                  <th className="py-3 px-4">Localisation</th>
                  <th className="py-3 px-4">Alerte</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{it.name}</div>
                      <div className="text-xs text-gray-500">{it.category || '—'}</div>
                    </td>
                    <td className="py-3 px-4">{STOCK_TYPES.find((x) => x.value === it.type)?.label ?? it.type}</td>
                    <td className="py-3 px-4 text-right">{Number(it.currentQty).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">{Number(it.safetyQty).toFixed(2)}</td>
                    <td className="py-3 px-4">{it.unit}</td>
                    <td className="py-3 px-4">{it.location || '—'}</td>
                    <td className="py-3 px-4">
                      {Number(it.currentQty) <= Number(it.safetyQty) ? (
                        <span className="text-xs font-medium text-rose-700 bg-rose-100 rounded px-2 py-1">Stock bas</span>
                      ) : (
                        <span className="text-xs text-emerald-700">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Commandes & approvisionnement</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto text-sm">
            {orders.length === 0 ? (
              <p className="text-gray-500">Aucune commande.</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="border border-gray-100 rounded-lg p-2">
                  <div className="font-medium">{o.orderNumber} · {o.supplierName}</div>
                  <div className="text-xs text-gray-500">
                    Statut: {o.status} · {o.lines?.length ?? 0} ligne(s)
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Inventaires périodiques (90 jours)</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto text-sm">
            {inventories.length === 0 ? (
              <p className="text-gray-500">Aucun inventaire périodique.</p>
            ) : (
              inventories.map((m) => (
                <div key={m.id} className="border border-gray-100 rounded-lg p-2">
                  <div className="font-medium">{m.item?.name || 'Article'}</div>
                  <div className="text-xs text-gray-500">
                    Delta: {Number(m.quantity).toFixed(2)} {m.item?.unit || ''} · {new Date(m.occurredAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} title="Nouvel article de stock">
        <div className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nom *" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select aria-label="Type d'article" className="w-full border rounded-lg px-3 py-2 text-sm" value={itemForm.type} onChange={(e) => setItemForm((f) => ({ ...f, type: e.target.value }))}>
              {STOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Catégorie" value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Qté actuelle" value={itemForm.currentQty} onChange={(e) => setItemForm((f) => ({ ...f, currentQty: Number(e.target.value) || 0 }))} />
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Seuil sécurité" value={itemForm.safetyQty} onChange={(e) => setItemForm((f) => ({ ...f, safetyQty: Number(e.target.value) || 0 }))} />
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Seuil commande" value={itemForm.reorderQty} onChange={(e) => setItemForm((f) => ({ ...f, reorderQty: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Unité (ex: boîte)" value={itemForm.unit} onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Localisation" value={itemForm.location} onChange={(e) => setItemForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Notes" value={itemForm.notes} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setItemModalOpen(false)}>Annuler</Button>
            <Button type="button" onClick={() => createItemMutation.mutate()} disabled={createItemMutation.isPending}>Créer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={movementModalOpen} onClose={() => setMovementModalOpen(false)} title="Mouvement de stock">
        <div className="space-y-3">
          <select aria-label="Article du mouvement" className="w-full border rounded-lg px-3 py-2 text-sm" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
            <option value="">Article *</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <select aria-label="Type de mouvement" className="w-full border rounded-lg px-3 py-2 text-sm" value={movementForm.type} onChange={(e) => setMovementForm((f) => ({ ...f, type: e.target.value }))}>
            {MOVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {movementForm.type === 'INVENTORY_COUNT' ? (
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Quantité comptée" value={movementForm.countedQty} onChange={(e) => setMovementForm((f) => ({ ...f, countedQty: e.target.value }))} />
          ) : (
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Quantité" value={movementForm.quantity} onChange={(e) => setMovementForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Coût unitaire (optionnel)" value={movementForm.unitCost} onChange={(e) => setMovementForm((f) => ({ ...f, unitCost: e.target.value }))} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Référence" value={movementForm.reference} onChange={(e) => setMovementForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Note" value={movementForm.note} onChange={(e) => setMovementForm((f) => ({ ...f, note: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setMovementModalOpen(false)}>Annuler</Button>
            <Button type="button" onClick={() => createMovementMutation.mutate()} disabled={createMovementMutation.isPending || !selectedItemId}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} title="Nouvelle commande fournisseur">
        <div className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Fournisseur *" value={orderForm.supplierName} onChange={(e) => setOrderForm((f) => ({ ...f, supplierName: e.target.value }))} />
          <input aria-label="Date attendue" type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={orderForm.expectedAt} onChange={(e) => setOrderForm((f) => ({ ...f, expectedAt: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select aria-label="Article commandé" className="w-full border rounded-lg px-3 py-2 text-sm" value={orderForm.itemId} onChange={(e) => setOrderForm((f) => ({ ...f, itemId: e.target.value }))}>
              <option value="">Article *</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Qté commandée" value={orderForm.qtyOrdered} onChange={(e) => setOrderForm((f) => ({ ...f, qtyOrdered: Number(e.target.value) || 1 }))} />
          </div>
          <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Coût unitaire (optionnel)" value={orderForm.unitCost} onChange={(e) => setOrderForm((f) => ({ ...f, unitCost: e.target.value }))} />
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Notes" value={orderForm.notes} onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOrderModalOpen(false)}>Annuler</Button>
            <Button type="button" onClick={() => createOrderMutation.mutate()} disabled={createOrderMutation.isPending || !orderForm.itemId}>Créer commande</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialStockManagementPanel;
