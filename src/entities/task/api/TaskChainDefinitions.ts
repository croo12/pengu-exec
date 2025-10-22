import { TaskChain } from '@/entities/task';
import { logger } from '@/shared/lib/logger';

// 기본 이슈 생성 체인: AI 분석 → Jira 생성
export const createIssueChain: TaskChain = {
  id: 'create_issue_chain',
  name: '이슈 생성 체인',
  description: '자연어 입력을 AI로 분석하고 Jira 이슈를 생성하는 기본 체인',
  tasks: [
    {
      taskId: 'ai_analysis',
      taskType: 'ai_analysis',
      retryCount: 2,
      timeout: 30000, // 30초
    },
    {
      taskId: 'jira_create',
      taskType: 'jira_create',
      retryCount: 1,
      timeout: 15000, // 15초
    }
  ],
  onComplete: (result) => {
    logger.info('이슈 생성 체인 완료', { result }, 'TaskChainDefinitions');
  },
  onError: (error) => {
    logger.error('이슈 생성 체인 실패', error, 'TaskChainDefinitions');
  }
};

// 확장된 이슈 생성 체인: AI 분석 → Jira 생성 → 알림
export const createIssueWithNotificationChain: TaskChain = {
  id: 'create_issue_with_notification_chain',
  name: '이슈 생성 + 알림 체인',
  description: '자연어 입력을 AI로 분석하고 Jira 이슈를 생성한 후 알림을 전송하는 체인',
  tasks: [
    {
      taskId: 'ai_analysis',
      taskType: 'ai_analysis',
      retryCount: 2,
      timeout: 30000,
    },
    {
      taskId: 'jira_create',
      taskType: 'jira_create',
      retryCount: 1,
      timeout: 15000,
    },
    {
      taskId: 'notification',
      taskType: 'notification',
      retryCount: 1,
      timeout: 5000,
      condition: (context) => {
        // Jira 생성이 성공한 경우에만 알림 전송
        const jiraResult = context['jira_create_result'];
        return jiraResult && jiraResult.success;
      }
    }
  ],
  onComplete: (result) => {
    logger.info('이슈 생성 + 알림 체인 완료', { result }, 'TaskChainDefinitions');
  },
  onError: (error) => {
    logger.error('이슈 생성 + 알림 체인 실패', error, 'TaskChainDefinitions');
  }
};

// AI 분석만 수행하는 체인 (Jira 생성 없이)
export const aiAnalysisOnlyChain: TaskChain = {
  id: 'ai_analysis_only_chain',
  name: 'AI 분석 전용 체인',
  description: '자연어 입력을 AI로 분석만 수행하는 체인',
  tasks: [
    {
      taskId: 'ai_analysis',
      taskType: 'ai_analysis',
      retryCount: 2,
      timeout: 30000,
    }
  ],
  onComplete: (result) => {
    logger.info('AI 분석 체인 완료', { result }, 'TaskChainDefinitions');
  },
  onError: (error) => {
    logger.error('AI 분석 체인 실패', error, 'TaskChainDefinitions');
  }
};

// Jira 생성만 수행하는 체인 (AI 분석 결과가 이미 있는 경우)
export const jiraCreateOnlyChain: TaskChain = {
  id: 'jira_create_only_chain',
  name: 'Jira 생성 전용 체인',
  description: '이미 분석된 데이터로 Jira 이슈만 생성하는 체인',
  tasks: [
    {
      taskId: 'jira_create',
      taskType: 'jira_create',
      retryCount: 1,
      timeout: 15000,
    }
  ],
  onComplete: (result) => {
    logger.info('Jira 생성 체인 완료', { result }, 'TaskChainDefinitions');
  },
  onError: (error) => {
    logger.error('Jira 생성 체인 실패', error, 'TaskChainDefinitions');
  }
};

// Node.js 코드 실행 체인
export const nodeExecutionChain: TaskChain = {
  id: 'node_execution_chain',
  name: 'Node.js 코드 실행 체인',
  description: 'Node.js 코드를 실행하고 결과를 반환하는 체인',
  tasks: [
    {
      taskId: 'node_execution',
      taskType: 'node_execution',
      retryCount: 1,
      timeout: 60000, // 60초
    }
  ],
  onComplete: (result) => {
    logger.info('Node.js 실행 체인 완료', { result }, 'TaskChainDefinitions');
  },
  onError: (error) => {
    logger.error('Node.js 실행 체인 실패', error, 'TaskChainDefinitions');
  }
};

// AI 분석 + Node.js 실행 체인
export const aiAnalysisWithNodeExecutionChain: TaskChain = {
  id: 'ai_analysis_with_node_execution_chain',
  name: 'AI 분석 + Node.js 실행 체인',
  description: '자연어를 AI로 분석한 후 Node.js 코드를 실행하는 체인',
  tasks: [
    {
      taskId: 'ai_analysis',
      taskType: 'ai_analysis',
      retryCount: 2,
      timeout: 30000,
    },
    {
      taskId: 'node_execution',
      taskType: 'node_execution',
      retryCount: 1,
      timeout: 60000,
      condition: (context) => {
        // AI 분석이 성공한 경우에만 Node.js 실행
        const aiResult = context['ai_analysis_result'];
        return aiResult && aiResult.success;
      }
    }
  ],
  onComplete: (result) => {
    logger.info('AI 분석 + Node.js 실행 체인 완료', { result }, 'TaskChainDefinitions');
  },
  onError: (error) => {
    logger.error('AI 분석 + Node.js 실행 체인 실패', error, 'TaskChainDefinitions');
  }
};

// 모든 체인 목록
export const taskChains: TaskChain[] = [
  createIssueChain,
  createIssueWithNotificationChain,
  aiAnalysisOnlyChain,
  jiraCreateOnlyChain,
  nodeExecutionChain,
  aiAnalysisWithNodeExecutionChain,
];
