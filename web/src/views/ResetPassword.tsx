import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import Login3D from '../components/illustrations/Login3DLazy';

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Token de réinitialisation manquant');
      router.replace('/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token de réinitialisation manquant');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès !');
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la réinitialisation';
      toast.error(errorMessage);
      
      // Si le token est invalide, rediriger vers forgot-password
      if (errorMessage.includes('invalide') || errorMessage.includes('expiré')) {
        setTimeout(() => {
          router.replace('/forgot-password');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
        <Login3D />
        
        <div className="w-full max-w-md relative z-10">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-2xl opacity-20"></div>
            
            <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/30">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                  <FiCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Succès !</h2>
                  <p className="text-gray-600">
                    Votre mot de passe a été réinitialisé avec succès.
                  </p>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-700">
                    Vous allez être redirigé vers la page de connexion dans quelques secondes...
                  </p>
                </div>

                <Link href="/login">
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                  >
                    Se connecter maintenant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Illustration 3D en arrière-plan */}
      <Login3D />
      
      <div className="w-full max-w-md relative z-10">
        <div className="relative">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
          
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/30">
            {/* Bouton retour */}
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Link>

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl transform hover:rotate-12 transition-transform duration-300">
                  <FiLock className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Nouveau mot de passe</h2>
              <p className="text-gray-600 text-lg">
                Entrez votre nouveau mot de passe
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nouveau mot de passe
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
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimum 6 caractères</p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={`w-5 h-5 transition-colors ${confirmPassword ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 6}
                isLoading={loading}
                className="w-full group relative overflow-hidden"
                size="lg"
              >
                {!loading && (
                  <>
                    <span className="relative z-10 flex items-center justify-center">
                      Réinitialiser le mot de passe
                      <FiLock className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
