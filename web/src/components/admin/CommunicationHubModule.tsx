import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import CommunicationManagement from './CommunicationManagement';
import {
  FiGrid,
  FiMail,
  FiBell,
  FiFileText,
  FiRss,
  FiInbox,
} from 'react-icons/fi';

type HubTab = 'overview' | 'messaging' | 'alerts' | 'circulars' | 'news' | 'requests';

const CommunicationHubModule: React.FC = () => {
  const [tab, setTab] = useState<HubTab>('overview');

  const { data: messages } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => adminApi.getMessages(),
  });
  const { data: announcements } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminApi.getAnnouncements(),
  });
  const { data: notifications } = useQuery({
    queryKey: ['admin-notifications', 'unread'],
    queryFn: () => adminApi.getNotifications({ unread: true }),
  });

  const unreadMessages = useMemo(
    () => (messages as any[] | undefined)?.filter((m) => !m.read).length ?? 0,
    [messages]
  );
  const publishedNews = useMemo(() => {
    const list = (announcements as any[] | undefined) ?? [];
    const isCirc = (t: string) =>
      /^\[?\s*Circulaire/i.test((t || '').trim()) || /^Circulaire\b/i.test((t || '').trim());
    return list.filter((a) => a.published && !isCirc(a.title)).length;
  }, [announcements]);

  const subTabs: { id: HubTab; label: string; icon: typeof FiGrid }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: FiGrid },
    { id: 'messaging', label: 'Messagerie', icon: FiMail },
    { id: 'alerts', label: 'Notifications & alertes', icon: FiBell },
    { id: 'circulars', label: 'Circulaires', icon: FiFileText },
    { id: 'news', label: 'Actualités', icon: FiRss },
    { id: 'requests', label: 'Demandes & réclamations', icon: FiInbox },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Communication</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Échanges avec les familles et le personnel, alertes, publications et suivi des demandes.
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
                  ? 'bg-rose-50 text-rose-900 ring-1 ring-rose-200'
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Messages (non lus)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{unreadMessages}</p>
              <p className="text-xs text-gray-500 mt-1">Messagerie interne</p>
            </Card>
            <Card className="p-5 border border-amber-100 bg-amber-50/50">
              <p className="text-xs font-medium text-amber-900 uppercase">Notifications non lues</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">
                {(notifications as any[] | undefined)?.length ?? 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Alertes système</p>
            </Card>
            <Card className="p-5 border border-pink-100 bg-pink-50/40">
              <p className="text-xs font-medium text-pink-900 uppercase">Annonces (total)</p>
              <p className="text-3xl font-bold text-pink-900 mt-1">
                {(announcements as any[] | undefined)?.length ?? 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Brouillons + publiées</p>
            </Card>
            <Card className="p-5 border border-violet-100 bg-violet-50/40">
              <p className="text-xs font-medium text-violet-900 uppercase">Actualités publiées</p>
              <p className="text-3xl font-bold text-violet-900 mt-1">{publishedNews}</p>
              <p className="text-xs text-gray-600 mt-1">Hors circulaires (titre)</p>
            </Card>
          </div>
          <Card className="p-4 border border-gray-200">
            <p className="text-sm text-gray-700">
              Utilisez <strong>Messagerie</strong> pour écrire aux comptes parents, élèves ou
              enseignants. Les <strong>circulaires</strong> sont des annonces dont le titre commence par
              « Circulaire » (ou [Circulaire]). Les <strong>actualités</strong> regroupent les autres
              annonces publiées. Les <strong>demandes et réclamations</strong> mettent en avant les
              messages des familles, les sujets urgents ou les mots-clés (demande, réclamation…).
            </p>
          </Card>
        </div>
      )}

      {tab === 'messaging' && (
        <CommunicationManagement embedded embeddedTab="messages" messagesMode="all" />
      )}
      {tab === 'alerts' && <CommunicationManagement embedded embeddedTab="notifications" />}
      {tab === 'circulars' && (
        <div className="space-y-3">
          <Card className="p-4 border border-rose-100 bg-rose-50/40">
            <p className="text-sm text-gray-700">
              Pour classer une annonce comme <strong>circulaire</strong>, commencez le titre par{' '}
              <code className="bg-white px-1 rounded text-rose-800">Circulaire</code> ou{' '}
              <code className="bg-white px-1 rounded text-rose-800">[Circulaire]</code>.
            </p>
          </Card>
          <CommunicationManagement
            embedded
            embeddedTab="announcements"
            announcementKind="circular"
          />
        </div>
      )}
      {tab === 'news' && (
        <CommunicationManagement embedded embeddedTab="announcements" announcementKind="news" />
      )}
      {tab === 'requests' && (
        <div className="space-y-3">
          <Card className="p-4 border border-blue-100 bg-blue-50/40">
            <p className="text-sm text-gray-700">
              Filtre : messages des <strong>parents et élèves</strong>, catégorie{' '}
              <strong>Urgent</strong>, ou contenant les mots demande, réclamation, plainte, recours.
            </p>
          </Card>
          <CommunicationManagement
            embedded
            embeddedTab="messages"
            messagesMode="requests"
          />
        </div>
      )}
    </div>
  );
};

export default CommunicationHubModule;
