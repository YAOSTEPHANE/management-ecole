'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '@/services/api/public';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import {
  ENROLLMENT_STATUS_LABELS,
  enrollmentBadgeVariant,
  type EnrollmentStatusValue,
} from '@/lib/enrollmentStatus';

type CardPayload = {
  studentId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  className?: string | null;
  classLevel?: string | null;
  academicYear?: string | null;
  enrollmentStatus: string;
  isActive: boolean;
};

export default function CarteEtudiantPage() {
  const params = useParams();
  const publicId = typeof params?.publicId === 'string' ? params.publicId : '';
  const [data, setData] = useState<CardPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;
    setErr(null);
    setData(null);
    publicApi
      .getStudentCardByPublicId(publicId)
      .then((payload) => {
        if (!cancelled) setData(payload as CardPayload);
      })
      .catch((e: { response?: { data?: { error?: string } } }) => {
        if (!cancelled) setErr(e.response?.data?.error || 'Carte introuvable');
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  if (!publicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        Lien invalide.
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <p className="text-center text-amber-200/90">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Chargement…
      </div>
    );
  }

  const es = (data.enrollmentStatus as EnrollmentStatusValue) || 'ACTIVE';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-md p-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/90">Carte étudiant</p>
          <h1 className="text-xl font-semibold text-white">Gestion scolaire</h1>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Avatar
            src={data.avatar || undefined}
            name={`${data.firstName} ${data.lastName}`}
            size="xl"
          />
          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {data.firstName} {data.lastName}
            </p>
            <p className="text-sm text-slate-400 font-mono mt-1">{data.studentId}</p>
          </div>
        </div>
        <div className="rounded-xl bg-black/25 border border-white/5 p-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-400">Classe</span>
            <span className="text-right text-white font-medium">
              {data.className ? `${data.className}` : '—'}
              {data.classLevel ? (
                <span className="text-slate-400 font-normal"> · {data.classLevel}</span>
              ) : null}
            </span>
          </div>
          {data.academicYear ? (
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Année</span>
              <span className="text-white">{data.academicYear}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
            <span className="text-slate-400">Inscription</span>
            <Badge variant={enrollmentBadgeVariant(es)}>{ENROLLMENT_STATUS_LABELS[es] ?? es}</Badge>
          </div>
          <div className="flex justify-between gap-2 text-xs text-slate-500">
            <span>Fiche</span>
            <span>{data.isActive ? 'active' : 'inactive'}</span>
          </div>
        </div>
        <p className="text-[11px] text-center text-slate-500 leading-relaxed">
          Document non contractuel. En cas de doute, vérifiez auprès de l&apos;administration.
        </p>
      </div>
    </div>
  );
}
