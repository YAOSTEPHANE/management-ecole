import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentApi, studentApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { FiInbox, FiSend, FiEdit3, FiMail } from 'react-icons/fi';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'GENERAL', label: 'Général' },
  { value: 'ACADEMIC', label: 'Scolarité / cours' },
  { value: 'ABSENCE', label: 'Absence' },
  { value: 'PAYMENT', label: 'Paiement / frais' },
  { value: 'CONDUCT', label: 'Conduite' },
  { value: 'URGENT', label: 'Urgent' },
];

type Role = 'parent' | 'student';

type Props = {
  role: Role;
  /** Parent : pré-remplit le contexte élève dans le message */
  contextStudentId?: string | null;
};

function roleLabel(r: string | undefined) {
  switch (r) {
    case 'ADMIN':
      return 'Administration';
    case 'TEACHER':
      return 'Enseignant';
    case 'EDUCATOR':
      return 'Éducateur';
    default:
      return r ?? '—';
  }
}

const SchoolCommunication: React.FC<Props> = ({ role, contextStudentId }) => {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [childId, setChildId] = useState('');

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: parentApi.getChildren,
    enabled: role === 'parent',
  });

  useEffect(() => {
    if (contextStudentId) {
      setChildId(contextStudentId);
    }
  }, [contextStudentId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['school-messages', role],
    queryFn: () => (role === 'parent' ? parentApi.getMessages() : studentApi.getMessages()),
  });

  const received = (data as { received?: any[] } | undefined)?.received ?? [];
  const sent = (data as { sent?: any[] } | undefined)?.sent ?? [];

  const unreadCount = received.filter((m: any) => !m.read).length;

  const markRead = useMutation({
    mutationFn: (id: string) =>
      role === 'parent' ? parentApi.markMessageAsRead(id) : studentApi.markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-messages', role] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: () => {
      if (role === 'parent') {
        return parentApi.sendSchoolMessage({
          subject: subject.trim() || undefined,
          content: content.trim(),
          category,
          ...(childId ? { studentId: childId } : {}),
        });
      }
      return studentApi.sendSchoolMessage({
        subject: subject.trim() || undefined,
        content: content.trim(),
        category,
      });
    },
    onSuccess: () => {
      toast.success('Message envoyé à l’administration');
      setSubject('');
      setContent('');
      setCategory('GENERAL');
      queryClient.invalidateQueries({ queryKey: ['school-messages', role] });
      setSection('sent');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || 'Envoi impossible'),
  });

  const openMessage = (m: any) => {
    if (!m.read) {
      markRead.mutate(m.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection('inbox')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            section === 'inbox'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FiInbox className="w-4 h-4" />
          Reçus
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">{unreadCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSection('sent')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            section === 'sent'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FiSend className="w-4 h-4" />
          Envoyés
        </button>
        <button
          type="button"
          onClick={() => setSection('compose')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            section === 'compose'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FiEdit3 className="w-4 h-4" />
          Nouveau message
        </button>
        <Button type="button" variant="outline" className="ml-auto text-sm" onClick={() => refetch()}>
          Actualiser
        </Button>
      </div>

      {section === 'compose' && (
        <Card className="p-6 border border-orange-100 bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Écrire à l’école</h3>
          <p className="text-sm text-gray-500 mb-4">
            Votre message est adressé à l’administration. Vous recevrez une réponse dans la boîte « Reçus ».
          </p>
          <div className="space-y-4 max-w-2xl">
            {role === 'parent' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Concernant un enfant (optionnel)
                </label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                >
                  <option value="">— Message général —</option>
                  {(children as any[])?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.user?.firstName} {c.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Objet</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet du message"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[140px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Votre message…"
              />
            </div>
            <Button
              type="button"
              onClick={() => sendMessage.mutate()}
              disabled={!content.trim() || sendMessage.isPending}
            >
              <FiMail className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </Card>
      )}

      {section === 'inbox' && (
        <Card className="overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Chargement…</div>
          ) : received.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Aucun message reçu.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {received.map((m: any) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${
                      !m.read ? 'bg-orange-50/50' : ''
                    }`}
                    onClick={() => openMessage(m)}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-gray-900">
                        {m.sender?.firstName} {m.sender?.lastName}
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          ({roleLabel(m.sender?.role)})
                        </span>
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {format(new Date(m.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                    {m.subject && (
                      <p className="text-sm font-medium text-gray-800 mt-1">{m.subject}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3 whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {section === 'sent' && (
        <Card className="overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Chargement…</div>
          ) : sent.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Aucun message envoyé.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sent.map((m: any) => (
                <li key={m.id} className="px-4 py-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-gray-500">
                      À : {m.receiver?.firstName} {m.receiver?.lastName} ({roleLabel(m.receiver?.role)})
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(m.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  {m.subject && (
                    <p className="text-sm font-medium text-gray-900 mt-1">{m.subject}</p>
                  )}
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
};

export default SchoolCommunication;
