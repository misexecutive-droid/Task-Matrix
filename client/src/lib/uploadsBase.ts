// Base URL to prefix onto any `/uploads/...` relative path returned by the API (task images,
// ticket attachments, task attachments, etc.) so the browser requests it from the right host.
export const UPLOADS_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5050';
