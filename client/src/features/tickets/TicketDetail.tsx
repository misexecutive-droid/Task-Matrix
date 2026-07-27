import { useState, useRef } from 'react';
import {
  Clock,
  User,
  Trash2,
  UploadCloud,
  X,
  Eye,
  Calendar,
  Tag,
  UserCheck,
  AlignLeft,
  Paperclip,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  ShieldX,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Camera,
  ImageUp,
  History,
} from 'lucide-react';
import {
  useTicketQuery,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useAssignableUsersQuery,
  useVerifyTicketMutation,
  useUploadTicketAttachmentMutation,
  useDeleteTicketAttachmentMutation,
  useAddTicketCommentMutation,
  useAddTicketStatusUpdateMutation,
} from './hook';
import { ChecklistPanel } from './ChecklistPanel';
import { Button, Skeleton, Dropdown, type DropdownAction } from '../../components';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { useAuth } from "../../context/AuthContext";
import { getTicketStatusLabel } from '../../lib/ticketStatusLabel';
import type { Ticket, TicketStatus, RestrictedStatus, CaptureMethod } from '../../api/ticket';

// The 3 statuses a non-verifier (assignee/creator/manager) can move a ticket to through the
// dedicated "Update Status" panel below — deliberately narrower than STATUS_OPTIONS, which
// still powers the full dropdown verifiers (PC/Admin) see. "Completed" is the human label for
// IN_REVIEW: from this role's perspective they're done, even though it still needs PC sign-off.
const STATUS_UPDATE_OPTIONS: { value: RestrictedStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'IN_REVIEW', label: 'Completed' },
];

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const STATUS_CONFIG: Record<TicketStatus, { bg: string; text: string; border: string }> = {
  OPEN: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20' },
  IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  IN_REVIEW: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  CLOSED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  ON_HOLD: { bg: 'bg-surface-muted', text: 'text-text-muted', border: 'border-border' },
};

const PRIORITY_CONFIG: Record<Ticket['priority'], { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
  MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  CRITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
};

const UPLOADS_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

const SECTION_HEADER = 'text-xs font-display font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-2';

