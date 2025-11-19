export interface BatchNotificationData {
  batchId: string;
  batchName: string;
  clientName: string;
  totalCreatives: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

export interface BatchSentNotificationData {
  batchId: string;
  batchName: string;
  clientName: string;
  creativesCount: number;
}
