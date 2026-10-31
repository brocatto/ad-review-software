import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  signup as apiSignup,
  googleAuth,
  resendVerification,
  storeSession,
  getErrorMessage,
} from '../lib/api';
import { useGoogleSignIn } from '../lib/google';

const TRIAL_DAYS = 30; // keep in sync with backend TRIAL_PERIOD_DAYS

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resent, setResent] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setError('');
      setGoogleLoading(true);
      try {
        storeSession(await googleAuth(idToken));
        navigate('/dashboard');
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao entrar com Google'));
      } finally {
        setGoogleLoading(false);
      }
    },
    [navigate],
  );

  const googleAvailable = useGoogleSignIn(googleButtonRef, handleGoogleCredential, 'signup_with');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiSignup(email.trim(), password, fullName.trim());
      setSuccess(response.message);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar conta'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent('');
    try {
      const response = await resendVerification(email.trim());
      setResent(response.message);
    } catch (err) {
      setResent(getErrorMessage(err, 'Não foi possível reenviar agora. Tente em instantes.'));
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fadeIn">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-glass border border-glass-border flex items-center justify-center"
            aria-label="Voltar para a página inicial"
          >
            <Sparkles size={24} className="text-text-secondary" />
          </Link>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight">Criar conta</h1>
          <p className="text-text-tertiary mt-2">
            Comece seu teste grátis de {TRIAL_DAYS} dias. Sem cartão de crédito.
          </p>
        </div>

        <div className="card-static p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="alert alert-success">{success}</div>
              <p className="text-text-secondary text-sm">
                Enviamos um link de confirmação para{' '}
                <strong className="text-text-primary">{email}</strong>. Confira também a pasta de
                spam.
              </p>
              <button type="button" onClick={handleResend} className="btn btn-secondary w-full">
                Reenviar e-mail
              </button>
              {resent && <p className="text-xs text-text-muted">{resent}</p>}
              <Link to="/login" className="btn btn-primary w-full block">
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="alert alert-error animate-shake">{error}</div>}

              <div>
                <label htmlFor="fullName" className="label">
                  Nome completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  'Criar conta grátis'
                )}
              </button>

              {googleAvailable && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-glass-border" />
                    <span className="text-text-muted text-xs uppercase tracking-wide">ou</span>
                    <div className="flex-1 h-px bg-glass-border" />
                  </div>
                  <div ref={googleButtonRef} className="flex justify-center min-h-[44px]" />
                  {googleLoading && (
                    <p className="text-center text-sm text-text-tertiary">Entrando com Google...</p>
                  )}
                </>
              )}
            </form>
          )}
        </div>

        {!success && (
          <p className="text-center text-sm text-text-muted mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        )}
        <p className="text-center text-xs text-text-muted mt-3">
          Ao criar uma conta, você concorda com os Termos de Uso.
        </p>
      </div>
    </div>
  );
}
