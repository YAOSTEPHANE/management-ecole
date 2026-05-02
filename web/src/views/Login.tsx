import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiArrowRight
} from 'react-icons/fi';
import Login3D from '../components/illustrations/Login3DLazy';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email'); // Étape actuelle
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role.toLowerCase();
      router.replace(`/${role}`);
    }
  }, [user, authLoading, router]);

  // Gérer la soumission de l'email
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setStep('password');
    } else {
      toast.error('Veuillez entrer une adresse email valide');
    }
  };

  // Gérer la soumission du mot de passe (connexion finale)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier la connexion au serveur avant de tenter la connexion
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      try {
        const healthCheck = await fetch(`${API_URL.replace('/api', '')}/api/health`);
        if (!healthCheck.ok) {
          toast.error('Le serveur backend n\'est pas accessible. Vérifiez qu\'il est démarré.');
          setLoading(false);
          return;
        }
      } catch (error) {
        toast.error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 5000.');
        console.error('Erreur de connexion au serveur:', error);
        setLoading(false);
        return;
      }

      const response = await login(email, password);
      if (response?.user) {
        const role = response.user.role.toLowerCase();
        router.replace(`/${role}`);
      }
    } catch (error: any) {
      // Erreur déjà gérée dans le contexte, mais on peut ajouter plus de détails
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Erreur réseau. Vérifiez que le serveur backend est démarré.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Retour à l'étape email
  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <Login3D />
        <div className="text-center relative z-10">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
          <p className="mt-6 text-lg font-semibold text-slate-700">Vérification de votre session…</p>
        </div>
      </div>
    );
  }

  // Ne pas afficher le formulaire si déjà connecté
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <Login3D />
        <div className="text-center relative z-10">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
          <p className="mt-6 text-lg font-semibold text-slate-700">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Illustration 3D en arrière-plan */}
      <Login3D />
      
      <div className="w-full max-w-md relative z-10">
        <div className="relative">
          {/* Glow effect derrière la carte */}
          <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 rounded-[2rem] blur-3xl opacity-25 animate-shimmer" />
          
          {/* Carte principale */}
          <div className="relative premium-card-surface rounded-[1.75rem] p-8 lg:p-10 border border-white/80 shadow-premium">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl transform transition-transform duration-300 hover:scale-110 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-8 text-center">
              <h2 className="font-display text-4xl font-black mb-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">
                Bienvenue
              </h2>
              <p className="text-gray-600 text-lg">
                {step === 'email' 
                  ? 'Connectez-vous pour accéder à votre espace'
                  : `Bonjour, ${email}`}
              </p>
            </div>

            {step === 'email' ? (
              // Étape 1 : Saisie de l'email
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Adresse email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className={`w-5 h-5 transition-colors ${email ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre.email@exemple.com"
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:bg-white hover:border-gray-300"
                      style={{
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                  </div>
                </div>

                {/* Submit Button - Continuer */}
                <Button
                  type="submit"
                  disabled={!email || !email.includes('@')}
                  className="w-full group relative overflow-hidden"
                  size="lg"
                >
                  <span className="relative z-10 flex items-center justify-center text-white font-semibold">
                    Continuer
                    <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </form>
            ) : (
              // Étape 2 : Saisie du mot de passe
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* Bouton retour */}
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center mb-2"
                >
                  <FiArrowRight className="w-4 h-4 mr-1 rotate-180" />
                  Changer d'email
                </button>

                {/* Email affiché (non éditable) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-12 pr-4 py-4 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                      style={{
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className={`w-5 h-5 transition-colors ${password ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Entrez votre mot de passe"
                      autoFocus
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:bg-white hover:border-gray-300"
                      style={{
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      Se souvenir de moi
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !password}
                  isLoading={loading}
                  className="w-full group relative overflow-hidden"
                  size="lg"
                >
                  {!loading && (
                    <>
                      <span className="relative z-10 flex items-center justify-center text-white font-semibold">
                        Se connecter
                        <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline">
                  Retour à l'accueil
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
