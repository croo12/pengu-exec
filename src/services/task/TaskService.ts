import { TaskOrchestrator } from './TaskOrchestrator';
import { AIAnalysisTask } from './AIAnalysisTask';
import { JiraCreateTask } from './JiraCreateTask';
import { NotificationTask } from './NotificationTask';
import { NodeExecutionTask } from "./NodeExecutionTask";
import { taskChains } from "./TaskChainDefinitions";
import { logger } from "@/utils/logger";

// 싱글톤 패턴으로 TaskService 구현
class TaskService {
  private static instance: TaskService;
  private orchestrator: TaskOrchestrator;
  private initialized = false;

  private constructor() {
    this.orchestrator = new TaskOrchestrator();
  }

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  // 태스크 서비스 초기화
  public initialize(): void {
    if (this.initialized) {
      logger.warn("TaskService가 이미 초기화되었습니다", {}, "TaskService");
      return;
    }

    try {
      // 태스크 등록
      this.orchestrator.registerTask(new AIAnalysisTask());
      this.orchestrator.registerTask(new JiraCreateTask());
      this.orchestrator.registerTask(new NotificationTask());
      this.orchestrator.registerTask(new NodeExecutionTask());

      // 태스크 체인 등록
      taskChains.forEach((chain) => {
        this.orchestrator.registerChain(chain);
      });

      this.initialized = true;
      logger.info(
        "TaskService 초기화 완료",
        {
          registeredTasks: this.orchestrator.getRegisteredTasks().length,
          registeredChains: this.orchestrator.getRegisteredChains().length,
        },
        "TaskService"
      );
    } catch (error) {
      logger.error("TaskService 초기화 실패", error, "TaskService");
      throw error;
    }
  }

