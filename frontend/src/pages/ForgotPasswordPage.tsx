import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setSuccess(response.message);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-text-primary">Recuperar Senha</h1>
          <p className="text-text-secondary mt-2">
            Digite seu email para receber um link de redefinição
          </p>
        </div>

        <div className="card-static p-8">
          {success ? (
            <div className="text-center">
              <div className="alert alert-success mb-6">
                {success}
              </div>
              <p className="text-text-secondary mb-6">
                Verifique seu email (incluindo a pasta de spam) para o link de redefinição de senha.
              </p>
              <Link to="/login" className="btn btn-primary w-full">
                Voltar para Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert alert-error animate-shake">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar Link de Redefinição'
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
