import axios, { AxiosInstance } from 'axios';
import { JiraConfig, JiraIssue, JiraCreateIssueResponse } from '@/entities/issue';
import { AIAnalysisResult } from '@/entities/settings';

class JiraService {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      auth: {
        username: config.email,
        password: config.apiToken,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createIssue(analysis: AIAnalysisResult): Promise<JiraCreateIssueResponse> {
    try {
      const jiraIssue: JiraIssue = {
        fields: {
          project: {
            key: this.config.projectKey,
          },
          summary: analysis.title,
          description: analysis.description,
          issuetype: {
            name: this.mapIssueTypeToJira(analysis.issueType),
          },
          priority: {
            name: this.mapPriorityToJira(analysis.priority),
          },
          labels: analysis.labels,
        },
      };

      const response = await this.client.post<JiraCreateIssueResponse>('/issue', jiraIssue);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Jira API 오류: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
      }
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    try {
      const response = await this.client.get('/project');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`프로젝트 조회 실패: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
      }
      throw error;
    }
  }

  async getIssueTypes(): Promise<any[]> {
    try {
      const response = await this.client.get('/issuetype');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`이슈 타입 조회 실패: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
      }
      throw error;
    }
  }

  async getIssue(issueKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`이슈 조회 실패: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
      }
      throw error;
    }
  }

  async updateIssue(issueKey: string, updates: Partial<JiraIssue>): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}`, updates);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`이슈 업데이트 실패: ${error.response?.data?.errorMessages?.join(', ') || error.message}`);
      }
      throw error;
    }
  }

  private mapIssueTypeToJira(issueType: AIAnalysisResult['issueType']): string {
    const mapping: Record<AIAnalysisResult['issueType'], string> = {
      'Bug': 'Bug',
      'Task': 'Task',
      'Story': 'Story',
      'Epic': 'Epic',
    };
    return mapping[issueType] || 'Task';
  }

  private mapPriorityToJira(priority: AIAnalysisResult['priority']): string {
    const mapping: Record<AIAnalysisResult['priority'], string> = {
      'Low': 'Low',
      'Medium': 'Medium',
      'High': 'High',
      'Critical': 'Highest',
    };
    return mapping[priority] || 'Medium';
  }

  // Jira 연결 테스트
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/myself');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Jira 설정 검증
  async validateConfig(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 연결 테스트
      const isConnected = await this.testConnection();
      if (!isConnected) {
        errors.push('Jira 서버에 연결할 수 없습니다. URL과 인증 정보를 확인해주세요.');
      }

      // 프로젝트 키 검증
      try {
        await this.client.get(`/project/${this.config.projectKey}`);
      } catch (error) {
        errors.push(`프로젝트 키 '${this.config.projectKey}'를 찾을 수 없습니다.`);
      }

      // 이슈 타입 조회 가능 여부 확인
      try {
        await this.getIssueTypes();
      } catch (error) {
        errors.push('이슈 타입을 조회할 수 없습니다.');
      }

    } catch (error) {
      errors.push('설정 검증 중 오류가 발생했습니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default JiraService;
