import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import SettingsService from '@/services/settingsService';
import { logger } from '@/utils/logger';

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

interface IssueStore {
  issues: Issue[];
  error: string | null;
  isLoading: boolean;
  createIssue: (naturalLanguageText: string) => Promise<void>;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  clearError: () => void;
}

export const useIssueStore = create<IssueStore>((set) => ({
  issues: [],
  error: null,
  isLoading: false,

  createIssue: async (naturalLanguageText: string) => {
    set({ isLoading: true, error: null });
    
    logger.debug('이슈 생성 프로세스 시작', { naturalLanguageText }, 'IssueStore');
    
    try {
      // 설정 로드
      const settingsService = new SettingsService();
      const settings = settingsService.getSettings();
      
      if (!settings) {
        logger.warn('설정이 없음', null, 'IssueStore');
        throw new Error('설정이 필요합니다. 설정 페이지에서 Jira와 AI 서비스 정보를 입력해주세요.');
      }

      logger.debug('설정 로드 완료', { 
        hasJiraConfig: !!settings.jira.baseUrl,
        hasAIConfig: !!settings.ai.apiKey 
      }, 'IssueStore');

      // Tauri 백엔드를 통한 AI 분석
      logger.debug('AI 분석 요청 시작', { 
        text: naturalLanguageText,
        model: settings.ai.model 
      }, 'IssueStore');
      
      const analysis = await invoke('analyze_with_ai', {
        text: naturalLanguageText,
        config: {
          apiKey: settings.ai.apiKey,
          model: settings.ai.model,
          temperature: settings.ai.temperature,
        }
      }) as {
        title: string;
        description: string;
        issue_type: string;
        priority: string;
        labels: string[];
      };

      logger.debug('AI 분석 완료', analysis, 'IssueStore');

      // Tauri 백엔드를 통한 Jira 이슈 생성
      logger.debug('Jira 이슈 생성 요청 시작', {
        projectKey: settings.jira.projectKey,
        issueType: analysis.issue_type
      }, 'IssueStore');
      
      const jiraIssue = await invoke('create_jira_issue', {
        analysis: {
          title: analysis.title,
          description: analysis.description,
          issue_type: analysis.issue_type,
          priority: analysis.priority,
          labels: analysis.labels,
        },
        config: {
          base_url: settings.jira.baseUrl,
          email: settings.jira.email,
          api_token: settings.jira.apiToken,
          project_key: settings.jira.projectKey,
        }
      }) as {
        key: string;
        summary: string;
        description: string;
        issue_type: string;
        priority: string;
        status: string;
      };

      logger.info('Jira 이슈 생성 완료', { jiraKey: jiraIssue.key }, 'IssueStore');

      const newIssue: Issue = {
        id: Date.now().toString(),
        title: jiraIssue.summary,
        description: jiraIssue.description,
        type: jiraIssue.issue_type as Issue['type'],
        priority: jiraIssue.priority as Issue['priority'],
        status: jiraIssue.status as Issue['status'],
        createdAt: new Date(),
        jiraKey: jiraIssue.key,
      };

      set((state) => ({
        issues: [newIssue, ...state.issues],
        isLoading: false,
      }));

      logger.info('이슈 생성 프로세스 완료', { 
        issueId: newIssue.id, 
        jiraKey: newIssue.jiraKey 
      }, 'IssueStore');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이슈 생성에 실패했습니다.';
      logger.error('이슈 생성 프로세스 실패', error, 'IssueStore');
      
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  updateIssue: (id: string, updates: Partial<Issue>) => {
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id ? { ...issue, ...updates } : issue
      ),
    }));
  },

  deleteIssue: (id: string) => {
    set((state) => ({
      issues: state.issues.filter((issue) => issue.id !== id),
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));

