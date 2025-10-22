// Settings entity types
export interface AIServiceConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface AppSettings {
  jira: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  };
  ai: AIServiceConfig;
  theme: 'light' | 'dark';
  language: 'ko' | 'en';
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  issueType: 'Bug' | 'Task' | 'Story' | 'Epic';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  labels: string[];
  assignee?: string;
}
