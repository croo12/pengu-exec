import { 
  Task, 
  TaskContext, 
  TaskResult, 
  TaskProgress, 
  TaskChain, 
  TaskExecutionOptions,
  TaskEvent,
  TaskEventListener
} from '@/entities/task';
import { logger } from '@/shared/lib/logger';

export class TaskOrchestrator {
  private tasks: Map<string, Task> = new Map();
  private chains: Map<string, TaskChain> = new Map();
  private eventListeners: TaskEventListener[] = [];
  private runningTasks: Map<string, TaskProgress> = new Map();

  constructor() {
    logger.info('TaskOrchestrator 초기화', {}, 'TaskOrchestrator');
  }

  // 태스크 등록
  registerTask(task: Task): void {
    this.tasks.set(task.id, task);
    logger.debug(`태스크 등록: ${task.name} (${task.id})`, {}, 'TaskOrchestrator');
  }

  // 태스크 체인 등록
  registerChain(chain: TaskChain): void {
    this.chains.set(chain.id, chain);
    logger.debug(`태스크 체인 등록: ${chain.name} (${chain.id})`, {}, 'TaskOrchestrator');
  }

  // 단일 태스크 실행
  async executeTask<TInput, TOutput>(
    taskId: string, 
    input: TInput, 
    context: TaskContext = {},
    options: TaskExecutionOptions = {}
  ): Promise<TaskResult<TOutput>> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`태스크를 찾을 수 없습니다: ${taskId}`);
    }

    const progress: TaskProgress = {
      taskId,
      taskName: task.name,
      status: 'running',
      progress: 0,
      startTime: new Date(),
    };

    this.runningTasks.set(taskId, progress);
    this.emitEvent({
      type: 'task_started',
      taskId,
      timestamp: new Date(),
      data: { taskName: task.name }
    });

    try {
      logger.info(`태스크 실행 시작: ${task.name}`, { taskId, input }, 'TaskOrchestrator');

      // 입력 검증
      if (task.validate) {
        const isValid = await task.validate(input, context);
        if (!isValid) {
          throw new Error(`태스크 입력 검증 실패: ${task.name}`);
        }
      }

      // 진행 상황 업데이트
      progress.progress = 50;
      progress.message = '실행 중...';
      this.emitEvent({
        type: 'task_progress',
        taskId,
        timestamp: new Date(),
        data: { progress: 50, message: '실행 중...' }
      });

      // 태스크 실행
      const result = await this.executeWithTimeout(task, input, context, options.timeout);

      // 완료 처리
      progress.status = 'completed';
      progress.progress = 100;
      progress.endTime = new Date();
      progress.message = '완료';

      this.runningTasks.delete(taskId);
      this.emitEvent({
        type: 'task_completed',
        taskId,
        timestamp: new Date(),
        data: { result }
      });

      logger.info(`태스크 실행 완료: ${task.name}`, { taskId, result }, 'TaskOrchestrator');
      return result;

    } catch (error) {
      // 실패 처리
      progress.status = 'failed';
      progress.endTime = new Date();
      progress.message = error instanceof Error ? error.message : '알 수 없는 오류';

      this.runningTasks.delete(taskId);
      this.emitEvent({
        type: 'task_failed',
        taskId,
        timestamp: new Date(),
        data: { error: error instanceof Error ? error.message : String(error) }
      });

      logger.error(`태스크 실행 실패: ${task.name}`, error, 'TaskOrchestrator');
      throw error;
    }
  }

  // 태스크 체인 실행
  async executeChain(
    chainId: string, 
    initialInput: any, 
    initialContext: TaskContext = {},
    options: TaskExecutionOptions = {}
  ): Promise<TaskResult> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`태스크 체인을 찾을 수 없습니다: ${chainId}`);
    }

    logger.info(`태스크 체인 실행 시작: ${chain.name}`, { chainId }, 'TaskOrchestrator');

    let currentInput = initialInput;
    let context = { ...initialContext };
    let lastResult: TaskResult | null = null;

    try {
      for (const taskDef of chain.tasks) {
        // 조건부 실행 체크
        if (taskDef.condition && !taskDef.condition(context)) {
          logger.debug(`태스크 건너뛰기: ${taskDef.taskId}`, { reason: 'condition_failed' }, 'TaskOrchestrator');
          continue;
        }

        // 태스크별 입력 준비
        let taskInput = currentInput;
        
        // Jira 생성 태스크인 경우 특별 처리
        if (taskDef.taskId === 'jira_create') {
          const aiResult = context['ai_analysis_result'];
          if (aiResult && aiResult.success && aiResult.data) {
            taskInput = {
              analysis: aiResult.data,
              config: context.settings?.jira
            };
          } else {
            throw new Error('AI 분석 결과가 없어 Jira 이슈를 생성할 수 없습니다.');
          }
        }
        
        // 알림 태스크인 경우 특별 처리
        if (taskDef.taskId === 'notification') {
          const jiraResult = context['jira_create_result'];
          if (jiraResult && jiraResult.success && jiraResult.data) {
            taskInput = {
              message: `Jira 이슈가 성공적으로 생성되었습니다: ${jiraResult.data.jiraKey}`,
              type: 'success' as const,
              title: '이슈 생성 완료'
            };
          } else {
            // Jira 생성이 실패한 경우에도 알림 전송
            taskInput = {
              message: 'Jira 이슈 생성에 실패했습니다.',
              type: 'error' as const,
              title: '이슈 생성 실패'
            };
          }
        }

        // 태스크 실행
        const result = await this.executeTask(
          taskDef.taskId,
          taskInput,
          context,
          {
            timeout: taskDef.timeout || options.timeout,
            retryCount: taskDef.retryCount || options.retryCount,
            continueOnError: options.continueOnError
          }
        );

        if (!result.success && !options.continueOnError) {
          throw new Error(`태스크 체인 실행 실패: ${taskDef.taskId} - ${result.error}`);
        }

        // 다음 태스크의 입력으로 결과 사용
        if (result.data !== undefined) {
          currentInput = result.data;
        }

        // 컨텍스트에 결과 저장
        context[`${taskDef.taskId}_result`] = result;
        lastResult = result;
      }

      // 체인 완료 콜백
      if (chain.onComplete && lastResult) {
        chain.onComplete(lastResult);
      }

      logger.info(`태스크 체인 실행 완료: ${chain.name}`, { chainId }, 'TaskOrchestrator');
      return lastResult || { success: true, data: currentInput };

    } catch (error) {
      // 체인 에러 콜백
      if (chain.onError) {
        chain.onError(error instanceof Error ? error : new Error(String(error)));
      }

      logger.error(`태스크 체인 실행 실패: ${chain.name}`, error, 'TaskOrchestrator');
      throw error;
    }
  }

  // 진행 중인 태스크 조회
  getRunningTasks(): TaskProgress[] {
    return Array.from(this.runningTasks.values());
  }

  // 특정 태스크 진행 상황 조회
  getTaskProgress(taskId: string): TaskProgress | undefined {
    return this.runningTasks.get(taskId);
  }

  // 이벤트 리스너 등록
  addEventListener(listener: TaskEventListener): void {
    this.eventListeners.push(listener);
  }

  // 이벤트 리스너 제거
  removeEventListener(listener: TaskEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // 이벤트 발생
  private emitEvent(event: TaskEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('이벤트 리스너 실행 오류', error, 'TaskOrchestrator');
      }
    });
  }

  // 타임아웃과 함께 태스크 실행
  private async executeWithTimeout<TInput, TOutput>(
    task: Task<TInput, TOutput>,
    input: TInput,
    context: TaskContext,
    timeout?: number
  ): Promise<TaskResult<TOutput>> {
    if (!timeout) {
      return await task.execute(input, context);
    }

    return Promise.race([
      task.execute(input, context),
      new Promise<TaskResult<TOutput>>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`태스크 실행 타임아웃: ${task.name} (${timeout}ms)`));
        }, timeout);
      })
    ]);
  }

  // 등록된 태스크 목록 조회
  getRegisteredTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  // 등록된 체인 목록 조회
  getRegisteredChains(): TaskChain[] {
    return Array.from(this.chains.values());
  }
}
