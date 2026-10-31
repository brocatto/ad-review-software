import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { login as apiLogin, googleAuth, storeSession, getErrorMessage } from '../lib/api';
import { useGoogleSignIn } from '../lib/google';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Already signed in: go straight to the panel
  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/dashboard', { replace: true });
  }, [navigate]);

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

  const googleAvailable = useGoogleSignIn(googleButtonRef, handleGoogleCredential, 'continue_with');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      storeSession(await apiLogin(email, password));
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Credenciais inválidas'));
    } finally {
      setLoading(false);
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
            <LogIn size={24} className="text-text-secondary" />
          </Link>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight">AdReviewOS</h1>
          <p className="text-text-tertiary mt-2">Acesse o painel interno</p>
        </div>

        <form onSubmit={handleSubmit} className="card-static p-8 space-y-5">
          {error && <div className="alert alert-error animate-shake">{error}</div>}

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
              autoFocus
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="label mb-0">
                Senha
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
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

        <p className="text-center text-sm text-text-muted mt-6">
          Não tem conta?{' '}
          <Link to="/signup" className="text-text-primary hover:underline">
            Criar conta grátis
          </Link>
        </p>
        <p className="text-center text-xs text-text-muted mt-3">
          Clientes acessam pelo link único enviado pelo time, sem login.
        </p>
      </div>
    </div>
  );
}
