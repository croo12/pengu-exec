import { Task, TaskContext, TaskResult } from '@/entities/task';
import { AIAnalysisResult } from '@/entities/settings';
import { JiraConfig } from '@/entities/issue';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '@/shared/lib/logger';

export interface JiraCreateInput {
  analysis: AIAnalysisResult;
  config: JiraConfig;
}

export interface JiraCreateOutput {
  jiraKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority: string;
  status: string;
  url?: string;
}

export class JiraCreateTask implements Task<JiraCreateInput, JiraCreateOutput> {
  readonly id = 'jira_create';
  readonly name = 'Jira 이슈 생성';
  readonly description = 'AI 분석 결과를 바탕으로 Jira 이슈를 생성';

  async execute(input: JiraCreateInput, _context: TaskContext): Promise<TaskResult<JiraCreateOutput>> {
    try {
      logger.info('Jira 이슈 생성 태스크 시작', { 
        analysis: input.analysis,
        projectKey: input.config.projectKey 
      }, 'JiraCreateTask');

      // Tauri 백엔드를 통한 Jira 이슈 생성
      const jiraIssue = await invoke('create_jira_issue', {
        analysis: {
          title: input.analysis.title,
          description: input.analysis.description,
          issue_type: input.analysis.issueType,
          priority: input.analysis.priority,
          labels: input.analysis.labels,
        },
        config: {
          base_url: input.config.baseUrl,
          email: input.config.email,
          api_token: input.config.apiToken,
          project_key: input.config.projectKey,
        },
      }) as {
        key: string;
        summary: string;
        description: string;
        issue_type: string;
        priority: string;
        status: string;
      };

      const result: JiraCreateOutput = {
        jiraKey: jiraIssue.key,
        summary: jiraIssue.summary,
        description: jiraIssue.description,
        issueType: jiraIssue.issue_type,
        priority: jiraIssue.priority,
        status: jiraIssue.status,
        url: `${input.config.baseUrl}/browse/${jiraIssue.key}`,
      };

      logger.info('Jira 이슈 생성 태스크 완료', { result }, 'JiraCreateTask');

      return {
        success: true,
        data: result,
        metadata: {
          projectKey: input.config.projectKey,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      logger.error('Jira 이슈 생성 태스크 실패', error, 'JiraCreateTask');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Jira 이슈 생성 중 알 수 없는 오류가 발생했습니다.',
        metadata: {
          analysis: input.analysis,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  async validate(input: JiraCreateInput, _context: TaskContext): Promise<boolean> {
    // AI 분석 결과 검증
    if (!input.analysis) {
      logger.warn('Jira 생성 입력 검증 실패: AI 분석 결과 없음', {}, 'JiraCreateTask');
      return false;
    }

    if (!input.analysis.title || input.analysis.title.trim().length === 0) {
      logger.warn('Jira 생성 입력 검증 실패: 제목 없음', {}, 'JiraCreateTask');
      return false;
    }

    // Jira 설정 검증
    if (!input.config.baseUrl || input.config.baseUrl.trim().length === 0) {
      logger.warn('Jira 생성 입력 검증 실패: Base URL 없음', {}, 'JiraCreateTask');
      return false;
    }

    if (!input.config.email || input.config.email.trim().length === 0) {
      logger.warn('Jira 생성 입력 검증 실패: 이메일 없음', {}, 'JiraCreateTask');
      return false;
    }

    if (!input.config.apiToken || input.config.apiToken.trim().length === 0) {
      logger.warn('Jira 생성 입력 검증 실패: API 토큰 없음', {}, 'JiraCreateTask');
      return false;
    }

    if (!input.config.projectKey || input.config.projectKey.trim().length === 0) {
      logger.warn('Jira 생성 입력 검증 실패: 프로젝트 키 없음', {}, 'JiraCreateTask');
      return false;
    }

    return true;
  }

  onProgress(progress: number, message?: string): void {
    logger.debug('Jira 이슈 생성 진행 상황', { progress, message }, 'JiraCreateTask');
  }

  onError(error: Error): void {
    logger.error('Jira 이슈 생성 태스크 오류', error, 'JiraCreateTask');
  }
}
