// Issue entity types
export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'Bug' | 'Task' | 'Story' | 'Epic';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'To Do' | 'In Progress' | 'Done';
  assignee?: string;
  reporter?: string;
  createdAt: Date;
  jiraKey?: string; // Jira에서 생성된 이슈 키
}

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
