import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  RefreshCw,
  Pencil,
  History,
  MessageSquare,
  MessageCircle,
  Mail,
  Check,
} from 'lucide-react';
import {
  getBatch,
  getActivityLogs,
  getCreativeActivityLogs,
  updateAdjustmentStatus,
  updateCreativeName,
  uploadRevision,
  getFileUrl,
  getErrorMessage,
} from '../lib/api';
import { describeActivity, formatDateTime, parseDetails } from '../lib/activity';
import { ActivityIcon } from '../components/ActivityIcon';
import type { Batch, Creative, ActivityLog } from '../types';

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [timelineCreativeId, setTimelineCreativeId] = useState<string | null>(null);
  const [creativeTimeline, setCreativeTimeline] = useState<ActivityLog[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBatch = useCallback(async () => {
    if (!id) return;
    try {
      const [batchData, logsData] = await Promise.all([
        getBatch(id),
        getActivityLogs(id).catch(() => [] as ActivityLog[]),
      ]);
      setBatch(batchData);
      setLogs(logsData);
    } catch (err) {
      console.error('Error loading batch:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const loadCreativeTimeline = useCallback(async (creativeId: string) => {
    setTimelineLoading(true);
    try {
      setCreativeTimeline(await getCreativeActivityLogs(creativeId));
    } catch (err) {
      console.error('Error loading creative timeline:', err);
      setCreativeTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const toggleTimeline = (creativeId: string) => {
    if (timelineCreativeId === creativeId) {
      setTimelineCreativeId(null);
      return;
    }
    setTimelineCreativeId(creativeId);
    setCreativeTimeline([]);
    loadCreativeTimeline(creativeId);
  };

  const approvalLink = batch ? `${window.location.origin}/approve/${batch.accessToken}` : '';
  const shareMessage = batch
    ? `Olá! Os criativos do lote "${batch.name}" estão prontos para sua aprovação: ${approvalLink}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(approvalLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(`Não foi possível copiar automaticamente. Link: ${approvalLink}`);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener');
  };

  const shareEmail = () => {
    if (!batch) return;
    const subject = encodeURIComponent(`Aprovação de criativos: ${batch.name}`);
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:${batch.client.email || ''}?subject=${subject}&body=${body}`;
  };

  const handleAdjustmentChange = async (creativeId: string, status: string) => {
    try {
      await updateAdjustmentStatus(creativeId, status);
      await loadBatch();
      if (timelineCreativeId === creativeId) await loadCreativeTimeline(creativeId);
    } catch (err) {
      console.error('Error updating adjustment status:', err);
      setError(getErrorMessage(err, 'Erro ao atualizar status interno'));
    }
  };

  const startEditingName = (creative: Creative) => {
    setEditingCreativeId(creative.id);
    setEditingName(creative.name);
  };

  const cancelEditingName = () => {
    setEditingCreativeId(null);
    setEditingName('');
  };

  const saveCreativeName = async () => {
    if (!editingCreativeId || !editingName.trim() || savingName) return;

    setSavingName(true);
    try {
      await updateCreativeName(editingCreativeId, editingName.trim());
      cancelEditingName();
      await loadBatch();
    } catch (err) {
      console.error('Error renaming creative:', err);
      setError(getErrorMessage(err, 'Erro ao renomear criativo'));
    } finally {
      setSavingName(false);
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
      await loadBatch();
    } catch (err) {
      console.error('Error uploading revision:', err);
      setError(getErrorMessage(err, 'Erro ao enviar revisão'));
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
        return <CheckCircle className="text-status-success" size={20} />;
      case 'REJECTED':
        return <XCircle className="text-status-error" size={20} />;
      default:
        return <Clock className="text-status-warning" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-text-tertiary">Lote não encontrado</p>
        <Link to="/batches" className="text-text-primary underline mt-2 inline-block">
          Voltar para lotes
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {error && <div className="alert alert-error mb-6">{error}</div>}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/batches" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{batch.name}</h1>
            <p className="text-text-tertiary">{batch.client.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareWhatsApp}
            className="btn btn-secondary flex items-center gap-2"
            title="Enviar link pelo WhatsApp"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
          <button
            onClick={shareEmail}
            className="btn btn-secondary flex items-center gap-2"
            title={batch.client.email ? `Enviar para ${batch.client.email}` : 'Enviar por e-mail'}
          >
            <Mail size={16} />
            E-mail
          </button>
          <button onClick={copyLink} className="btn btn-secondary flex items-center gap-2">
            {copied ? <Check size={16} className="text-status-success" /> : <ExternalLink size={16} />}
            {copied ? 'Link copiado' : 'Copiar Link'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-text-primary">{batch.totalCreatives}</p>
          <p className="text-sm text-text-tertiary">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-status-success">{batch.approvedCount}</p>
          <p className="text-sm text-text-tertiary">Aprovados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-status-error">{batch.rejectedCount}</p>
          <p className="text-sm text-text-tertiary">Reprovados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-status-warning">{batch.pendingCount}</p>
          <p className="text-sm text-text-tertiary">Pendentes</p>
        </div>
      </div>

      {/* Creatives */}
      <div className="card-static">
        <div className="p-6 border-b border-glass-border">
          <h2 className="text-lg font-semibold text-text-primary">Criativos</h2>
        </div>

        {batch.creatives?.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">Nenhum criativo neste lote.</div>
        ) : (
          <div className="divide-y divide-glass-border">
            {batch.creatives?.map((creative: Creative) => (
              <div key={creative.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 relative border border-glass-border">
                    {creative.fileType === 'IMAGE' ? (
                      <img
                        src={getFileUrl(creative.fileUrl)}
                        alt={creative.name}
                        className="w-full h-full object-cover"
                      />
                    ) : creative.fileType === 'VIDEO' ? (
                      <video
                        src={getFileUrl(creative.fileUrl)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        TXT
                      </div>
                    )}
                    {/* Version badge */}
                    {creative.currentVersion > 1 && (
                      <span className="absolute top-1 right-1 bg-white/20 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-lg">
                        v{creative.currentVersion}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(creative.approval?.status || 'PENDING')}
                      {editingCreativeId === creative.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveCreativeName();
                              }
                              if (e.key === 'Escape') cancelEditingName();
                            }}
                            className="input py-1 px-2 text-sm flex-1 max-w-xs"
                            autoFocus
                            disabled={savingName}
                          />
                          <button
                            onClick={saveCreativeName}
                            disabled={savingName || !editingName.trim()}
                            className="btn btn-primary py-1 px-3 text-sm disabled:opacity-50"
                          >
                            {savingName ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={cancelEditingName}
                            disabled={savingName}
                            className="btn btn-secondary py-1 px-3 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-text-primary truncate">{creative.name}</span>
                          <button
                            onClick={() => startEditingName(creative)}
                            className="p-1 text-text-muted hover:text-text-primary transition-colors"
                            title="Renomear criativo"
                          >
                            <Pencil size={14} />
                          </button>
                        </>
                      )}
                      {creative.revisionCount > 0 && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <RefreshCw size={12} />
                          {creative.revisionCount} revisão(ões)
                        </span>
                      )}
                    </div>

                    {/* Feedback */}
                    {creative.approval?.feedbackText && (
                      <div className="alert alert-error mb-3">
                        <strong>Feedback:</strong> {creative.approval.feedbackText}
                      </div>
                    )}

                    {/* Adjustment Status & Revision Upload */}
                    {creative.approval?.status === 'REJECTED' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-tertiary">Status interno:</span>
                          <select
                            value={creative.adjustmentStatus?.status || 'NOT_STARTED'}
                            onChange={(e) => handleAdjustmentChange(creative.id, e.target.value)}
                            className="input py-1 px-2 text-sm w-auto"
                          >
                            <option value="NOT_STARTED">Não iniciado</option>
                            <option value="IN_PROGRESS">Em execução</option>
                            <option value="ADJUSTED">Ajustado</option>
                            <option value="RESENT">Reenviado</option>
                          </select>
                        </div>
                        <button
                          onClick={() => openRevisionModal(creative)}
                          className="btn btn-primary py-1 px-3 text-sm flex items-center gap-1"
                        >
                          <Upload size={14} />
                          Enviar Revisão
                        </button>
                      </div>
                    )}

                    {/* Per-creative timeline */}
                    <button
                      onClick={() => toggleTimeline(creative.id)}
                      className="mt-3 flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      <History size={14} />
                      {timelineCreativeId === creative.id ? 'Ocultar linha do tempo' : 'Linha do tempo'}
                    </button>

                    {timelineCreativeId === creative.id && (
                      <ol className="mt-3 border-l border-glass-border pl-4 space-y-2">
                        {timelineLoading ? (
                          <li className="text-sm text-text-muted">Carregando...</li>
                        ) : creativeTimeline.length === 0 ? (
                          <li className="text-sm text-text-muted">
                            Nenhum evento registrado para este criativo.
                          </li>
                        ) : (
                          creativeTimeline.map((log) => {
                            const details = parseDetails(log.details);
                            return (
                              <li key={log.id} className="text-sm flex items-start gap-2">
                                <span className="mt-0.5 flex-shrink-0">
                                  <ActivityIcon action={log.action} size={14} />
                                </span>
                                <span className="min-w-0">
                                  <span className="text-text-secondary">{describeActivity(log)}</span>
                                  {log.action === 'CREATIVE_REJECTED' && details.feedback && (
                                    <span className="italic text-text-tertiary">
                                      {' '}
                                      — "{details.feedback}"
                                    </span>
                                  )}
                                  <span className="text-text-muted">
                                    {' · '}
                                    {formatDateTime(log.createdAt)}
                                    {' · '}
                                    {log.user?.fullName || 'Cliente'}
                                  </span>
                                </span>
                              </li>
                            );
                          })
                        )}
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="card-static mt-8">
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <History size={18} className="text-text-secondary" />
            <h2 className="text-lg font-semibold text-text-primary">Linha do Tempo</h2>
          </div>
        </div>

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
                      {formatDateTime(log.createdAt)}
                      {' · '}
                      {log.user?.fullName || 'Cliente'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revision Upload Modal */}
      {showRevisionModal && selectedCreative && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-static p-6 w-full max-w-md mx-4 animate-slideUp">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Enviar Revisão</h2>
            <p className="text-text-secondary mb-4">
              Enviando nova versão para:{' '}
              <strong className="text-text-primary">{selectedCreative.name}</strong>
            </p>
            <p className="text-sm text-text-muted mb-4">
              Versão atual: v{selectedCreative.currentVersion} → Nova versão: v
              {selectedCreative.currentVersion + 1}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleRevisionUpload}
              accept="image/*,video/*"
              className="w-full mb-4 text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-text-primary hover:file:bg-white/20"
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
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Selecionar Arquivo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
