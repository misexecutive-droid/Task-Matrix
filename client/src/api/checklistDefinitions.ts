import { apiFetch } from './http';

export type ChecklistRecurrence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';

export type ChecklistItemType =
  | 'STANDARD' | 'AUDIT' | 'NUMBER_ENTRY' | 'RATING'
  | 'YES_NO' | 'PASS_FAIL' | 'MULTIPLE_CHOICE' | 'DROPDOWN' | 'TEXT_BOX' | 'DATE_TIME'
  | 'GPS' | 'SIGNATURE' | 'DUAL_SIGNATURE' | 'QR_SCAN' | 'CASH_TALLY' | 'VIDEO_UPLOAD';

export type ChecklistAssigneeRole =
  | 'STORE_MANAGER' | 'FLOOR_MANAGER' | 'CASHIER' | 'SECURITY' | 'HOUSEKEEPING' | 'OPERATIONS';

export type ChecklistIcon =
  | 'store' | 'clock' | 'star' | 'check' | 'shield' | 'alert-triangle' | 'hash' | 'shield-check' | 'calendar';

export type ChecklistProofType = 'PHOTO' | 'GPS_MATCH' | 'TIMESTAMP' | 'SIGNATURE' | 'QR_SCAN';

export type ChecklistConditionalAction = 'REQUIRE_PHOTO' | 'ASK_REASON' | 'CREATE_ISSUE' | 'NOTIFY_AREA_MANAGER';

export type ChecklistDefinitionItem = {
  id:                  string;
  label:               string;
  order:               number;
  requiredImageCount:  number;
  maxImageCount:       number | null;
  requiresLivePhoto:   boolean;
  itemType:            ChecklistItemType;
  auditUserIds:        string[];
  accessories:         string[];
  numberEntryUnit:     string | null;
  numberEntryMin:      number | null;
  numberEntryMax:      number | null;
  ratingScale:         number | null;
  options:             string[];
  gpsTargetLat:        number | null;
  gpsTargetLng:        number | null;
  gpsRadiusMeters:     number | null;
  signatureLabels:     string[];
  qrExpectedValue:     string | null;
  cashExpectedAmount:  number | null;
  conditionalTrigger:  'YES' | 'NO' | null;
  conditionalActions:  ChecklistConditionalAction[];
  definitionId:        string;
};

export type ChecklistDefinition = {
  id:            string;
  name:          string;
  description:   string | null;
  storeIds:      string[];
  recurrence:    ChecklistRecurrence;
  startDate:     string;
  opensTime:     string | null;
  cutoffTime:    string | null;
  isActive:      boolean;
  assigneeIds:   string[];
  assigneeRoles: ChecklistAssigneeRole[];
  proofRequired: ChecklistProofType[];
  icon:          ChecklistIcon;
  version:       number;
  createdBy:     string;
  items:         ChecklistDefinitionItem[];
  // Computed server-side across every generated instance of this checklist — null until at
  // least one instance/qualifying item exists yet, rather than a misleading 0%.
  completionRate: number | null;
  qualityRate:    number | null;
};

export type ApiResponse<T> = { success: boolean; data: T };

export type CreateChecklistDefinitionItemPayload = {
  label:                string;
  order?:               number;
  requiredImageCount?:  number;
  maxImageCount?:       number;
  requiresLivePhoto?:   boolean;
  itemType?:            ChecklistItemType;
  auditUserIds?:        string[];
  accessories?:         string[];
  numberEntryUnit?:     string;
  numberEntryMin?:      number;
  numberEntryMax?:      number;
  ratingScale?:         number;
  options?:             string[];
  gpsTargetLat?:        number;
  gpsTargetLng?:        number;
  gpsRadiusMeters?:     number;
  signatureLabels?:     string[];
  qrExpectedValue?:     string;
  cashExpectedAmount?:  number;
  conditionalTrigger?:  'YES' | 'NO';
  conditionalActions?:  ChecklistConditionalAction[];
};

export type CreateChecklistDefinitionPayload = {
  name:           string;
  description?:   string;
  storeIds:       string[];
  recurrence:     ChecklistRecurrence;
  startDate:      string;
  opensTime?:     string;
  cutoffTime?:    string;
  assigneeIds:    string[];
  assigneeRoles?: ChecklistAssigneeRole[];
  proofRequired?: ChecklistProofType[];
  icon?:          ChecklistIcon;
  items:          CreateChecklistDefinitionItemPayload[];
};

// Builder's edit mode replaces the whole definition (name/schedule/items) in one PUT — same shape
// as create.
export type UpdateChecklistDefinitionPayload = CreateChecklistDefinitionPayload;

export type ListChecklistDefinitionsParams = {
  storeId?:    string;
  recurrence?: ChecklistRecurrence;
  isActive?:   boolean;
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const checklistDefinitionApi = {
  getAll: (params: ListChecklistDefinitionsParams = {}) =>
    apiFetch<ApiResponse<ChecklistDefinition[]>>(`/checklist-definitions${buildQuery({
      storeId:    params.storeId,
      recurrence: params.recurrence,
      isActive:   params.isActive === undefined ? undefined : String(params.isActive),
    })}`),

  getOne: (id: string) =>
    apiFetch<ApiResponse<ChecklistDefinition>>(`/checklist-definitions/${id}`),

  create: (payload: CreateChecklistDefinitionPayload) =>
    apiFetch<ApiResponse<ChecklistDefinition>>('/checklist-definitions', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: UpdateChecklistDefinitionPayload) =>
    apiFetch<ApiResponse<ChecklistDefinition>>(`/checklist-definitions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  setActive: (id: string, isActive: boolean) =>
    apiFetch<ApiResponse<ChecklistDefinition>>(`/checklist-definitions/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  remove: (id: string) =>
    apiFetch<ApiResponse<{ deleted: boolean }>>(`/checklist-definitions/${id}`, { method: 'DELETE' }),
};
