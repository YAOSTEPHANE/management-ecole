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
import { ADM } from './adminModuleLayout';

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
    <div className={ADM.root}>
      <div>
        <h2 className={ADM.h2}>Gestion des frais</h2>
        <p className={ADM.intro}>Facturation, encaissements, relances, reçus et suivi par famille.</p>
      </div>

      <div className={ADM.tabRow}>
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={ADM.tabBtn(active, 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200')}
            >
              <Icon className={ADM.tabIcon} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className={ADM.section}>
          <div className={ADM.grid3}>
            <Card className={`${ADM.statCard} border border-gray-200`}>
              <p className={ADM.statLabel}>Lignes de frais</p>
              <p className={ADM.statVal}>{totalFees}</p>
            </Card>
            <Card className={`${ADM.statCard} border border-amber-100 bg-amber-50/40`}>
              <p className="text-[10px] font-medium text-amber-800 uppercase tracking-wide leading-tight">
                En attente de paiement
              </p>
              <p className={`${ADM.statValTone} text-amber-900`}>{pending}</p>
            </Card>
            <Card className={`${ADM.statCard} border border-emerald-100 bg-emerald-50/40`}>
              <p className="text-[10px] font-medium text-emerald-800 uppercase tracking-wide leading-tight">
                Volume encaissé (suivi)
              </p>
              <p className={`${ADM.statValTone} text-emerald-900 text-base`}>{formatFCFA(totalPaid)}</p>
            </Card>
          </div>
          <Card className={ADM.helpCard}>
            <h3 className={ADM.helpTitle}>Parcours recommandé</h3>
            <ol className={ADM.helpOl}>
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

      {tab === 'billing' && <TuitionFeesManagement embedded compact />}
      {tab === 'payments' && <PaymentsManagement embedded compact />}
      {tab === 'reminders' && <PaymentRemindersPanel compact />}
      {tab === 'receipts' && <PaymentReceiptsPanel compact />}
      {tab === 'history' && <StudentFinancialHistoryPanel compact />}
    </div>
  );
};

export default FeesManagementModule;
