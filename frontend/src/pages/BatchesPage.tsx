import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Trash2, Check } from 'lucide-react';
import { getBatches, deleteBatch, getErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/activity';
import type { Batch } from '../types';

const percent = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : '—';

export function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      const data = await getBatches();
      setBatches(data);
    } catch (err) {
      console.error('Error loading batches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote? Os criativos e o histórico serão apagados.')) return;

    try {
      await deleteBatch(id);
      setBatches(batches.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error deleting batch:', err);
      setError(getErrorMessage(err, 'Erro ao excluir lote'));
    }
  };

  const copyLink = async (batch: Batch) => {
    const link = `${window.location.origin}/approve/${batch.accessToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(batch.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError(`Não foi possível copiar automaticamente. Link: ${link}`);
    }
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Lotes Enviados</h1>
        <Link to="/batches/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Novo Lote
        </Link>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {batches.length === 0 ? (
        <div className="card-static p-8 text-center">
          <p className="text-text-tertiary mb-4">Nenhum lote criado ainda.</p>
          <Link to="/batches/new" className="btn btn-primary">
            Criar primeiro lote
          </Link>
        </div>
      ) : (
        <div className="card-static overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Nome
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Cliente
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Aprovado / Reprovado
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Criado em
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Última interação
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/batches/${batch.id}`}
                      className="font-medium text-text-primary hover:text-white/80"
                    >
                      {batch.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{batch.client.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${
                        batch.status === 'COMPLETED'
                          ? 'badge-success'
                          : batch.status === 'PARTIAL'
                          ? 'badge-warning'
                          : ''
                      }`}
                    >
                      {batch.status === 'COMPLETED'
                        ? 'Finalizado'
                        : batch.status === 'PARTIAL'
                        ? 'Parcial'
                        : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-status-success" title={`${batch.approvedCount} aprovados`}>
                        {percent(batch.approvedCount, batch.totalCreatives)}
                      </span>
                      <span className="text-text-muted">/</span>
                      <span className="text-status-error" title={`${batch.rejectedCount} reprovados`}>
                        {percent(batch.rejectedCount, batch.totalCreatives)}
                      </span>
                      <span className="text-text-muted text-xs">
                        ({batch.approvedCount + batch.rejectedCount}/{batch.totalCreatives})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-tertiary whitespace-nowrap">
                    {formatDateTime(batch.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-tertiary whitespace-nowrap">
                    {batch.lastInteractionAt ? formatDateTime(batch.lastInteractionAt) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(batch)}
                        className="btn-icon"
                        title={copiedId === batch.id ? 'Link copiado!' : 'Copiar link do cliente'}
                      >
                        {copiedId === batch.id ? (
                          <Check size={16} className="text-status-success" />
                        ) : (
                          <ExternalLink size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="btn-icon hover:bg-status-error/20 hover:text-status-error hover:border-status-error/30"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
