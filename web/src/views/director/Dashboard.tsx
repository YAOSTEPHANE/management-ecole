'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import { adminApi } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import {
  CHART_GRID,
  CHART_MARGIN_COMPACT,
  chartBlueRed,
  CHART_ANIMATION_MS,
} from '../../components/charts';
import { FiArrowLeft, FiTrendingUp } from 'react-icons/fi';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export default function DirectorDashboard() {
  const { user, logout } = useAuth();
  const { data: dash } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  });
  const { data: kpis } = useQuery({
    queryKey: ['admin-dashboard-kpis'],
    queryFn: adminApi.getDashboardKpis,
    staleTime: 60_000,
  });
  const { data: summary } = useQuery({
    queryKey: ['admin-reports-summary'],
    queryFn: adminApi.getReportsSummary,
    staleTime: 60_000,
  });

  const payChart =
    kpis?.charts?.paymentsByMonth?.map((x: { label: string; amount: number }) => ({
      label: x.label,
      k: Math.round(x.amount / 1000),
      amount: x.amount,
    })) ?? [];

  const perf = summary?.performance;
  const fin = summary?.financial;
  const ac = summary?.academic;

  return (
    <Layout user={user} onLogout={logout} role="ADMIN">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">Pilotage</p>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord direction</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Vue synthétique : KPI, finances, risques pédagogiques et tendances d’encaissement. L’administration détaillée
              reste accessible depuis le portail habituel.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Administration complète
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 border border-slate-200 bg-white">
            <p className="text-[10px] font-semibold text-slate-500 uppercase">Élèves actifs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{dash?.activeStudents ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">sur {dash?.totalStudents ?? '—'} dossiers</p>
          </Card>
          <Card className="p-4 border border-slate-200 bg-white">
            <p className="text-[10px] font-semibold text-slate-500 uppercase">Corps enseignant</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{dash?.totalTeachers ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{dash?.totalClasses ?? '—'} classes</p>
          </Card>
          <Card className="p-4 border border-rose-100 bg-rose-50/50">
            <p className="text-[10px] font-semibold text-rose-800 uppercase">Impayés scolarité</p>
            <p className="text-xl font-bold text-rose-900 mt-1 tabular-nums">
              {fin ? `${fmt(fin.tuitionOutstandingAmount)} FCFA` : '—'}
            </p>
            <p className="text-xs text-rose-800/80 mt-0.5">{fin?.tuitionOutstandingCount ?? '—'} échéance(s)</p>
          </Card>
          <Card className="p-4 border border-amber-100 bg-amber-50/50">
            <p className="text-[10px] font-semibold text-amber-900 uppercase flex items-center gap-1">
              <FiTrendingUp className="w-3.5 h-3.5" /> Risque pédagogique
            </p>
            <p className="text-xl font-bold text-amber-950 mt-1">
              {perf ? `${perf.atRiskHigh} / ${perf.atRiskMedium}` : '—'}
            </p>
            <p className="text-xs text-amber-900/80 mt-0.5">Élevé / modéré</p>
          </Card>
        </div>

        {kpis?.cards && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 border border-indigo-100 bg-indigo-50/40">
              <p className="text-[10px] font-semibold text-indigo-800 uppercase">Dossiers admission</p>
              <p className="text-2xl font-bold text-indigo-950 mt-1">
                {(kpis.cards.admissionsPending ?? 0) + (kpis.cards.admissionsUnderReview ?? 0)}
              </p>
              <p className="text-xs text-indigo-900/80">
                {kpis.cards.admissionsPending} attente · {kpis.cards.admissionsUnderReview} examen
              </p>
            </Card>
            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Encaissements (30 j.)</p>
              <p className="text-xl font-bold text-emerald-800 mt-1 tabular-nums">
                {fmt(kpis.cards.paymentsCompleted30dAmount ?? 0)} FCFA
              </p>
              <p className="text-xs text-slate-500">{kpis.cards.paymentsCompleted30dCount} paiement(s)</p>
            </Card>
            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Moyenne générale (notes)</p>
              <p className="text-2xl font-bold text-violet-900 mt-1">
                {ac?.gradeAverage != null ? `${ac.gradeAverage} / 20` : '—'}
              </p>
              <p className="text-xs text-slate-500">{ac?.gradesCount ?? 0} notes</p>
            </Card>
            <Card className="p-4 border border-slate-200 bg-white">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Rendus devoirs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {kpis.cards.studentAssignmentsSubmissionRate != null
                  ? `${kpis.cards.studentAssignmentsSubmissionRate} %`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500">Taux global</p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payChart.length > 0 && (
            <Card className="p-5 border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Tendance des encaissements</h2>
              <p className="text-xs text-slate-500 mb-4">Paiements complétés (6 mois, milliers FCFA).</p>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payChart} margin={CHART_MARGIN_COMPACT}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}k`} width={32} />
                    <Tooltip
                      formatter={(v: number, _n, p) => {
                        const full = (p as { payload?: { amount?: number } })?.payload?.amount;
                        return [
                          `${fmt(typeof full === 'number' ? full : v * 1000)} FCFA`,
                          'Montant',
                        ];
                      }}
                    />
                    <Bar dataKey="k" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={CHART_ANIMATION_MS}>
                      {payChart.map((_, i) => (
                        <Cell key={i} fill={chartBlueRed(i)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {summary?.financial?.paymentsByMonth && summary.financial.paymentsByMonth.length > 0 && (
            <Card className="p-5 border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Historique récent (6 mois)</h2>
              <p className="text-xs text-slate-500 mb-4">Même série que le rapport financier agrégé.</p>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={summary.financial.paymentsByMonth.map((x: { label: string; amount: number }) => ({
                      ...x,
                      k: Math.round(x.amount / 1000),
                    }))}
                    margin={{ ...CHART_MARGIN_COMPACT, top: 8 }}
                  >
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}k`} width={32} />
                    <Tooltip formatter={(v: number) => [`${fmt(v * 1000)} FCFA`, '']} />
                    <Line
                      type="monotone"
                      dataKey="k"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive
                      animationDuration={CHART_ANIMATION_MS}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
