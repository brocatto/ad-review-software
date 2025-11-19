import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Clock, Upload, RefreshCw } from 'lucide-react';
import { getBatch, updateAdjustmentStatus, uploadRevision } from '../lib/api';
import type { Batch, Creative } from '../types';

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadBatch();
  }, [id]);

  const loadBatch = async () => {
    try {
      const data = await getBatch(id!);
      setBatch(data);
    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!batch) return;
    const link = `${window.location.origin}/approve/${batch.accessToken}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  const handleAdjustmentChange = async (creativeId: string, status: string) => {
    try {
      await updateAdjustmentStatus(creativeId, status);
      loadBatch();
    } catch (error) {
      console.error('Error updating adjustment status:', error);
    }
  };

  const openRevisionModal = (creative: Creative) => {
    setSelectedCreative(creative);
    setShowRevisionModal(true);
  };

  const handleRevisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCreative) return;

    setUploading(true);
    try {
      await uploadRevision(selectedCreative.id, file);
      setShowRevisionModal(false);
      setSelectedCreative(null);
      loadBatch();
    } catch (error) {
      console.error('Error uploading revision:', error);
      alert('Erro ao enviar revisão');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'REJECTED':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getAdjustmentLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Não iniciado';
      case 'IN_PROGRESS':
        return 'Em execução';
      case 'ADJUSTED':
        return 'Ajustado';
      case 'RESENT':
        return 'Reenviado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lote não encontrado</p>
        <Link to="/batches" className="text-black underline mt-2 inline-block">
          Voltar para lotes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/batches"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-black">{batch.name}</h1>
            <p className="text-gray-500">{batch.client.name}</p>
          </div>
        </div>
        <button onClick={copyLink} className="btn btn-secondary flex items-center gap-2">
          <ExternalLink size={16} />
          Copiar Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold">{batch.totalCreatives}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{batch.approvedCount}</p>
          <p className="text-sm text-gray-500">Aprovados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-red-600">{batch.rejectedCount}</p>
          <p className="text-sm text-gray-500">Reprovados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-yellow-600">{batch.pendingCount}</p>
          <p className="text-sm text-gray-500">Pendentes</p>
        </div>
      </div>

      {/* Creatives */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Criativos</h2>
        </div>

        {batch.creatives?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum criativo neste lote.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {batch.creatives?.map((creative: Creative) => (
              <div key={creative.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {creative.fileType === 'IMAGE' ? (
                      <img
                        src={`http://localhost:3000${creative.fileUrl}`}
                        alt={creative.name}
                        className="w-full h-full object-cover"
                      />
                    ) : creative.fileType === 'VIDEO' ? (
                      <video
                        src={`http://localhost:3000${creative.fileUrl}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        TXT
                      </div>
                    )}
                    {/* Version badge */}
                    {creative.currentVersion > 1 && (
                      <span className="absolute top-1 right-1 bg-black text-white text-xs px-1.5 py-0.5 rounded">
                        v{creative.currentVersion}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(creative.approval?.status || 'PENDING')}
                      <span className="font-medium">{creative.name}</span>
                      {creative.revisionCount > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <RefreshCw size={12} />
                          {creative.revisionCount} revisão(ões)
                        </span>
                      )}
                    </div>

                    {/* Feedback */}
                    {creative.approval?.feedbackText && (
                      <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-3">
                        <strong>Feedback:</strong> {creative.approval.feedbackText}
                      </div>
                    )}

                    {/* Adjustment Status & Revision Upload */}
                    {creative.approval?.status === 'REJECTED' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Status interno:</span>
                          <select
                            value={creative.adjustmentStatus?.status || 'NOT_STARTED'}
                            onChange={(e) =>
                              handleAdjustmentChange(creative.id, e.target.value)
                            }
                            className="text-sm border border-gray-200 rounded px-2 py-1"
                          >
                            <option value="NOT_STARTED">Não iniciado</option>
                            <option value="IN_PROGRESS">Em execução</option>
                            <option value="ADJUSTED">Ajustado</option>
                            <option value="RESENT">Reenviado</option>
                          </select>
                        </div>
                        <button
                          onClick={() => openRevisionModal(creative)}
                          className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors"
                        >
                          <Upload size={14} />
                          Enviar Revisão
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revision Upload Modal */}
      {showRevisionModal && selectedCreative && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Enviar Revisão</h2>
            <p className="text-gray-600 mb-4">
              Enviando nova versão para: <strong>{selectedCreative.name}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Versão atual: v{selectedCreative.currentVersion} → Nova versão: v{selectedCreative.currentVersion + 1}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleRevisionUpload}
              accept="image/*,video/*"
              className="w-full mb-4"
              disabled={uploading}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setSelectedCreative(null);
                }}
                className="btn btn-secondary flex-1"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary flex-1"
                disabled={uploading}
              >
                {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
