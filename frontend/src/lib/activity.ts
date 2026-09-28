import type { ActivityLog } from '../types';

export const getAdjustmentLabel = (status: string) => {
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

// The backend stores `details` as a JSON string
const parseDetails = (details: unknown): Record<string, any> => {
  if (!details) return {};
  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  }
  return details as Record<string, any>;
};

export const describeActivity = (log: ActivityLog): string => {
  const d = parseDetails(log.details);
  const creative = log.creative?.name || d.creativeName;

  switch (log.action) {
    case 'BATCH_CREATED':
      return 'Lote criado';
    case 'CREATIVES_UPLOADED':
      return `${d.count ?? ''} criativo(s) enviado(s)`.trim();
    case 'CREATIVE_APPROVED':
      return creative ? `Cliente aprovou "${creative}"` : 'Cliente aprovou';
    case 'CREATIVE_REJECTED':
      return `${creative ? `Cliente reprovou "${creative}"` : 'Cliente reprovou'}${
        d.feedback ? `: "${d.feedback}"` : ''
      }`;
    case 'REVISION_UPLOADED':
      return `Revisão v${d.version} enviada${creative ? ` para "${creative}"` : ''}`;
    case 'ADJUSTMENT_STATUS_UPDATED':
      return `Status do ajuste: ${getAdjustmentLabel(d.status)}${creative ? ` ("${creative}")` : ''}`;
    case 'CREATIVE_RENAMED':
      return `Criativo renomeado de "${d.from}" para "${d.to}"`;
    case 'CREATIVE_DELETED':
      return `Criativo "${d.creativeName}" excluído`;
    default:
      return log.action;
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
