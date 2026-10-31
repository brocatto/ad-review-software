import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { verifyEmail } from '../lib/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('Token de verificação não encontrado');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setStatus('success');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.message || 'Erro ao verificar email');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="card-static p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Loader className="w-8 h-8 text-text-secondary animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Verificando seu email...
              </h1>
              <p className="text-text-tertiary">
                Aguarde enquanto confirmamos seu endereço de email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-status-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-status-success" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Email verificado!
              </h1>
              <p className="text-text-tertiary mb-6">
                Sua conta foi ativada com sucesso. Você será redirecionado para o dashboard.
              </p>
              <div className="badge badge-success mx-auto">
                30 dias de teste grátis ativados
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-status-error/20 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-status-error" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary mb-2">
                Erro na verificação
              </h1>
              <p className="text-text-tertiary mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Link to="/login" className="btn btn-primary w-full block">
                  Ir para Login
                </Link>
                <Link to="/signup" className="btn btn-secondary w-full block">
                  Criar nova conta
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
