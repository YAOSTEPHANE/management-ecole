'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FiRefreshCw, FiSend, FiDollarSign } from 'react-icons/fi';

function ChannelPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        ok ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
      }`}
    >
      {label} : {ok ? 'OK' : 'non configuré'}
    </span>
  );
}

const NotificationsAlertsPanel: React.FC = () => {
  const qc = useQueryClient();

  const { data: status, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-notifications-channel-status'],
    queryFn: () => adminApi.getNotificationsChannelStatus(),
  });

  const testMutation = useMutation({
    mutationFn: () => adminApi.testNotificationsChannels(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const remindersMutation = useMutation({
    mutationFn: () => adminApi.runTuitionFeeAutoReminders(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tuition-fees'] });
      qc.invalidateQueries({ queryKey: ['admin-tuition-fees-reminders'] });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="border border-amber-100 bg-amber-50/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Canaux d’alerte</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Push web (VAPID), e-mail (SMTP), SMS (Twilio), et options automatiques côté serveur.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5"
            >
              <FiRefreshCw className={isFetching ? 'animate-spin' : ''} size={14} />
              Actualiser
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="inline-flex items-center gap-1.5"
            >
              <FiSend size={14} />
              {testMutation.isPending ? 'Envoi…' : 'Tester sur mon compte'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => remindersMutation.mutate()}
              disabled={remindersMutation.isPending}
              className="inline-flex items-center gap-1.5"
            >
              <FiDollarSign size={14} />
              {remindersMutation.isPending ? 'Relances…' : 'Lancer relances frais'}
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-xs text-gray-500 mt-3">Chargement…</p>}
        {status && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ChannelPill ok={status.pushWeb} label="Push web" />
            <ChannelPill ok={status.emailSmtp} label="E-mail" />
            <ChannelPill ok={status.smsTwilio} label="SMS Twilio" />
            <ChannelPill ok={status.attendanceParentNotify} label="Alertes absence (auto)" />
            <ChannelPill ok={status.announcementUrgentSms} label="SMS annonces urgentes" />
            <ChannelPill ok={status.tuitionSmsOverdue} label="SMS relance frais (retard)" />
          </div>
        )}

        {(testMutation.isError || remindersMutation.isError) && (
          <p className="text-xs text-red-600 mt-2">Une action a échoué. Vérifiez la console réseau ou les logs serveur.</p>
        )}
        {testMutation.isSuccess && (
          <p className="text-xs text-emerald-700 mt-2">
            Test envoyé : vérifiez la cloche, votre boîte mail et une notification navigateur si vous avez accepté le push.
          </p>
        )}
        {remindersMutation.isSuccess && (
          <p className="text-xs text-emerald-700 mt-2">Job de relances exécuté (voir résultat côté frais de scolarité).</p>
        )}
      </Card>

      <Card className="p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Fonctionnalités couvertes</h3>
        <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Notifications push (navigateur / PWA) via Web Push.</li>
          <li>E-mails transactionnels (SMTP) pour annonces, relances, tests.</li>
          <li>SMS Twilio : absences / retards, options annonces urgentes et relances en retard.</li>
          <li>Alertes d’absence : e-mail + SMS + notification in-app et push pour les parents.</li>
          <li>Rappels de paiement : relances automatiques planifiables + action manuelle ci-dessus.</li>
          <li>Annonces importantes : diffusion à la publication (in-app, e-mail, push ; SMS si urgent + flag).</li>
        </ul>
      </Card>
    </div>
  );
};

export default NotificationsAlertsPanel;
