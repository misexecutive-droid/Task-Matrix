import { apiFetch } from "./http";

export type Settings = {
    defaultTatHours : number;
    maxUploadSizeMb : number;
    maxUploadFiles : number;
    allowedImageTypes : string[];
}

export type ApiResponse<T> = { success : boolean; data : T};
export type UpdateSettingsPayload = Partial<Settings>;

export const settingApi = {
    get : () => apiFetch<ApiResponse <Settings>>('/settings'),

    update : (payload : UpdateSettingsPayload) => 
        apiFetch<ApiResponse <Settings>>('/settings', {method : "PATCH", body: JSON.stringify(payload)})
}