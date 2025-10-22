import { Task, TaskContext, TaskResult } from '@/entities/task';
import { logger } from '@/shared/lib/logger';

export interface NotificationInput {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
}

export interface NotificationOutput {
  notificationId: string;
  sent: boolean;
  timestamp: Date;
}

export class NotificationTask implements Task<NotificationInput, NotificationOutput> {
  readonly id = 'notification';
  readonly name = '알림 전송';
  readonly description = '사용자에게 알림을 전송하는 태스크';

  async execute(input: NotificationInput, _context: TaskContext): Promise<TaskResult<NotificationOutput>> {
    try {
      logger.info('알림 태스크 시작', { input }, 'NotificationTask');

      // 실제 구현에서는 여기서 알림 서비스 호출
      // 예: 브라우저 알림, 슬랙 알림, 이메일 등
      
      // 현재는 로그로만 처리
      const notificationId = `notif_${Date.now()}`;
      
      // 브라우저 알림 API 사용 (권한이 있는 경우)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(input.title || 'PenguExec 알림', {
          body: input.message,
          icon: '/icon.png',
        });
      }

      const result: NotificationOutput = {
        notificationId,
        sent: true,
        timestamp: new Date(),
      };

      logger.info('알림 태스크 완료', { result }, 'NotificationTask');

      return {
        success: true,
        data: result,
        metadata: {
          type: input.type,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      logger.error('알림 태스크 실패', error, 'NotificationTask');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '알림 전송 중 알 수 없는 오류가 발생했습니다.',
        metadata: {
          input,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  async validate(input: NotificationInput, _context: TaskContext): Promise<boolean> {
    if (!input.message || input.message.trim().length === 0) {
      logger.warn('알림 입력 검증 실패: 메시지 없음', {}, 'NotificationTask');
      return false;
    }

    if (!input.type || !['success', 'info', 'warning', 'error'].includes(input.type)) {
      logger.warn('알림 입력 검증 실패: 잘못된 타입', { type: input.type }, 'NotificationTask');
      return false;
    }

    return true;
  }

  onProgress(progress: number, message?: string): void {
    logger.debug('알림 태스크 진행 상황', { progress, message }, 'NotificationTask');
  }

  onError(error: Error): void {
    logger.error('알림 태스크 오류', error, 'NotificationTask');
  }
}
