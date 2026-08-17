import { useState } from 'react';
import { User } from 'lucide-react';
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
import { Skeleton, type DropdownAction } from '../../components';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '../../context/AuthContext';
import { STATUS_OPTIONS } from './detail/detailConstants';
import { TicketDetailHeader } from './detail/TicketDetailHeader';
import { TicketQuickAttributes } from './detail/TicketQuickAttributes';
import { VerificationBanner } from './detail/VerificationBanner';
import { TicketDescription } from './detail/TicketDescription';
import { TicketAttachments } from './detail/TicketAttachments';
import { TicketStatusHistory } from './detail/TicketStatusHistory';
import { TicketComments } from './detail/TicketComments';
import { TicketStatusUpdatePanel } from './detail/TicketStatusUpdatePanel';
import { TicketVerificationActions } from './detail/TicketVerificationActions';
import { TicketDetailFooter } from './detail/TicketDetailFooter';
import { ImageLightbox } from './detail/ImageLightbox';
import type { Ticket, RestrictedStatus, CaptureMethod } from '../../api/ticket';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketDetail = ({ ticket: initialTicket, onClose }: TicketDetailProps) => {
  const { data: fresh, isPending } = useTicketQuery(initialTicket.id);
  const ticket = fresh ?? initialTicket;
  const updateMut = useUpdateTicketMutation();
  const deleteMut = useDeleteTicketMutation();
  const verifyMut = useVerifyTicketMutation();

  const { user: currentUser } = useAuth();
  const canAssign = currentUser?.role === "ADMIN" || currentUser?.role === "PC" || currentUser?.role === "MANAGER";
  // PC has full parity with ADMIN throughout this app.
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "PC";
  const isVerifier = currentUser?.role === "PC" || currentUser?.role === "ADMIN";
  const canChangeStatus =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "PC" ||
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const uploadAttachment = useUploadTicketAttachmentMutation(ticket.id);
  const deleteAttachment = useDeleteTicketAttachmentMutation(ticket.id);

  const [commentText, setCommentText] = useState('');
  const addComment = useAddTicketCommentMutation(ticket.id);

  // Restricted status-update flow (In Progress/On Hold/Completed) — see detailConstants'
  // STATUS_UPDATE_OPTIONS. Photos accumulate locally until submit; captureMethod tracks
  // whichever source (camera vs gallery) was used most recently, applied to the whole batch.
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

        <TicketDetailHeader ticket={ticket} />

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {isPending && (
            <div className="flex items-center justify-center py-2 text-text-muted">
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          )}

          <TicketQuickAttributes
            ticket={ticket}
            currentUserRole={currentUser?.role}
            canChangeStatus={canChangeStatus}
            isVerifier={isVerifier}
            canAssign={canAssign}
            statusActions={statusActions}
            assigneeActions={assigneeActions}
            isOverdue={isOverdue}
          />

          <VerificationBanner ticket={ticket} />

          <TicketDescription description={ticket.description} />

          <TicketAttachments
            attachments={ticket.attachments}
            onUpload={handleFileUpload}
            isUploading={uploadAttachment.isPending}
            uploadErrorMessage={uploadAttachment.isError
              ? (uploadAttachment.error instanceof Error ? uploadAttachment.error.message : 'Upload failed.')
              : null}
            onDelete={id => deleteAttachment.mutate(id)}
            isDeleting={deleteAttachment.isPending}
            onPreview={setPreviewImage}
          />

          <div>
            <ChecklistPanel ticketId={ticket.id} checklists={ticket.checklists} />
          </div>

          <TicketStatusHistory statusUpdates={ticket.statusUpdates} onPreview={setPreviewImage} />

          <TicketComments
            comments={ticket.comments}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onSubmit={() => addComment.mutate(commentText.trim(), { onSuccess: () => setCommentText('') })}
            isSubmitting={addComment.isPending}
            submitErrorMessage={addComment.isError
              ? (addComment.error instanceof Error ? addComment.error.message : 'Failed to post comment.')
              : null}
          />

        </div>

        {canChangeStatus && !isVerifier && ticket.status !== 'CLOSED' && (
          <TicketStatusUpdatePanel
            statusPick={statusPick}
            onPickStatus={setStatusPick}
            statusRemark={statusRemark}
            onRemarkChange={setStatusRemark}
            statusPhotos={statusPhotos}
            onRemovePhoto={i => setStatusPhotos(prev => prev.filter((_, idx) => idx !== i))}
            onAddPhotos={addStatusPhotos}
            onSubmit={handleSubmitStatusUpdate}
            isSubmitting={statusUpdateMut.isPending}
            submitErrorMessage={statusUpdateMut.isError
              ? (statusUpdateMut.error instanceof Error ? statusUpdateMut.error.message : 'Failed to update status.')
              : null}
          />
        )}

        {isVerifier && ticket.status === 'IN_REVIEW' && (
          <TicketVerificationActions
            isPending={verifyMut.isPending}
            onApprove={() => verifyMut.mutate({ id: ticket.id, payload: { action: 'APPROVE' } })}
            onReject={note => verifyMut.mutate({ id: ticket.id, payload: { action: 'REJECT', note } })}
          />
        )}

        <TicketDetailFooter
          isAdmin={isAdmin}
          onDelete={handleDelete}
          isDeleting={deleteMut.isPending}
          onClose={onClose}
        />

        <ImageLightbox src={previewImage} onClose={() => setPreviewImage(null)} />

      </SheetContent>
    </Sheet>
  );
};
