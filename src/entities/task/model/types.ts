// Task entity types
export interface Task<TInput = any, TOutput = any> {
  readonly id: string;
  readonly name: string;
  execute(input: TInput, context: TaskContext): Promise<TaskResult<TOutput>>;
  validate?(input: TInput, context: TaskContext): Promise<boolean>;
}

export interface TaskChain {
  id: string;
  name: string;
  description: string;
  tasks: TaskStep[];
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

export interface TaskStep {
  taskId: string;
  taskType: string;
  retryCount?: number;
  timeout?: number;
  condition?: (context: TaskContext) => boolean;
  continueOnError?: boolean;
}

export interface TaskOrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
}

export interface NodeExecutionInput {
  code: string;
  timeout?: number;
  workingDirectory?: string;
  environment?: Record<string, string>;
  args?: string[];
}

export interface NodeExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  tempFilePath?: string;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: NodeExecutionOutput;
  error?: string;
  metadata?: Record<string, any>;
}

// Task execution types
export interface TaskContext {
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
  progress: number;
  message?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface TaskExecutionOptions {
  timeout?: number;
  retryAttempts?: number;
  retryCount?: number;
  context?: TaskContext;
  continueOnError?: boolean;
}

export interface TaskEvent {
  type: 'task_started' | 'task_progress' | 'task_completed' | 'task_failed';
  taskId: string;
  data?: any;
  timestamp: Date;
}

export interface TaskEventListener {
  (event: TaskEvent): void;
}
