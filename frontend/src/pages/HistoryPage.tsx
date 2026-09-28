import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../lib/api';
import { describeActivity, formatDateTime } from '../lib/activity';
import type { ActivityLog } from '../types';

const PAGE_SIZE = 50;

export function HistoryPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async (before?: string) => {
    try {
      const data = await getHistory(before, PAGE_SIZE);
      setLogs((prev) => (before ? [...prev, ...data] : data));
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!logs.length) return;
    setLoadingMore(true);
    loadPage(logs[logs.length - 1].createdAt);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black mb-8">Histórico</h1>

      <div className="card">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma atividade registrada.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-black">{describeActivity(log)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {log.batch ? (
                      <Link to={`/batches/${log.batch.id}`} className="hover:underline">
                        {log.batch.name} · {log.batch.client.name}
                      </Link>
                    ) : (
                      'Lote excluído'
                    )}
                    {' · '}
                    {log.user?.fullName || 'Cliente'}
                  </p>
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && logs.length > 0 && (
        <div className="text-center mt-6">
          <button onClick={loadMore} disabled={loadingMore} className="btn btn-secondary">
            {loadingMore ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
}
