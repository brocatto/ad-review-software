import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertTriangle, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  getBillingStatus,
  createCheckout,
  createPortalSession,
  getCurrentUser,
  getErrorMessage,
} from '../lib/api';
import type { BillingStatus } from '../types';

const FALLBACK_PRICE_CENTS = 9900;

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const PLAN_FEATURES = [
  'Lotes e criativos ilimitados',
  'Clientes ilimitados',
  'Link de aprovação sem login para o cliente',
  'Revisões e versões dos criativos',
  'Notificações no Slack',
  'Histórico completo de atividades',
];

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(
    null,
  );

  const loadStatus = useCallback(async () => {
    try {
      const data = await getBillingStatus();
      setStatus(data);
      // Keep the sidebar badge in sync with what the backend knows
      const user = getCurrentUser();
      if (user) {
        localStorage.setItem(
          'user',
          JSON.stringify({ ...user, subscriptionStatus: data.subscriptionStatus, trialEndsAt: data.trialEndsAt }),
        );
      }
      return data;
    } catch (error) {
      console.error('Error loading billing status:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();

    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Assinatura realizada com sucesso! Atualizando seu status...' });
      // Stripe confirms the subscription through a webhook a few seconds later
      const timers = [3000, 8000].map((ms) => setTimeout(loadStatus, ms));
      return () => timers.forEach(clearTimeout);
    }
    if (searchParams.get('canceled') === 'true') {
      setMessage({ type: 'warning', text: 'Checkout cancelado. Você pode assinar quando quiser.' });
    }
    if (searchParams.get('expired') === 'true') {
      setMessage({
        type: 'warning',
        text: 'Seu período de teste terminou. Assine para continuar usando o painel.',
      });
    }
  }, [searchParams, loadStatus]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { url } = await createCheckout();
      if (url) window.location.href = url;
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao iniciar o checkout') });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      if (url) window.location.href = url;
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Erro ao abrir o portal de cobrança') });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="animate-fadeIn max-w-3xl">
        <h1 className="text-2xl font-semibold text-text-primary mb-8">Faturamento</h1>
        <div className="alert alert-error">Não foi possível carregar o status da sua conta.</div>
      </div>
    );
  }

  const hasSubscription = !!status.subscription;
  const priceCents = status.priceMonthly ?? FALLBACK_PRICE_CENTS;
  const priceLabel = formatMoney(priceCents, status.currency || 'brl');

  const statusBadge = status.isAdmin ? (
    <span className="badge badge-success flex items-center gap-1">
      <ShieldCheck size={14} />
      Conta interna
    </span>
  ) : status.subscriptionStatus === 'ACTIVE' ? (
    <span className="badge badge-success flex items-center gap-1">
      <CheckCircle size={14} />
      Ativo
    </span>
  ) : status.subscriptionStatus === 'PAST_DUE' ? (
    <span className="badge badge-error flex items-center gap-1">
      <AlertTriangle size={14} />
      Pagamento pendente
    </span>
  ) : status.isTrialActive ? (
    <span className="badge badge-warning flex items-center gap-1">
      <Clock size={14} />
      Teste grátis
    </span>
  ) : (
    <span className="badge badge-error flex items-center gap-1">
      <AlertTriangle size={14} />
      Expirado
    </span>
  );

  return (
    <div className="animate-fadeIn max-w-3xl">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Faturamento</h1>

      {message && (
        <div
          className={`alert mb-6 ${
            message.type === 'success'
              ? 'alert-success'
              : message.type === 'error'
              ? 'alert-error'
              : 'bg-status-warning/10 border border-status-warning/20 text-status-warning'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current Status */}
      <div className="card-static p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">Status da conta</h2>
            <p className="text-text-tertiary text-sm">
              {status.isAdmin
                ? 'Contas do time interno não são cobradas.'
                : status.subscription?.plan?.name || 'Sem assinatura ativa'}
            </p>
          </div>
          {statusBadge}
        </div>

        {!status.isAdmin && status.isTrialActive && (
          <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="text-status-warning" size={20} />
              <div>
                <p className="text-text-primary font-medium">
                  {status.trialDaysLeft} {status.trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'} no
                  teste grátis
                </p>
                <p className="text-text-tertiary text-sm">
                  Expira em {status.trialEndsAt ? formatDate(status.trialEndsAt) : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {status.subscription && (
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-glass-border">
              <span className="text-text-tertiary">Próxima cobrança</span>
              <span className="text-text-primary">{formatDate(status.subscription.currentPeriodEnd)}</span>
            </div>
            {status.subscription.plan && (
              <div className="flex items-center justify-between py-3 border-b border-glass-border">
                <span className="text-text-tertiary">Valor mensal</span>
                <span className="text-text-primary">
                  {formatMoney(status.subscription.plan.price, status.currency || 'brl')}
                </span>
              </div>
            )}
            {status.subscription.cancelAtPeriodEnd && (
              <div className="alert alert-error mt-4">
                <AlertTriangle size={16} className="inline mr-2" />
                Assinatura será encerrada em {formatDate(status.subscription.currentPeriodEnd)}
              </div>
            )}
          </div>
        )}

        {!status.isAdmin && (
          <div className="mt-6 flex flex-wrap gap-3">
            {hasSubscription ? (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="btn btn-secondary flex items-center gap-2"
              >
                {portalLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ExternalLink size={16} />
                )}
                Gerenciar assinatura
              </button>
            ) : status.billingEnabled ? (
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                {checkoutLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                Assinar agora
              </button>
            ) : (
              <p className="text-sm text-text-muted">
                A cobrança ainda não está configurada neste ambiente.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Plan */}
      {!status.isAdmin && !hasSubscription && (
        <div className="card p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Plano Pro</h2>
            <p className="text-text-tertiary">Tudo que você precisa para aprovar criativos sem caos</p>
          </div>

          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-text-primary">{priceLabel}</span>
            <span className="text-text-tertiary">/mês</span>
          </div>

          <div className="space-y-3 mb-6">
            {PLAN_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle className="text-status-success" size={16} />
                <span className="text-text-secondary">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || !status.billingEnabled}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {checkoutLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Carregando...
              </span>
            ) : (
              'Começar assinatura'
            )}
          </button>
          <p className="text-center text-xs text-text-muted mt-3">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </div>
      )}
    </div>
  );
}
