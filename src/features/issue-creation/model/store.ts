import { create } from 'zustand';
import { Issue } from '@/entities/issue';
import { logger } from '@/shared/lib/logger';
import { SettingsService } from '@/entities/settings';
import { TaskService } from '@/entities/task';

interface IssueStore {
  issues: Issue[];
  error: string | null;
  isLoading: boolean;
  currentTaskProgress: any[];
  createIssue: (naturalLanguageText: string) => Promise<void>;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  clearError: () => void;
  getTaskProgress: () => any[];
}

export const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  error: null,
  isLoading: false,
  currentTaskProgress: [],

  createIssue: async (naturalLanguageText: string) => {
    set({ isLoading: true, error: null, currentTaskProgress: [] });
    
    logger.debug('이슈 생성 프로세스 시작', { naturalLanguageText }, 'IssueStore');
    
    try {
      // 설정 로드
      const settingsService = new SettingsService();
      const settings = settingsService.getSettings();

      if (!settings) {
        logger.warn("설정이 없음", null, "IssueStore");
        throw new Error(
          "설정이 필요합니다. 설정 페이지에서 Jira와 AI 서비스 정보를 입력해주세요."
        );
      }

      // Jira 설정 검증
      if (
        !settings.jira.baseUrl ||
        !settings.jira.email ||
        !settings.jira.apiToken ||
        !settings.jira.projectKey
      ) {
        throw new Error(
          "Jira 설정이 불완전합니다. 설정 페이지에서 모든 Jira 정보를 입력해주세요."
        );
      }

      // AI 설정 검증
      if (!settings.ai.apiKey) {
        throw new Error(
          "AI API 키가 설정되지 않았습니다. 설정 페이지에서 Gemini API 키를 입력해주세요."
        );
      }

      logger.debug(
        "설정 로드 완료",
        {
          hasJiraConfig: !!settings.jira.baseUrl,
          hasAIConfig: !!settings.ai.apiKey,
        },
        "IssueStore"
      );

      // TaskService 초기화 및 실행
      const taskService = TaskService.getInstance();
      if (!taskService) {
        throw new Error("TaskService를 초기화할 수 없습니다.");
      }

      // 태스크 진행 상황 모니터링
      const progressListener = () => {
        const currentProgress = taskService.getRunningTasks();
        set({ currentTaskProgress: currentProgress });
      };

      taskService.addEventListener(progressListener);

      try {
        // 태스크 체인 실행
        const result = await taskService.createIssue(naturalLanguageText, settings);

        if (!result.success) {
          throw new Error(result.error || "태스크 체인 실행에 실패했습니다.");
        }

        // 결과에서 Jira 이슈 정보 추출
        const jiraResult = result.data;
        if (!jiraResult || !jiraResult.jiraKey) {
          throw new Error("Jira 이슈 생성 결과가 올바르지 않습니다.");
        }

        logger.info(
          "Jira 이슈 생성 완료",
          { jiraKey: jiraResult.jiraKey },
          "IssueStore"
        );

        const newIssue: Issue = {
          id: Date.now().toString(),
          title: jiraResult.summary,
          description: jiraResult.description,
          type: jiraResult.issueType as Issue["type"],
          priority: jiraResult.priority as Issue["priority"],
          status: jiraResult.status as Issue["status"],
          createdAt: new Date(),
          jiraKey: jiraResult.jiraKey,
        };

        set((state) => ({
          issues: [newIssue, ...state.issues],
          isLoading: false,
          currentTaskProgress: [],
        }));

        logger.info(
          "이슈 생성 프로세스 완료",
          {
            issueId: newIssue.id,
            jiraKey: newIssue.jiraKey,
          },
          "IssueStore"
        );

      } finally {
        // 이벤트 리스너 제거
        taskService.removeEventListener(progressListener);
      }

    } catch (error) {
      let errorMessage = "이슈 생성에 실패했습니다.";

      if (error instanceof Error) {
        errorMessage = error.message;

        // 특정 에러 타입에 따른 구체적인 메시지 제공
        if (error.message.includes("네트워크 오류")) {
          errorMessage =
            "네트워크 연결을 확인해주세요. 인터넷 연결 상태를 점검해보세요.";
        } else if (error.message.includes("Jira API 오류")) {
          errorMessage =
            "Jira 서버 연결에 실패했습니다. Jira 설정을 확인해주세요.";
         } else if (error.message.includes("Gemini API 오류")) {
           errorMessage =
             "AI 서비스 연결에 실패했습니다. Gemini API 키를 확인해주세요.";
        } else if (error.message.includes("JSON 파싱 오류")) {
          errorMessage =
            "AI 응답 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
        }
      }

      logger.error("이슈 생성 프로세스 실패", error, "IssueStore");

      set({
        error: errorMessage,
        isLoading: false,
        currentTaskProgress: [],
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

  getTaskProgress: () => {
    return get().currentTaskProgress;
  },
}));
