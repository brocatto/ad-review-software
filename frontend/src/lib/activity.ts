import type { ActivityLog } from '../types';

export const ACTION_LABELS: Record<string, string> = {
  BATCH_CREATED: 'Lote criado',
  CREATIVES_UPLOADED: 'Criativos enviados',
  CREATIVE_APPROVED: 'Criativo aprovado',
  CREATIVE_REJECTED: 'Criativo reprovado',
  REVISION_UPLOADED: 'Revisão enviada',
  ADJUSTMENT_STATUS_UPDATED: 'Status interno atualizado',
  CREATIVE_RENAMED: 'Criativo renomeado',
  CREATIVE_DELETED: 'Criativo excluído',
};

export const ADJUSTMENT_LABELS: Record<string, string> = {
  NOT_STARTED: 'Não iniciado',
  IN_PROGRESS: 'Em execução',
  ADJUSTED: 'Ajustado',
  RESENT: 'Reenviado',
};

export const getAdjustmentLabel = (status: string) => ADJUSTMENT_LABELS[status] || status;

// The backend stores `details` as a JSON string
export const parseDetails = (details: unknown): Record<string, any> => {
  if (!details) return {};
  if (typeof details === 'object') return details as Record<string, any>;
  try {
    return JSON.parse(String(details));
  } catch {
    return {};
  }
};

/** pt-BR one-liner for an activity log entry (used by the Histórico page and timelines). */
export const describeActivity = (log: ActivityLog): string => {
  const d = parseDetails(log.details);
  const label = ACTION_LABELS[log.action] || log.action;
  const creative = log.creative?.name || d.creativeName;

  switch (log.action) {
    case 'CREATIVES_UPLOADED':
      return d.count ? `${label} (${d.count})` : label;
    case 'CREATIVE_APPROVED':
    case 'CREATIVE_REJECTED':
      return creative ? `${label}: ${creative}` : label;
    case 'REVISION_UPLOADED': {
      const version = d.version ? ` (v${d.version})` : '';
      return creative ? `${label}: ${creative}${version}` : `${label}${version}`;
    }
    case 'ADJUSTMENT_STATUS_UPDATED': {
      const status = d.status ? getAdjustmentLabel(d.status) : '';
      const suffix = [creative, status].filter(Boolean).join(' → ');
      return suffix ? `${label}: ${suffix}` : label;
    }
    case 'CREATIVE_RENAMED':
      return d.from && d.to ? `${label}: "${d.from}" → "${d.to}"` : label;
    case 'CREATIVE_DELETED':
      return d.creativeName ? `${label}: ${d.creativeName}` : label;
    default:
      return label;
  }
};

export const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
