// Shared configuration constants
export const APP_CONFIG = {
  name: 'PenguExec',
  version: '0.1.0',
  description: 'AI-Powered Jira Assistant using Tauri',
} as const;

export const API_ENDPOINTS = {
  jira: '/rest/api/3',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
} as const;
