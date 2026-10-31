import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { login as apiLogin, getErrorMessage } from '../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiLogin(email, password);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
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
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-glass border border-glass-border flex items-center justify-center">
            <LogIn size={24} className="text-text-secondary" />
          </div>
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
            <label htmlFor="password" className="label">
              Senha
            </label>
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
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Clientes acessam pelo link único enviado pelo time, sem login.
        </p>
      </div>
    </div>
  );
}