  // 이슈 생성 체인 실행
  public async createIssue(
    naturalLanguageText: string,
    settings: any
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        "TaskService가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요."
      );
    }

    logger.info("이슈 생성 요청", { text: naturalLanguageText }, "TaskService");

    try {
      // AI 분석 태스크를 위한 입력 준비
      const aiAnalysisInput = {
        text: naturalLanguageText,
        config: settings.ai,
      };

      const result = await this.orchestrator.executeChain(
        "create_issue_chain",
        aiAnalysisInput,
        {
          settings,
          startTime: new Date().toISOString(),
        }
      );

      logger.info("이슈 생성 완료", { result }, "TaskService");
      return result;
    } catch (error) {
      logger.error("이슈 생성 실패", error, "TaskService");
      throw error;
    }
  }

  // 이슈 생성 + 알림 체인 실행
  public async createIssueWithNotification(
    naturalLanguageText: string,
    settings: any
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        "TaskService가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요."
      );
    }

    logger.info(
      "이슈 생성 + 알림 요청",
      { text: naturalLanguageText },
      "TaskService"
    );

    try {
      // AI 분석 태스크를 위한 입력 준비
      const aiAnalysisInput = {
        text: naturalLanguageText,
        config: settings.ai,
      };

      const result = await this.orchestrator.executeChain(
        "create_issue_with_notification_chain",
        aiAnalysisInput,
        {
          settings,
          startTime: new Date().toISOString(),
        }
      );

      logger.info("이슈 생성 + 알림 완료", { result }, "TaskService");
      return result;
    } catch (error) {
      logger.error("이슈 생성 + 알림 실패", error, "TaskService");
      throw error;
    }
  }

  // AI 분석만 실행
  public async analyzeText(
    naturalLanguageText: string,
    aiConfig: any
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        "TaskService가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요."
      );
    }

    logger.info("AI 분석 요청", { text: naturalLanguageText }, "TaskService");

    try {
      // AI 분석 태스크를 위한 입력 준비
      const aiAnalysisInput = {
        text: naturalLanguageText,
        config: aiConfig,
      };

      const result = await this.orchestrator.executeChain(
        "ai_analysis_only_chain",
        aiAnalysisInput,
        {
          aiConfig,
          startTime: new Date().toISOString(),
        }
      );

      logger.info("AI 분석 완료", { result }, "TaskService");
      return result;
    } catch (error) {
      logger.error("AI 분석 실패", error, "TaskService");
      throw error;
    }
  }

  // Jira 이슈만 생성
  public async createJiraIssue(
    analysisResult: any,
    jiraConfig: any
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        "TaskService가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요."
      );
    }

    logger.info(
      "Jira 이슈 생성 요청",
      { analysis: analysisResult },
      "TaskService"
    );

    try {
      const result = await this.orchestrator.executeChain(
        "jira_create_only_chain",
        { analysis: analysisResult, config: jiraConfig },
        {
          startTime: new Date().toISOString(),
        }
      );

      logger.info("Jira 이슈 생성 완료", { result }, "TaskService");
      return result;
    } catch (error) {
      logger.error("Jira 이슈 생성 실패", error, "TaskService");
      throw error;
    }
  }

  // 진행 중인 태스크 조회
  public getRunningTasks() {
    return this.orchestrator.getRunningTasks();
  }

  // 특정 태스크 진행 상황 조회
  public getTaskProgress(taskId: string) {
    return this.orchestrator.getTaskProgress(taskId);
  }

  // 이벤트 리스너 등록
  public addEventListener(listener: any) {
    this.orchestrator.addEventListener(listener);
  }

  // 이벤트 리스너 제거
  public removeEventListener(listener: any) {
    this.orchestrator.removeEventListener(listener);
  }

  // 등록된 태스크 목록 조회
  public getRegisteredTasks() {
    return this.orchestrator.getRegisteredTasks();
  }

  // 등록된 체인 목록 조회
  public getRegisteredChains() {
    return this.orchestrator.getRegisteredChains();
  }

  // Node.js 코드 실행
  public async executeNodeCode(
    code: string,
    options?: {
      timeout?: number;
      workingDirectory?: string;
      environment?: Record<string, string>;
      args?: string[];
    }
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        "TaskService가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요."
      );
    }

    logger.info(
      "Node.js 코드 실행 요청",
      {
        codeLength: code.length,
        timeout: options?.timeout,
        workingDirectory: options?.workingDirectory,
      },
      "TaskService"
    );

    try {
      const nodeExecutionInput = {
        code,
        timeout: options?.timeout,
        workingDirectory: options?.workingDirectory,
        environment: options?.environment,
        args: options?.args,
      };

      const result = await this.orchestrator.executeChain(
        "node_execution_chain",
        nodeExecutionInput,
        {
          startTime: new Date().toISOString(),
        }
      );

      logger.info("Node.js 코드 실행 완료", { result }, "TaskService");
      return result;
    } catch (error) {
      logger.error("Node.js 코드 실행 실패", error, "TaskService");
      throw error;
    }
  }

  // AI 분석 + Node.js 실행
  public async analyzeAndExecuteNodeCode(
    naturalLanguageText: string,
    aiConfig: any,
    nodeOptions?: {
      timeout?: number;
      workingDirectory?: string;
      environment?: Record<string, string>;
      args?: string[];
    }
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error(
        "TaskService가 초기화되지 않았습니다. initialize()를 먼저 호출해주세요."
      );
    }

    logger.info(
      "AI 분석 + Node.js 실행 요청",
      {
        text: naturalLanguageText,
        nodeOptions,
      },
      "TaskService"
    );

    try {
      const aiAnalysisInput = {
        text: naturalLanguageText,
        config: aiConfig,
      };

      const result = await this.orchestrator.executeChain(
        "ai_analysis_with_node_execution_chain",
        aiAnalysisInput,
        {
          aiConfig,
          nodeOptions,
          startTime: new Date().toISOString(),
        }
      );

      logger.info("AI 분석 + Node.js 실행 완료", { result }, "TaskService");
      return result;
    } catch (error) {
      logger.error("AI 분석 + Node.js 실행 실패", error, "TaskService");
      throw error;
    }
  }
}

export default TaskService;
