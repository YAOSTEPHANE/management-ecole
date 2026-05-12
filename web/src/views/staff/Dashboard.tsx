'use client';

import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import { FiBriefcase, FiUser } from 'react-icons/fi';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const sp = (user as any)?.staffProfile;

  return (
    <Layout user={user} onLogout={logout} role="STAFF">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-700 to-emerald-900 flex items-center justify-center text-amber-50 shadow-lg">
            <FiBriefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Espace personnel</h1>
            <p className="text-sm text-stone-600">
              {user?.firstName} {user?.lastName}
              {sp?.jobTitle ? ` · ${sp.jobTitle}` : ''}
            </p>
          </div>
        </div>

        <Card className="p-5 space-y-3">
          <p className="text-sm text-stone-700 leading-relaxed">
            Votre compte est rattaché au <strong>personnel administratif et de soutien</strong> de l’établissement.
            Les pointages, organigramme et fiches de poste sont gérés depuis l’interface administrateur.
          </p>
          {sp?.employeeId && (
            <p className="text-xs text-stone-500 flex items-center gap-2">
              <FiUser className="w-3.5 h-3.5 shrink-0" />
              Matricule : <span className="font-mono text-stone-800">{sp.employeeId}</span>
            </p>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default StaffDashboard;