export const TicketDetail = ({ ticket: initialTicket, onClose }: TicketDetailProps) => {
  const { data: fresh, isPending } = useTicketQuery(initialTicket.id);
  const ticket = fresh ?? initialTicket;
  const updateMut = useUpdateTicketMutation();
  const deleteMut = useDeleteTicketMutation();
  const verifyMut = useVerifyTicketMutation();
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const { user: currentUser } = useAuth();
  const canAssign = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const isAdmin = currentUser?.role === "ADMIN";
  const isVerifier = currentUser?.role === "PC" || currentUser?.role === "ADMIN";
  const canChangeStatus =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "MANAGER" ||
    // AGENT and USER are both allowed to change status when they're the raiser or the assignee —
    // a plain USER can be assigned a ticket to fix just like an AGENT can (see
    // ticketService.visibilityFilter/assertCanMutate on the server for the matching rule).
    ((currentUser?.role === "AGENT" || currentUser?.role === "USER") &&
      (ticket.assigneeId === currentUser?.id || ticket.userId === currentUser?.id));
  // Non-verifiers hand a ticket off to review instead of closing it directly — closing for good
  // is now a PC/Admin-only action, done from the Verify button below.
  const selectableStatuses = isVerifier ? STATUS_OPTIONS : STATUS_OPTIONS.filter(s => s.value !== 'CLOSED');

  const { data: assignableUsers } = useAssignableUsersQuery(ticket.departmentId ?? undefined);

  // Attachment upload/delete — real, persisted uploads (see hook.ts), not local-only state.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const uploadAttachment = useUploadTicketAttachmentMutation(ticket.id);
  const deleteAttachment = useDeleteTicketAttachmentMutation(ticket.id);

  const [commentText, setCommentText] = useState('');
  const addComment = useAddTicketCommentMutation(ticket.id);

  // Restricted status-update flow (In Progress/On Hold/Completed) — see STATUS_UPDATE_OPTIONS
  // above. Photos accumulate locally until submit; captureMethod tracks whichever source
  // (camera vs gallery) was used most recently, applied to the whole batch on submit.
  const [statusPick, setStatusPick] = useState<RestrictedStatus | null>(null);
  const [statusRemark, setStatusRemark] = useState('');
  const [statusPhotos, setStatusPhotos] = useState<File[]>([]);
  const [statusCaptureMethod, setStatusCaptureMethod] = useState<CaptureMethod>('GALLERY');
  const statusUpdateMut = useAddTicketStatusUpdateMutation(ticket.id);

  const addStatusPhotos = (files: FileList | null, method: CaptureMethod) => {
    if (!files || !files.length) return;
    setStatusPhotos(prev => [...prev, ...Array.from(files)]);
    setStatusCaptureMethod(method);
  };

  const handleSubmitStatusUpdate = () => {
    if (!statusPick || !statusRemark.trim()) return;
    statusUpdateMut.mutate(
      {
        status: statusPick,
        remark: statusRemark.trim(),
        captureMethod: statusPhotos.length ? statusCaptureMethod : undefined,
        files: statusPhotos,
      },
      { onSuccess: () => { setStatusPick(null); setStatusRemark(''); setStatusPhotos([]); } },
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (images.length) uploadAttachment.mutate(images);
  };

  const handleDelete = () => {
    deleteMut.mutate(ticket.id, { onSuccess: onClose });
  };

  const isOverdue = ticket.isOverdue && ticket.status !== 'CLOSED';
  const statusStyle = STATUS_CONFIG[ticket.status];
  const priorityStyle = PRIORITY_CONFIG[ticket.priority];

  // Status/Assignee dropdown menus — same trigger-button + action-list shape
  // as the Header account menu, just wired to mutate the ticket instead of navigating.
  const statusActions: DropdownAction[] = selectableStatuses.map(s => ({
    label: s.label,
    onClick: () => updateMut.mutate({ id: ticket.id, payload: { status: s.value } }),
  }));

  const assigneeActions: DropdownAction[] = [
    { label: 'Unassigned', onClick: () => updateMut.mutate({ id: ticket.id, payload: { assigneeId: null } }), icon: User },
    ...(assignableUsers ?? []).map(u => ({
      label: `${u.firstName} ${u.lastName ?? ''}`.trim(),
      onClick: () => updateMut.mutate({ id: ticket.id, payload: { assigneeId: u.id } }),
      icon: User,
    })),
  ];

  return (
    <Sheet open onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="sm:max-w-xl w-full border-l border-border/60 bg-surface/95 backdrop-blur-md p-0 flex flex-col h-full">
        
        {/* Drawer Header */}
        <SheetHeader className="p-5 pb-4 border-b border-border/40 bg-surface/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">
                  TICK-{ticket.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Calendar size={12} />
                  Created {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
              <SheetTitle className="text-base font-semibold text-text leading-snug">
                {ticket.title}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {isPending && (
            <div className="flex items-center justify-center py-2 text-text-muted">
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          )}

          {/* Quick Attributes Card Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-muted/40 border border-border/50">
            
            {/* Status Control */}
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
              <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
                <Tag size={11} /> Status
              </label>
              {canChangeStatus && isVerifier ? (
                <Dropdown
                  align="start"
                  items={statusActions}
                  trigger={
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-all w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {getTicketStatusLabel(ticket.status, currentUser?.role, STATUS_OPTIONS.find(s => s.value === ticket.status)?.label ?? ticket.status)}
                      <ChevronDown size={12} />
                    </button>
                  }
                />
              ) : (
                <span className={`text-xs font-semibold px-2 py-1 rounded-md border w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {getTicketStatusLabel(ticket.status, currentUser?.role, STATUS_OPTIONS.find(s => s.value === ticket.status)?.label ?? ticket.status)}
                </span>
              )}
            </div>

            {/* Priority Badge */}
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
              <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
                <Sparkles size={11} /> Priority
              </label>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md border w-fit ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                {ticket.priority}
              </span>
            </div>

            {/* Assignee Selection */}
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
              <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
                <UserCheck size={11} /> Assignee
              </label>
              {canAssign ? (
                <Dropdown
                  align="start"
                  items={assigneeActions}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md border border-border bg-surface text-text cursor-pointer focus:outline-none w-fit"
                    >
                      {ticket.assignee ? (
                        <span className="flex items-center justify-center size-4.5 rounded-full bg-primary-600 text-white text-[9px] font-display font-semibold shrink-0">
                          {ticket.assignee.firstName.slice(0, 2).toUpperCase()}
                        </span>
                      ) : (
                        <User size={12} className="text-text-muted" />
                      )}
                      {ticket.assignee ? ticket.assignee.firstName : 'Unassigned'}
                      <ChevronDown size={12} />
                    </button>
                  }
                />
              ) : (
                <span className="text-xs text-text-secondary flex items-center gap-1.5 py-0.5">
                  {ticket.assignee ? (
                    <span className="flex items-center justify-center size-4.5 rounded-full bg-primary-600 text-white text-[9px] font-display font-semibold shrink-0">
                      {ticket.assignee.firstName.slice(0, 2).toUpperCase()}
                    </span>
                  ) : (
                    <User size={12} />
                  )}
                  {ticket.assignee ? ticket.assignee.firstName : 'Unassigned'}
                </span>
              )}
            </div>

            {/* SLA / Due Date Info */}
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface/60 border border-border/40">
              <label className="text-[10px] uppercase text-text-muted font-semibold flex items-center gap-1">
                <Clock size={11} /> SLA Deadline
              </label>
              {ticket.tatDueAt ? (
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className={`text-xs font-medium ${isOverdue ? 'text-rose-500 font-bold' : 'text-text-secondary'}`}>
                    {new Date(ticket.tatDueAt).toLocaleDateString()}
                  </span>
                  {isOverdue && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                      OVERDUE
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-text-muted py-1">No SLA set</span>
              )}
            </div>

          </div>

          {/* Verification outcome banner — shows the PC's note from the last approve/reject */}
          {ticket.verificationNote && (
            <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
              ticket.status === 'CLOSED'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              {ticket.status === 'CLOSED' ? <ShieldCheck size={14} className="shrink-0 mt-0.5" /> : <ShieldX size={14} className="shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">
                  {ticket.status === 'CLOSED' && ticket.verifiedBy ? 'Verified' : 'Sent back for changes'}
                </p>
                <p className="mt-0.5 text-text-secondary">{ticket.verificationNote}</p>
              </div>
            </div>
          )}

          {/* Ticket Description */}
          {ticket.description && (
            <div>
              <h3 className={SECTION_HEADER}>
                <AlignLeft size={13} /> Description
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap p-3 rounded-xl bg-surface-muted/30 border border-border/40">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Image Attachments Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className={SECTION_HEADER}>
                <Paperclip size={13} /> Attachments & Screenshots
              </h3>
              <span className="text-[11px] text-text-muted">{ticket.attachments.length} files</span>
            </div>

            {/* Dropzone Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border border-dashed border-border/80 hover:border-primary-500/50 bg-surface/40 hover:bg-primary-500/5 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { handleFileUpload(e.target.files); e.target.value = ''; }}
              />
              <div className="p-2 rounded-full bg-surface-muted group-hover:bg-primary-500/10 text-text-muted group-hover:text-primary-500 transition-colors mb-1.5">
                <UploadCloud size={18} />
              </div>
              <p className="text-xs font-medium text-text group-hover:text-primary-500 transition-colors">
                {uploadAttachment.isPending ? 'Uploading...' : 'Click or drop pictures here'}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">PNG, JPG, WEBP up to 10MB</p>
            </div>

            {uploadAttachment.isError && (
              <p className="text-xs text-danger">
                {uploadAttachment.error instanceof Error ? uploadAttachment.error.message : 'Upload failed.'}
              </p>
            )}

            {/* Attachments Preview Grid */}
            {ticket.attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mt-2">
                {ticket.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="group relative rounded-lg border border-border/60 bg-surface overflow-hidden aspect-square flex items-center justify-center shadow-2xs"
                  >
                    <img
                      src={`${UPLOADS_BASE}${file.url}`}
                      alt={file.originalFilename ?? 'attachment'}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Image Overlay Controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(`${UPLOADS_BASE}${file.url}`)}
                        className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
                        title="View image"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAttachment.mutate(file.id)}
                        disabled={deleteAttachment.isPending}
                        className="p-1.5 rounded-full bg-rose-500/80 text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtask Checklist Panel */}
          <div>
            <ChecklistPanel ticketId={ticket.id} checklists={ticket.checklists} />
          </div>

          {/* Status History — every restricted status change, with the remark that explained it
              and any evidence photos attached at the time. This is what makes the mandatory
              remark actually visible to the PC/Admin reviewing the ticket, instead of it
              vanishing once the status moves on. */}
          {ticket.statusUpdates.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className={SECTION_HEADER}>
                <History size={13} /> Status History
              </h3>
              <div className="flex flex-col gap-3">
                {ticket.statusUpdates.map(su => (
                  <div key={su.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/60 bg-surface">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-display font-semibold text-text">
                        {su.changedBy?.firstName ?? 'Unknown'}
                      </span>
                      <span className="text-[10px] text-text-muted font-display">
                        moved to <strong>{STATUS_UPDATE_OPTIONS.find(o => o.value === su.toStatus)?.label ?? su.toStatus}</strong>
                      </span>
                      <span className="text-[10px] text-text-muted font-display ml-auto">
                        {new Date(su.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary font-display whitespace-pre-wrap">{su.remark}</p>
                    {su.photos.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 w-fit text-[9px] font-display font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-300 border border-primary-500/20">
                          <Camera size={10} /> Evidence
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {su.photos.map(photo => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setPreviewImage(`${UPLOADS_BASE}${photo.url}`)}
                              className="relative size-14 rounded-md border-2 border-primary-500/40 overflow-hidden cursor-pointer ring-1 ring-primary-500/10"
                              title={photo.captureMethod === 'LIVE' ? 'Captured live' : 'From gallery'}
                            >
                              <img src={`${UPLOADS_BASE}${photo.url}`} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments — one shared thread, visible to anyone who can already view this ticket */}
          <div className="flex flex-col gap-3">
            <h3 className={SECTION_HEADER}>
              <MessageSquare size={13} /> Comments
              <span className="text-text-muted normal-case font-normal">({ticket.comments.length})</span>
            </h3>

            <div className="flex flex-col gap-3">
              {ticket.comments.length === 0 && (
                <p className="text-xs text-text-muted font-display">No comments yet.</p>
              )}
              {ticket.comments.map(c => (
                <div key={c.id} className="flex flex-col gap-1 p-3 rounded-lg border border-border/60 bg-surface">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-semibold text-text">
                      {c.author?.firstName ?? 'Unknown'}
                    </span>
                    <span className="text-[10px] text-text-muted font-display">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary font-display whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                className="w-full px-3 py-2 text-xs font-display bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50"
              />
              {addComment.isError && (
                <p className="text-xs text-danger">
                  {addComment.error instanceof Error ? addComment.error.message : 'Failed to post comment.'}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="self-end font-display text-xs gap-1.5"
                disabled={!commentText.trim() || addComment.isPending}
                onClick={() => addComment.mutate(commentText.trim(), { onSuccess: () => setCommentText('') })}
              >
                {addComment.isPending && <Loader2 size={12} className="animate-spin" />}
                Post comment
              </Button>
            </div>
          </div>

        </div>

        {/* Update Status — the restricted flow for whoever is actually doing the work (assignee,
            creator, or a manager): only In Progress/On Hold/Completed, always with a remark, plus
            optional live/gallery evidence photos. Verifiers (PC/Admin) keep the full dropdown up
            in the Quick Attributes card instead, since they need the wider status range. */}
        {canChangeStatus && !isVerifier && ticket.status !== 'CLOSED' && (
          <div className="px-4 pt-3 pb-3 border-t border-border/40 bg-surface/50 flex flex-col gap-2.5">
            <h3 className={SECTION_HEADER}>
              <RefreshCcw size={13} /> Update Status
            </h3>

            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_UPDATE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusPick(opt.value)}
                  className={`text-xs font-display font-medium px-2 py-2 rounded-md border transition-all text-center ${
                    statusPick === opt.value
                      ? 'border-primary-500/60 bg-primary-500/10 text-primary-500 ring-2 ring-primary-500/20'
                      : 'border-border/60 bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              value={statusRemark}
              onChange={e => setStatusRemark(e.target.value)}
              placeholder="Remark — what changed? (required)"
              rows={2}
              className="w-full px-3 py-2 text-xs font-display bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50"
            />

            {statusPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {statusPhotos.map((file, i) => (
                  <div key={i} className="relative size-14 rounded-md border border-border overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStatusPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 size-4 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-danger cursor-pointer"
                      aria-label="Remove photo"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {statusUpdateMut.isError && (
              <p className="text-xs text-danger">
                {statusUpdateMut.error instanceof Error ? statusUpdateMut.error.message : 'Failed to update status.'}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs font-display font-medium px-2.5 py-1.5 rounded-md border border-primary-500/50 text-primary-600 hover:bg-primary-500/10 cursor-pointer transition-colors">
                <Camera size={12} />
                Take photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={e => { addStatusPhotos(e.target.files, 'LIVE'); e.target.value = ''; }}
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs font-display font-medium px-2.5 py-1.5 rounded-md border border-border text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors">
                <ImageUp size={12} />
                Gallery
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => { addStatusPhotos(e.target.files, 'GALLERY'); e.target.value = ''; }}
                />
              </label>

              <Button
                size="sm"
                variant="primary"
                className="ml-auto font-display text-xs gap-1.5"
                disabled={!statusPick || !statusRemark.trim()}
                isLoading={statusUpdateMut.isPending}
                onClick={handleSubmitStatusUpdate}
              >
                Submit update
              </Button>
            </div>
          </div>
        )}

        {/* PC/Admin verification actions — only shown while the ticket is awaiting review */}
        {isVerifier && ticket.status === 'IN_REVIEW' && (
          <div className="px-4 pt-3 pb-1 border-t border-border/40 bg-surface/50 flex flex-col gap-2">
            {!showRejectBox ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-display text-xs"
                  isLoading={verifyMut.isPending}
                  onClick={() => verifyMut.mutate({ id: ticket.id, payload: { action: 'APPROVE' } })}
                >
                  <ShieldCheck size={13} />
                  Verify & Close
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-display text-xs"
                  disabled={verifyMut.isPending}
                  onClick={() => setShowRejectBox(true)}
                >
                  <ShieldX size={13} />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="What needs to be fixed before this can be approved?"
                  rows={2}
                  className="w-full px-3 py-2 text-xs font-display bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-rose-600 hover:bg-rose-700 font-display text-xs"
                    disabled={verifyMut.isPending || !rejectNote.trim()}
                    onClick={() => verifyMut.mutate({ id: ticket.id, payload: { action: 'REJECT', note: rejectNote.trim() } })}
                  >
                    {verifyMut.isPending ? <Loader2 size={13} className="animate-spin" /> : 'Send back'}
                  </Button>
                  <Button size="sm" variant="outline" className="font-display text-xs" disabled={verifyMut.isPending} onClick={() => { setShowRejectBox(false); setRejectNote(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer Actions */}
        <SheetFooter className="p-4 border-t border-border/40 bg-surface/50 flex items-center justify-between gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMut.isPending}
              className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1.5 font-display text-xs"
            >
              <Trash2 size={13} />
              Delete Ticket
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} className="font-display text-xs ml-auto">
            Close
          </Button>
        </SheetFooter>

        {/* Lightbox Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                <X size={16} />
              </button>
              <img src={previewImage} alt="Enlarged preview" className="object-contain max-h-[80vh] w-auto" />
            </div>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
};