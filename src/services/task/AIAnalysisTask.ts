import { Task, TaskContext, TaskResult } from '@/types/task';
import { AIAnalysisResult, AIServiceConfig } from '@/types';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '@/utils/logger';

export interface AIAnalysisInput {
  text: string;
  config: AIServiceConfig;
}

export class AIAnalysisTask implements Task<AIAnalysisInput, AIAnalysisResult> {
  readonly id = 'ai_analysis';
  readonly name = 'AI 분석';
  readonly description = '자연어 텍스트를 AI로 분석하여 구조화된 데이터로 변환';

  async execute(input: AIAnalysisInput, _context: TaskContext): Promise<TaskResult<AIAnalysisResult>> {
    try {
      logger.info('AI 분석 태스크 시작', { text: input.text }, 'AIAnalysisTask');

      // Tauri 백엔드를 통한 AI 분석
      const analysis = await invoke('analyze_with_ai', {
        text: input.text,
        config: {
          api_key: input.config.apiKey,
          model: input.config.model,
          temperature: input.config.temperature,
        },
      }) as {
        title: string;
        description: string;
        issue_type: string;
        priority: string;
        labels: string[];
      };

      const result: AIAnalysisResult = {
        title: analysis.title,
        description: analysis.description,
        issueType: analysis.issue_type as AIAnalysisResult['issueType'],
        priority: analysis.priority as AIAnalysisResult['priority'],
        labels: analysis.labels,
      };

      logger.info('AI 분석 태스크 완료', { result }, 'AIAnalysisTask');

      return {
        success: true,
        data: result,
        metadata: {
          originalText: input.text,
          model: input.config.model,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      logger.error('AI 분석 태스크 실패', error, 'AIAnalysisTask');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI 분석 중 알 수 없는 오류가 발생했습니다.',
        metadata: {
          originalText: input.text,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  async validate(input: AIAnalysisInput, _context: TaskContext): Promise<boolean> {
    // 입력 검증
    if (!input.text || input.text.trim().length === 0) {
      logger.warn('AI 분석 입력 검증 실패: 빈 텍스트', {}, 'AIAnalysisTask');
      return false;
    }

    if (!input.config.apiKey || input.config.apiKey.trim().length === 0) {
      logger.warn('AI 분석 입력 검증 실패: API 키 없음', {}, 'AIAnalysisTask');
      return false;
    }

    if (!input.config.model || input.config.model.trim().length === 0) {
      logger.warn('AI 분석 입력 검증 실패: 모델명 없음', {}, 'AIAnalysisTask');
      return false;
    }

    return true;
  }

  onProgress(progress: number, message?: string): void {
    logger.debug('AI 분석 진행 상황', { progress, message }, 'AIAnalysisTask');
  }

  onError(error: Error): void {
    logger.error('AI 분석 태스크 오류', error, 'AIAnalysisTask');
  }
}
