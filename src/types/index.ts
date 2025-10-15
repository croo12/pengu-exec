// Jira 관련 타입 정의
export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIssue {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      accountId: string;
    };
    labels?: string[];
  };
}

export interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

// AI 서비스 관련 타입 정의
export interface AIAnalysisResult {
  title: string;
  description: string;
  issueType: 'Bug' | 'Task' | 'Story' | 'Epic';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  labels: string[];
  assignee?: string;
}

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

// 앱 설정 타입 정의
export interface AppSettings {
  jira: JiraConfig;
  ai: AIServiceConfig;
  theme: 'light' | 'dark';
  language: 'ko' | 'en';
}

// 이벤트 타입 정의
export interface IssueCreatedEvent {
  type: 'issue_created';
  issueId: string;
  jiraKey?: string;
  timestamp: Date;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  code?: string;
  timestamp: Date;
}
