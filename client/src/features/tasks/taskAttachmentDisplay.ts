import { FileText, FileSpreadsheet, FileVideo, File as FileIcon, type LucideIcon } from 'lucide-react';
import type { TaskAttachment } from '../../api/task';

// Accepted by both the staged picker (Create Task) and the live section (Task Detail) —
// kept in sync with the server's TASK_ATTACHMENT_MIME_TYPES allowlist in config/upload.ts.
export const ACCEPTED_ATTACHMENT_TYPES = '.pdf,.csv,image/*,video/*';

export const isImageAttachment = (mimeType: string) => mimeType.startsWith('image/');

/** Icon for non-image attachments; images render an actual thumbnail instead, so this is
 *  never called for those. */
export const attachmentIconFor = (mimeType: string): LucideIcon => {
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') return FileSpreadsheet;
  if (mimeType.startsWith('video/')) return FileVideo;
  return FileIcon;
};

export const attachmentTypeLabel = (mimeType: string): string => {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') return 'CSV';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('image/')) return 'Image';
  return 'File';
};

/** First image attachment on a task, used as its Kanban/list cover thumbnail —
 *  or undefined if the task has no photo attached yet. */
export const coverPhotoFor = (attachments?: TaskAttachment[]): TaskAttachment | undefined =>
  attachments?.find(a => isImageAttachment(a.mimeType));

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
