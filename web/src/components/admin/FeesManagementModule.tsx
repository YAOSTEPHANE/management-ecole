import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import TuitionFeesManagement from './TuitionFeesManagement';
import PaymentsManagement from './PaymentsManagement';
import PaymentRemindersPanel from './PaymentRemindersPanel';
import PaymentReceiptsPanel from './PaymentReceiptsPanel';
import StudentFinancialHistoryPanel from './StudentFinancialHistoryPanel';
import {
  FiGrid,
  FiDollarSign,
  FiCreditCard,
  FiBell,
  FiFileText,
  FiUser,
} from 'react-icons/fi';
import { formatFCFA } from '../../utils/currency';

type FeesTab = 'overview' | 'billing' | 'payments' | 'reminders' | 'receipts' | 'history';

const FeesManagementModule: React.FC = () => {
  const [tab, setTab] = useState<FeesTab>('overview');

  const { data: tuitionFees } = useQuery({
    queryKey: ['admin-tuition-fees'],
    queryFn: () => adminApi.getTuitionFees(),
  });

  const { data: paymentsGrouped } = useQuery({
    queryKey: ['admin-payments-grouped'],
    queryFn: () => adminApi.getPaymentsGrouped(),
  });

  const totalFees = tuitionFees?.length ?? 0;
  const pending =
    tuitionFees?.filter((f: any) => !f.isPaid).length ?? 0;
  let totalPaid = 0;
  if (paymentsGrouped && Array.isArray(paymentsGrouped)) {
    paymentsGrouped.forEach((g: any) => {
      totalPaid += g.totalPaid || 0;
    });
  }

  const subTabs: { id: FeesTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'billing', label: 'Facturation (frais)', icon: FiDollarSign },
    { id: 'payments', label: 'Suivi des paiements', icon: FiCreditCard },
    { id: 'reminders', label: 'Rappels', icon: FiBell },
    { id: 'receipts', label: 'Reçus PDF', icon: FiFileText },
    { id: 'history', label: 'Historique par élève', icon: FiUser },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Gestion des frais</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Facturation, encaissements, relances, reçus et suivi par famille.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-80" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Lignes de frais</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalFees}</p>
            </Card>
            <Card className="p-4 border border-amber-100 bg-amber-50/40">
              <p className="text-xs font-medium text-amber-800 uppercase">En attente de paiement</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{pending}</p>
            </Card>
            <Card className="p-4 border border-emerald-100 bg-emerald-50/40">
              <p className="text-xs font-medium text-emerald-800 uppercase">Volume encaissé (suivi)</p>
              <p className="text-xl font-bold text-emerald-900 mt-1">{formatFCFA(totalPaid)}</p>
            </Card>
          </div>
          <Card className="p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Parcours recommandé</h3>
            <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
              <li>
                <strong>Facturation</strong> : créer les frais (élève ou classe entière).
              </li>
              <li>
                <strong>Paiements</strong> : suivre les encaissements et l’état par famille.
              </li>
              <li>
                <strong>Rappels</strong> : copier les messages pour les retards ou échéances proches.
              </li>
              <li>
                <strong>Reçus PDF</strong> après chaque paiement confirmé.
              </li>
              <li>
                <strong>Historique</strong> pour le détail par élève.
              </li>
            </ol>
          </Card>
        </div>
      )}

      {tab === 'billing' && <TuitionFeesManagement embedded />}
      {tab === 'payments' && <PaymentsManagement embedded />}
      {tab === 'reminders' && <PaymentRemindersPanel />}
      {tab === 'receipts' && <PaymentReceiptsPanel />}
      {tab === 'history' && <StudentFinancialHistoryPanel />}
    </div>
  );
};

export default FeesManagementModule;
