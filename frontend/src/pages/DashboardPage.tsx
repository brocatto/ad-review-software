import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getBatches } from '../lib/api';
import type { Batch } from '../types';

export function DashboardPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await getBatches();
      setBatches(data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBatches = batches.length;
  const totalApproved = batches.reduce((sum, b) => sum + b.approvedCount, 0);
  const totalRejected = batches.reduce((sum, b) => sum + b.rejectedCount, 0);
  const totalPending = batches.reduce((sum, b) => sum + b.pendingCount, 0);

  const recentBatches = batches.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <FolderOpen size={24} className="text-text-secondary" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Total de Lotes</p>
              <p className="text-2xl font-semibold text-text-primary">{totalBatches}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <CheckCircle size={24} className="text-status-success" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Aprovados</p>
              <p className="text-2xl font-semibold text-status-success">{totalApproved}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-status-error/20 rounded-xl">
              <XCircle size={24} className="text-status-error" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Reprovados</p>
              <p className="text-2xl font-semibold text-status-error">{totalRejected}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-status-warning/20 rounded-xl">
              <Clock size={24} className="text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Pendentes</p>
              <p className="text-2xl font-semibold text-status-warning">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Batches */}
      <div className="card-static">
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Lotes Recentes</h2>
            <Link to="/batches" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
              Ver todos
            </Link>
          </div>
        </div>

        {recentBatches.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">
            Nenhum lote criado ainda.{' '}
            <Link to="/batches/new" className="text-text-primary underline">
              Criar primeiro lote
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {recentBatches.map((batch) => (
              <Link
                key={batch.id}
                to={`/batches/${batch.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="font-medium text-text-primary">{batch.name}</p>
                  <p className="text-sm text-text-tertiary">{batch.client.name}</p>
                </div>
                <div className="text-right">
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
                  <p className="text-xs text-text-muted mt-1">
                    {batch.approvedCount}/{batch.totalCreatives} aprovados
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
