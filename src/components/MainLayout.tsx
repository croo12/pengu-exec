import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  BugReport as BugIcon,
  AddTask as TaskIcon,
  Settings as SettingsIcon,
  BugReport as LogIcon,
} from '@mui/icons-material';
import { useIssueStore, Issue } from '@/store/issueStore';
import SettingsDialog from '@/components/SettingsDialog';
import LogViewer from '@/components/LogViewer';
import { logger } from '@/utils/logger';

const MainLayout: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const { issues, createIssue, error } = useIssueStore();

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    logger.info('이슈 생성 요청 시작', { inputText }, 'MainLayout');
    setIsLoading(true);
    
    try {
      await createIssue(inputText);
      setInputText('');
      logger.info('이슈 생성 성공', { inputText }, 'MainLayout');
    } catch (err) {
      logger.error('이슈 생성 실패', err, 'MainLayout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        자연어로 Jira 이슈 생성하기
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        원하는 작업을 자연어로 입력하면 AI가 분석하여 적절한 Jira 이슈를 생성해드립니다.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* 입력 섹션 */}
        <Box sx={{ flex: { xs: 1, md: 2 } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              요청사항 입력
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: 로그인 페이지에서 버그가 있어서 수정이 필요해요"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<LogIcon />}
                onClick={() => setLogViewerOpen(true)}
                sx={{ display: import.meta.env.DEV ? 'inline-flex' : 'none' }}
              >
                로그
              </Button>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setSettingsOpen(true)}
              >
                설정
              </Button>
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? '생성 중...' : '이슈 생성'}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* 예시 섹션 */}
        <Box sx={{ flex: { xs: 1, md: 1 } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              예시 요청
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BugIcon color="error" sx={{ mr: 1, fontSize: 20 }} />
                    <Chip label="버그" size="small" color="error" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    "로그인 버튼이 작동하지 않아요"
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TaskIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                    <Chip label="기능" size="small" color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    "사용자 프로필 편집 기능을 추가해주세요"
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* 생성된 이슈 목록 */}
      {issues.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              생성된 이슈
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {issues.map((issue: Issue, index: number) => (
              <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={issue.type} 
                      color={issue.type === 'Bug' ? 'error' : 'primary'} 
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      우선순위: {issue.priority}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {issue.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {issue.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Box>
      )}

      {/* 설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* 로그 뷰어 다이얼로그 */}
      <LogViewer
        open={logViewerOpen}
        onClose={() => setLogViewerOpen(false)}
      />
    </Box>
  );
};

export default MainLayout;
