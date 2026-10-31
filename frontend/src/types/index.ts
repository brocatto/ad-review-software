export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER';
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  clientId: string;
  createdByUserId: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  accessToken: string;
  totalCreatives: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  creatives?: Creative[];
  /** Public endpoint only: total creatives in the batch (creatives[] holds just the pending ones) */
  allCreativesCount?: number;
  _count?: {
    creatives: number;
  };
}

export interface Creative {
  id: string;
  batchId: string;
  name: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO' | 'TEXT';
  order: number;
  currentVersion: number;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
  approval?: Approval;
  adjustmentStatus?: InternalAdjustmentStatus;
}

export interface Approval {
  id: string;
  creativeId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedbackText?: string;
  feedbackProvidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalAdjustmentStatus {
  id: string;
  creativeId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ADJUSTED' | 'RESENT';
  notes?: string;
  updatedByUserId?: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  batchId?: string;
  creativeId?: string;
  userId?: string;
  action: string;
  details?: any;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
  };
  creative?: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    name: string;
    client: { id: string; name: string };
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
