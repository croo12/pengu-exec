import { AppSettings, JiraConfig, AIServiceConfig } from '@/types';

class SettingsService {
  private readonly STORAGE_KEY = 'penguexec_settings';

  // 설정 로드
  getSettings(): AppSettings | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const settings = JSON.parse(stored);
      
      // 설정 유효성 검사
      if (this.validateSettings(settings)) {
        return settings;
      }
      
      return null;
    } catch (error) {
      console.error('설정 로드 실패:', error);
      return null;
    }
  }

  // 설정 저장
  saveSettings(settings: AppSettings): void {
    try {
      if (this.validateSettings(settings)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      } else {
        throw new Error('유효하지 않은 설정입니다.');
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      throw error;
    }
  }

  // Jira 설정만 업데이트
  updateJiraConfig(jiraConfig: JiraConfig): void {
    const currentSettings = this.getSettings() || this.getDefaultSettings();
    currentSettings.jira = jiraConfig;
    this.saveSettings(currentSettings);
  }

  // AI 설정만 업데이트
  updateAIConfig(aiConfig: AIServiceConfig): void {
    const currentSettings = this.getSettings() || this.getDefaultSettings();
    currentSettings.ai = aiConfig;
    this.saveSettings(currentSettings);
  }

  // 기본 설정 반환
  getDefaultSettings(): AppSettings {
    return {
      jira: {
        baseUrl: "",
        email: "",
        apiToken: "",
        projectKey: "",
      },
      ai: {
        apiKey: "",
        model: "gemini-2.0-flash-exp",
        temperature: 0.7,
      },
      theme: "light",
      language: "ko",
    };
  }

  // 설정 유효성 검사
  private validateSettings(settings: any): settings is AppSettings {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    // Jira 설정 검증
    if (!this.validateJiraConfig(settings.jira)) {
      return false;
    }

    // AI 설정 검증
    if (!this.validateAIConfig(settings.ai)) {
      return false;
    }

    // 테마 설정 검증
    if (!['light', 'dark'].includes(settings.theme)) {
      return false;
    }

    // 언어 설정 검증
    if (!['ko', 'en'].includes(settings.language)) {
      return false;
    }

    return true;
  }

  private validateJiraConfig(jira: any): jira is JiraConfig {
    return (
      jira &&
      typeof jira === 'object' &&
      typeof jira.baseUrl === 'string' &&
      jira.baseUrl.length > 0 &&
      typeof jira.email === 'string' &&
      jira.email.length > 0 &&
      typeof jira.apiToken === 'string' &&
      jira.apiToken.length > 0 &&
      typeof jira.projectKey === 'string' &&
      jira.projectKey.length > 0
    );
  }

  private validateAIConfig(ai: any): ai is AIServiceConfig {
    return (
      ai &&
      typeof ai === 'object' &&
      typeof ai.apiKey === 'string' &&
      ai.apiKey.length > 0 &&
      typeof ai.model === 'string' &&
      ai.model.length > 0 &&
      typeof ai.temperature === 'number' &&
      ai.temperature >= 0 &&
      ai.temperature <= 2
    );
  }

  // 설정 초기화
  resetSettings(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // 설정 내보내기
  exportSettings(): string {
    const settings = this.getSettings();
    if (!settings) {
      throw new Error('내보낼 설정이 없습니다.');
    }
    return JSON.stringify(settings, null, 2);
  }

  // 설정 가져오기
  importSettings(jsonString: string): void {
    try {
      const settings = JSON.parse(jsonString);
      if (this.validateSettings(settings)) {
        this.saveSettings(settings);
      } else {
        throw new Error('유효하지 않은 설정 파일입니다.');
      }
    } catch (error) {
      console.error('설정 가져오기 실패:', error);
      throw new Error('설정 파일을 파싱할 수 없습니다.');
    }
  }

  // 환경 변수에서 설정 로드 (개발용)
  loadFromEnvironment(): Partial<AppSettings> {
    const envSettings: Partial<AppSettings> = {};

    // Jira 설정
    if (import.meta.env.VITE_JIRA_BASE_URL) {
      envSettings.jira = {
        baseUrl: import.meta.env.VITE_JIRA_BASE_URL,
        email: import.meta.env.VITE_JIRA_EMAIL || '',
        apiToken: import.meta.env.VITE_JIRA_API_TOKEN || '',
        projectKey: import.meta.env.VITE_JIRA_PROJECT_KEY || '',
      };
    }

    // AI 설정
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      envSettings.ai = {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        model: import.meta.env.VITE_AI_MODEL || "gemini-2.0-flash-exp",
        temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || "0.7"),
      };
    }

    return envSettings;
  }
}

export default SettingsService;
