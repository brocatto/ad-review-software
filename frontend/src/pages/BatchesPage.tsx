import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { getBatches, deleteBatch } from '../lib/api';
import type { Batch } from '../types';

export function BatchesPage() {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote?')) return;

    try {
      await deleteBatch(id);
      setBatches(batches.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const copyLink = (accessToken: string) => {
    const link = `${window.location.origin}/approve/${accessToken}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-black">Lotes Enviados</h1>
        <Link to="/batches/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Novo Lote
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhum lote criado ainda.</p>
          <Link to="/batches/new" className="btn btn-primary">
            Criar primeiro lote
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Nome
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Cliente
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Progresso
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Criado em
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/batches/${batch.id}`}
                      className="font-medium text-black hover:underline"
                    >
                      {batch.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{batch.client.name}</td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">{batch.approvedCount}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-600">{batch.rejectedCount}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">{batch.totalCreatives}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(batch.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(batch.accessToken)}
                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg"
                        title="Copiar link"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
