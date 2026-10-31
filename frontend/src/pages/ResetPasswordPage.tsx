import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de redefinição inválido ou ausente');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token de redefinição inválido');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, newPassword);
      setSuccess(response.message);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-text-primary">Nova Senha</h1>
          <p className="text-text-secondary mt-2">
            Digite sua nova senha abaixo
          </p>
        </div>

        <div className="card-static p-8">
          {success ? (
            <div className="text-center">
              <div className="alert alert-success mb-6">
                {success}
              </div>
              <p className="text-text-secondary mb-4">
                Redirecionando para o login...
              </p>
              <div className="flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-text-muted border-t-text-primary rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert alert-error animate-shake">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="label">
                  Nova Senha
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoFocus
                  disabled={!token}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Digite a senha novamente"
                  required
                  minLength={8}
                  disabled={!token}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redefinindo...
                  </span>
                ) : (
                  'Redefinir Senha'
                )}
              </button>

              <div className="divider" />

              <p className="text-center text-sm text-text-muted">
                Lembrou sua senha?{' '}
                <Link to="/login" className="text-text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
