import { apiFetch } from './http';
import type { ApiResponse, ChecklistRecurrence, ChecklistItemType, ChecklistConditionalAction } from './checklistDefinitions';
import type { CaptureMethod } from './ticket';

export type ChecklistInstanceStatus = 'OPEN' | 'COMPLETED';
export type ChecklistVerificationStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type ChecklistInstanceImage = {
  id:                      string;
  url:                     string;
  originalFilename:        string | null;
  mimeType:                string;
  sizeBytes:               number;
  captureMethod:           CaptureMethod;
  checklistInstanceItemId: string;
  uploadedBy:              string;
  createdAt:               string;
};

export type ChecklistInstanceItemSubmissionImage = {
  id:             string;
  url:            string;
  originalFilename: string | null;
  mimeType:       string;
  sizeBytes:      number;
  captureMethod:  CaptureMethod;
  submissionId:   string;
  uploadedBy:     string;
  createdAt:      string;
};

export type ChecklistInstanceItemSubmissionAccessory = { name: string; checked: boolean };

// userId is always populated server-side (see checklistInstance.service.ts's populateInstance) so
// the UI can show the auditor's name and store without a separate lookup.
export type ChecklistInstanceItemSubmissionUser = {
  id:        string;
  firstName: string;
  lastName:  string | null;
  storeId:   string | null;
};

export type ChecklistInstanceItemSubmission = {
  id:          string;
  itemId:      string;
  userId:      ChecklistInstanceItemSubmissionUser;
  accessories: ChecklistInstanceItemSubmissionAccessory[];
  remarks:     string | null;
  isDone:      boolean;
  completedAt: string | null;
  images:      ChecklistInstanceItemSubmissionImage[];
};

export type ChecklistInstanceItem = {
  id:                 string;
  label:              string;
  order:              number;
  isDone:             boolean;
  completedAt:        string | null;
  completedBy:        string | null;
  requiredImageCount: number;
  maxImageCount:      number | null;
  requiresLivePhoto:  boolean;
  itemType:           ChecklistItemType;
  accessories:        string[];
  numberEntryUnit:    string | null;
  numberEntryMin:     number | null;
  numberEntryMax:     number | null;
  ratingScale:        number | null;
  numericValue:       number | null;
  options:            string[];
  booleanAnswer:      'YES' | 'NO' | null;
  textValue:          string | null;
  dateValue:          string | null;
  gpsTargetLat:       number | null;
  gpsTargetLng:       number | null;
  gpsRadiusMeters:    number | null;
  gpsLat:             number | null;
  gpsLng:             number | null;
  gpsAccuracy:        number | null;
  gpsCapturedAt:      string | null;
  signatureLabels:    string[];
  signatureValue:     string | null;
  secondSignatureValue: string | null;
  qrExpectedValue:    string | null;
  cashExpectedAmount: number | null;
  conditionalTrigger: 'YES' | 'NO' | null;
  conditionalActions: ChecklistConditionalAction[];
  conditionalReasonValue: string | null;
  issueId:            string | null;
  instanceId:         string;
  images:             ChecklistInstanceImage[];
  submissions:        ChecklistInstanceItemSubmission[];
};

export type ChecklistInstance = {
  id:               string;
  definitionId:     string;
  title:            string;
  recurrence:       ChecklistRecurrence;
  storeId:          string;
  opensTime:        string | null;
  cutoffTime:       string | null;
  assigneeIds:      string[];
  periodKey:        string;
  periodStart:      string;
  periodEnd:        string;
  generatedAt:      string;
  verificationStatus: ChecklistVerificationStatus;
  verifiedBy:         string | null;
  verifiedAt:         string | null;
  verificationNote:   string | null;
  items:            ChecklistInstanceItem[];
};

export type VerifyChecklistInstancePayload = { action: 'APPROVE' | 'REJECT'; note?: string };

export type ComplianceReportGroupBy = 'hour' | 'day' | 'week' | 'month' | 'year';

// Same shape as task.ts's ComplianceReportRow — the recurring-checklist sibling report, bucketed
// by each instance's periodStart rather than item createdAt (see checklistInstance.service.ts).
export type ComplianceReportRow = {
  bucket: string;
  totalItems: number;
  doneItems: number;
  completionRate: number | null;
  itemsRequiringPhotos: number;
  qualityRate: number | null;
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const checklistInstanceApi = {
  getMine: (status?: ChecklistInstanceStatus) =>
    apiFetch<ApiResponse<ChecklistInstance[]>>(`/checklist-instances/mine${buildQuery({ status })}`),

  getOne: (id: string) =>
    apiFetch<ApiResponse<ChecklistInstance>>(`/checklist-instances/${id}`),

  getForDefinition: (definitionId: string) =>
    apiFetch<ApiResponse<ChecklistInstance[]>>(`/checklist-instances${buildQuery({ definitionId })}`),

  getPendingVerification: () =>
    apiFetch<ApiResponse<ChecklistInstance[]>>('/checklist-instances/pending-verification'),

  setItemDone: (itemId: string, isDone: boolean, values?: {
    numericValue?: number;
    booleanAnswer?: 'YES' | 'NO';
    textValue?: string;
    dateValue?: string;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
    signatureValue?: string;
    secondSignatureValue?: string;
    conditionalReasonValue?: string;
  }) =>
    apiFetch<ApiResponse<ChecklistInstanceItem>>(`/checklist-instance-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isDone, ...values }),
    }),

  verify: (id: string, payload: VerifyChecklistInstancePayload) =>
    apiFetch<ApiResponse<ChecklistInstance>>(`/checklist-instances/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  uploadImages: (itemId: string, files: File[], captureMethod: CaptureMethod) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('captureMethod', captureMethod);
    return apiFetch<ApiResponse<ChecklistInstanceImage[]>>(`/checklist-instance-items/${itemId}/images`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteImage: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-instance-images/${id}`, { method: 'DELETE' }),

  getComplianceReport: (groupBy: ComplianceReportGroupBy = 'month', storeId?: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ groupBy });
    if (storeId) params.set('storeId', storeId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiFetch<ApiResponse<ComplianceReportRow[]>>(`/checklist-instances/reports/compliance?${params.toString()}`);
  },
};
