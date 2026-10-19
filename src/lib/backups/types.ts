/**
 * Estados y metadatos de respaldos administrados vía API.
 */
export type BackupType = 'database' | 'uploads' | 'full';
export type BackupStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'expired';

export interface BackupJob {
  id: string;
  type: BackupType;
  status: BackupStatus;
  sizeBytes: string | null;
  checksum: string | null;
  expiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
}
