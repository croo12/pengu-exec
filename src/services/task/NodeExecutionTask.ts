import { Task, TaskResult, TaskContext } from '@/types/task';
import { NodeExecutionInput, NodeExecutionOutput } from '@/types';
import { logger } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';

export class NodeExecutionTask implements Task<NodeExecutionInput, NodeExecutionOutput> {
  readonly id = 'node_execution';
  readonly name = 'Node.js 코드 실행';
  readonly description = 'Node.js 코드를 실행하고 결과를 반환하는 태스크';

  async execute(input: NodeExecutionInput, _context: TaskContext): Promise<TaskResult<NodeExecutionOutput>> {
    const startTime = Date.now();

    try {
      logger.info('Node.js 코드 실행 시작', { 
        codeLength: input.code.length,
        timeout: input.timeout,
        workingDirectory: input.workingDirectory 
      }, 'NodeExecutionTask');

      // 입력 검증
      if (!input.code || input.code.trim().length === 0) {
        throw new Error('실행할 코드가 제공되지 않았습니다');
      }

      // Tauri 백엔드를 통해 Node.js 코드 실행
      const result = await invoke<NodeExecutionOutput>('execute_node_code', {
        code: input.code,
        timeout: input.timeout || 30000,
        workingDirectory: input.workingDirectory || '',
        environment: input.environment || {},
        args: input.args || []
      });
      
      const executionTime = Date.now() - startTime;
      
      logger.info('Node.js 코드 실행 완료', { 
        exitCode: result.exitCode,
        executionTime,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length
      }, 'NodeExecutionTask');

      return {
        success: result.exitCode === 0,
        data: {
          ...result,
          executionTime
        },
        metadata: {
          taskId: this.id,
          executionTime,
          codeLength: input.code.length
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Node.js 코드 실행 실패', error, 'NodeExecutionTask');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        data: {
          stdout: '',
          stderr: error instanceof Error ? error.message : '알 수 없는 오류',
          exitCode: -1,
          executionTime
        },
        metadata: {
          taskId: this.id,
          executionTime,
          error: true
        }
      };
    }
  }


  async validate(input: NodeExecutionInput, _context: TaskContext): Promise<boolean> {
    try {
      // 기본 검증
      if (!input.code || typeof input.code !== 'string') {
        logger.warn('Node.js 실행 입력 검증 실패: 코드가 제공되지 않음', {}, 'NodeExecutionTask');
        return false;
      }

      if (input.code.trim().length === 0) {
        logger.warn('Node.js 실행 입력 검증 실패: 빈 코드', {}, 'NodeExecutionTask');
        return false;
      }

      // 코드 길이 제한 (1MB)
      const maxCodeLength = 1024 * 1024;
      if (input.code.length > maxCodeLength) {
        logger.warn('Node.js 실행 입력 검증 실패: 코드가 너무 김', { 
          codeLength: input.code.length, 
          maxLength: maxCodeLength 
        }, 'NodeExecutionTask');
        return false;
      }

      // 타임아웃 검증
      if (input.timeout && (input.timeout < 1000 || input.timeout > 300000)) {
        logger.warn('Node.js 실행 입력 검증 실패: 잘못된 타임아웃 값', { 
          timeout: input.timeout 
        }, 'NodeExecutionTask');
        return false;
      }

      logger.debug('Node.js 실행 입력 검증 성공', {}, 'NodeExecutionTask');
      return true;

    } catch (error) {
      logger.error('Node.js 실행 입력 검증 중 오류 발생', error, 'NodeExecutionTask');
      return false;
    }
  }

  onProgress?(progress: number, message?: string): void {
    logger.debug('Node.js 실행 진행 상황', { progress, message }, 'NodeExecutionTask');
  }

  onError?(error: Error): void {
    logger.error('Node.js 실행 오류', error, 'NodeExecutionTask');
  }
}
