
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Project = {
    id : string;
    name : string;
    description : string | null;
    ownerId : string;
    memberIds : string[];
    createAt : string
}

export type CreateProjectPayload = { name : string ; description?: string, memberIds?: string[]};
export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export type ApiResponse<T> = { success: boolean; data : T};

const authHeaders = ( token : string) => ({
    "Content-Type" : "application/json",
    Authorization : `Beare ${token}`
});

const request = async <T> (path : string , options : RequestInit) : Promise<T> => {
    const res = await fetch(`${BASE}${path}` , options);
    const data = await res.json();

    if(!res.ok) throw new Error(data?.message ?? "Request failed");
    return data as T;

};

export const projectApi = {
    getAll : (token : string) => 
        request<ApiResponse <Project[]>>("/projects" , {headers : authHeaders(token)}),

    getONe : (id : string  , token : string) => 
        request<ApiResponse<Project>>(`/projects/${id}`, { headers : authHeaders(token)}),

    create:(payload : CreateProjectPayload, token : string) => 
        request<ApiResponse<Project>>(`/projects/${id}`, { 

            method : "POST",
            headers : authHeaders(token),
            body : JSON.stringify(payload)
         }),

    update : (id : string , payload : UpdateProjectPayload , token : string) => 
        request<ApiResponse<{deleted : boolean}>>(`/projects/${id}`,{
            method : "DELETE",
            headers : authHeaders(token),
        }),
}