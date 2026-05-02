import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import Login3D from '../components/illustrations/Login3DLazy';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                  <FiMail className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Mot de passe oublié ?</h2>
              <p className="text-gray-600 text-lg">
                {emailSent
                  ? 'Vérifiez votre boîte mail'
                  : 'Entrez votre adresse email pour recevoir un lien de réinitialisation'}
              </p>
            </div>

            {emailSent ? (
              <div className="space-y-6">
                {/* Message de succès */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2">Email envoyé !</h3>
                      <p className="text-sm text-green-700 mb-2">
                        Si un compte existe avec l'adresse <span className="font-semibold">{email}</span>, 
                        vous recevrez un email contenant un lien pour réinitialiser votre mot de passe.
                      </p>
                      <p className="text-xs text-green-600 mt-3">
                        💡 <strong>Astuce :</strong> Vérifiez aussi votre dossier spam si vous ne voyez pas l'email.
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        ⚠️ <strong>Note :</strong> Le lien est valide pendant 1 heure.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                    }}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Envoyer un autre email
                  </Button>
                  <Link href="/login">
                    <Button
                      variant="primary"
                      className="w-full"
                      size="lg"
                    >
                      Retour à la connexion
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  isLoading={loading}
                  className="w-full group relative overflow-hidden"
                  size="lg"
                >
                  {!loading && (
                    <>
                      <span className="relative z-10 flex items-center justify-center">
                        Envoyer le lien de réinitialisation
                        <FiMail className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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

export default ForgotPassword;
