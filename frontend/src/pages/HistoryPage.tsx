import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getHistory } from '../lib/api';
import { describeActivity, formatDateTime, parseDetails } from '../lib/activity';
import { ActivityIcon } from '../components/ActivityIcon';
import type { ActivityLog } from '../types';

const PAGE_SIZE = 50;

export function HistoryPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (before?: string) => {
    try {
      const data = await getHistory(before, PAGE_SIZE);
      setLogs((prev) => (before ? [...prev, ...data] : data));
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const loadMore = () => {
    if (!logs.length) return;
    setLoadingMore(true);
    loadPage(logs[logs.length - 1].createdAt);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Histórico</h1>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      <div className="card-static">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">Nenhuma atividade registrada ainda.</div>
        ) : (
          <div className="divide-y divide-glass-border">
            {logs.map((log) => {
              const details = parseDetails(log.details);
              return (
                <div key={log.id} className="p-4 flex items-start gap-3">
                  <div className="mt-0.5">
                    <ActivityIcon action={log.action} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{describeActivity(log)}</p>
                    {log.action === 'CREATIVE_REJECTED' && details.feedback && (
                      <p className="text-sm text-text-tertiary mt-1 flex items-start gap-1">
                        <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                        <span className="italic">"{details.feedback}"</span>
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      {log.batch ? (
                        <Link
                          to={`/batches/${log.batch.id}`}
                          className="hover:text-text-primary transition-colors"
                        >
                          {log.batch.name} · {log.batch.client.name}
                        </Link>
                      ) : (
                        'Lote excluído'
                      )}
                      {' · '}
                      {log.user?.fullName || 'Cliente'}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && logs.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn btn-secondary disabled:opacity-50"
          >
            {loadingMore ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
}
