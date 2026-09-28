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
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FolderOpen size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Lotes</p>
              <p className="text-2xl font-semibold">{totalBatches}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprovados</p>
              <p className="text-2xl font-semibold text-green-600">{totalApproved}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reprovados</p>
              <p className="text-2xl font-semibold text-red-600">{totalRejected}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-2xl font-semibold text-yellow-600">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Batches */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lotes Recentes</h2>
            <Link to="/batches" className="text-sm text-gray-500 hover:text-black">
              Ver todos
            </Link>
          </div>
        </div>

        {recentBatches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum lote criado ainda.{' '}
            <Link to="/batches/new" className="text-black underline">
              Criar primeiro lote
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentBatches.map((batch) => (
              <Link
                key={batch.id}
                to={`/batches/${batch.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-black">{batch.name}</p>
                  <p className="text-sm text-gray-500">{batch.client.name}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      batch.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : batch.status === 'PARTIAL'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {batch.status === 'COMPLETED'
                      ? 'Finalizado'
                      : batch.status === 'PARTIAL'
                      ? 'Parcial'
                      : 'Pendente'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
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
