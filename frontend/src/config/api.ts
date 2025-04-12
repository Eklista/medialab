// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
export const API_TIMEOUT = 5000; // 5 seconds timeout for API requests