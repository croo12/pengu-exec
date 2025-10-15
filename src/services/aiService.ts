import { AIAnalysisResult, AIServiceConfig } from '@/types';

class AIService {
  constructor(_config: AIServiceConfig) {
    // config는 향후 실제 AI API 호출 시 사용
  }

  async analyzeNaturalLanguage(text: string): Promise<AIAnalysisResult> {
    // TODO: 실제 AI API 호출 (OpenAI, Claude 등)
    // 현재는 임시 로직으로 구현
    
    const analysis = await this.mockAIAnalysis(text);
    return analysis;
  }

  private async mockAIAnalysis(text: string): Promise<AIAnalysisResult> {
    // 실제 AI 서비스 호출을 시뮬레이션하는 임시 함수
    await new Promise(resolve => setTimeout(resolve, 1000)); // API 호출 지연 시뮬레이션

    const lowerText = text.toLowerCase();
    
    // 간단한 키워드 기반 분석
    const issueType = this.determineIssueType(lowerText);
    const priority = this.determinePriority(lowerText);
    const labels = this.extractLabels(lowerText);
    
    return {
      title: this.generateTitle(text),
      description: this.generateDescription(text),
      issueType,
      priority,
      labels,
    };
  }

  private determineIssueType(text: string): AIAnalysisResult['issueType'] {
    if (text.includes('버그') || text.includes('오류') || text.includes('문제') || text.includes('bug')) {
      return 'Bug';
    }
    if (text.includes('기능') || text.includes('추가') || text.includes('feature')) {
      return 'Story';
    }
    if (text.includes('작업') || text.includes('수정') || text.includes('task')) {
      return 'Task';
    }
    if (text.includes('에픽') || text.includes('epic') || text.includes('큰 프로젝트')) {
      return 'Epic';
    }
    
    return 'Task'; // 기본값
  }

  private determinePriority(text: string): AIAnalysisResult['priority'] {
    if (text.includes('긴급') || text.includes('중요') || text.includes('urgent') || text.includes('critical')) {
      return 'Critical';
    }
    if (text.includes('높음') || text.includes('high')) {
      return 'High';
    }
    if (text.includes('낮음') || text.includes('low')) {
      return 'Low';
    }
    
    return 'Medium'; // 기본값
  }

  private extractLabels(text: string): string[] {
    const labels: string[] = [];
    
    // 기술 스택 관련 라벨
    if (text.includes('react') || text.includes('프론트엔드')) labels.push('frontend');
    if (text.includes('backend') || text.includes('백엔드') || text.includes('api')) labels.push('backend');
    if (text.includes('database') || text.includes('db') || text.includes('데이터베이스')) labels.push('database');
    if (text.includes('ui') || text.includes('디자인')) labels.push('ui/ux');
    
    // 우선순위 관련 라벨
    if (text.includes('긴급') || text.includes('urgent')) labels.push('urgent');
    if (text.includes('개선') || text.includes('enhancement')) labels.push('enhancement');
    
    return labels;
  }

  private generateTitle(text: string): string {
    // 자연어 텍스트에서 제목 추출 또는 생성
    const sentences = text.split(/[.!?]/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length <= 100) {
      return firstSentence;
    }
    
    // 너무 긴 경우 요약
    const words = text.split(' ');
    if (words.length <= 8) return text;
    return words.slice(0, 8).join(' ') + '...';
  }

  private generateDescription(text: string): string {
    // 상세한 설명 생성 (실제 AI에서는 더 정교한 설명 생성)
    return `사용자 요청: ${text}\n\n자동 생성된 이슈입니다. AI가 자연어 요청을 분석하여 생성되었습니다.`;
  }

}

export default AIService;
