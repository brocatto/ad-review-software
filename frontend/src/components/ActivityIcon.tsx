import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  FolderPlus,
  History,
  Pencil,
  Trash2,
} from 'lucide-react';

export function ActivityIcon({ action, size = 16 }: { action: string; size?: number }) {
  switch (action) {
    case 'CREATIVE_APPROVED':
      return <CheckCircle size={size} className="text-status-success" />;
    case 'CREATIVE_REJECTED':
      return <XCircle size={size} className="text-status-error" />;
    case 'REVISION_UPLOADED':
      return <RefreshCw size={size} className="text-text-secondary" />;
    case 'CREATIVES_UPLOADED':
      return <Upload size={size} className="text-text-secondary" />;
    case 'BATCH_CREATED':
      return <FolderPlus size={size} className="text-text-secondary" />;
    case 'CREATIVE_RENAMED':
      return <Pencil size={size} className="text-text-secondary" />;
    case 'CREATIVE_DELETED':
      return <Trash2 size={size} className="text-text-tertiary" />;
    default:
      return <History size={size} className="text-text-tertiary" />;
  }
}
