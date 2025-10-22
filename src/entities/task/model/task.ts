// 태스크 시스템 관련 타입 정의

export interface TaskContext {
  // 태스크 간 데이터 공유를 위한 컨텍스트
  [key: string]: any;
}

export interface TaskResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TaskProgress {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  startTime?: Date;
  endTime?: Date;
}

// 기본 태스크 인터페이스
export interface Task<TInput = any, TOutput = any> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  execute(input: TInput, context: TaskContext): Promise<TaskResult<TOutput>>;
  
  // 선택적 메서드들
  validate?(input: TInput, context: TaskContext): Promise<boolean>;
  onProgress?(progress: number, message?: string): void;
  onError?(error: Error): void;
}

// 태스크 체인 정의
export interface TaskChain {
  id: string;
  name: string;
  description: string;
  tasks: TaskDefinition[];
  onComplete?: (result: TaskResult) => void;
  onError?: (error: Error) => void;
}

export interface TaskDefinition {
  taskId: string;
  taskType: string;
  config?: Record<string, any>;
  condition?: (context: TaskContext) => boolean; // 조건부 실행
  retryCount?: number;
  timeout?: number;
}

// 태스크 실행 옵션
export interface TaskExecutionOptions {
  timeout?: number;
  retryCount?: number;
  continueOnError?: boolean;
  parallel?: boolean;
}

// 태스크 이벤트
export interface TaskEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'task_progress';
  taskId: string;
  timestamp: Date;
  data?: any;
}

// 태스크 리스너
export type TaskEventListener = (event: TaskEvent) => void;
