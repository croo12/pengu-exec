export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 최대 로그 개수
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private formatMessage(level: LogLevel, message: string, data?: any, source?: string): string {
    const timestamp = new Date().toISOString();
    const sourceStr = source ? `[${source}]` : '';
    const dataStr = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${sourceStr} ${message}${dataStr}`;
  }

  private addLog(level: LogLevel, message: string, data?: any, source?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
    };

    this.logs.unshift(logEntry); // 최신 로그를 맨 앞에 추가
    
    // 최대 로그 개수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 콘솔에 출력
    const formattedMessage = this.formatMessage(level, message, data, source);
    console.log(formattedMessage);

    // 리스너들에게 알림
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  debug(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.DEBUG, message, data, source);
  }

  info(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.INFO, message, data, source);
  }

  warn(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.WARN, message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.addLog(LogLevel.ERROR, message, data, source);
  }

  // 로그 조회
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 특정 레벨의 로그만 조회
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // 로그 필터링
  filterLogs(level?: LogLevel, source?: string, searchText?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (source && log.source !== source) return false;
      if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }

  // 로그 클리어
  clearLogs(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  // 로그 리스너 등록
  addListener(listener: (logs: LogEntry[]) => void): void {
    this.listeners.push(listener);
  }

  // 로그 리스너 제거
  removeListener(listener: (logs: LogEntry[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 로그 내보내기
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 로그를 파일로 저장 (Tauri 명령어 사용)
  async saveToFile(): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const logsData = this.exportLogs();
      await invoke('save_logs_to_file', { logs: logsData });
      this.info('로그 파일 저장 완료', { fileSize: logsData.length });
    } catch (error) {
      this.error('로그 파일 저장 실패', error);
    }
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 전역 로거 설정 (개발 환경에서만)
if (import.meta.env.DEV) {
  (window as any).logger = logger;
  console.log('🐧 PenguExec Logger 초기화 완료');
}
