import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  Save as SaveIcon,
  Science as TestIcon,
} from '@mui/icons-material';
import { AppSettings, JiraConfig, AIServiceConfig } from '@/types';
import SettingsService from '@/services/settingsService';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '@/utils/logger';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({
    jira: {
      baseUrl: '',
      email: '',
      apiToken: '',
      projectKey: '',
    },
    ai: {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
    },
    theme: 'light',
    language: 'ko',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const settingsService = new SettingsService();

  useEffect(() => {
    if (open) {
      const savedSettings = settingsService.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    }
  }, [open]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleJiraChange = (field: keyof JiraConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      jira: {
        ...prev.jira,
        [field]: value,
      },
    }));
  };

  const handleAIChange = (field: keyof AIServiceConfig, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
        [field]: value,
      },
    }));
  };

  const handleGeneralChange = (field: keyof Pick<AppSettings, 'theme' | 'language'>, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const testJiraConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    logger.info('Jira 연결 테스트 시작', {
      baseUrl: settings.jira.baseUrl,
      email: settings.jira.email,
      projectKey: settings.jira.projectKey
    }, 'SettingsDialog');
    
    try {
      const result = await invoke('test_jira_connection', {
        config: {
          base_url: settings.jira.baseUrl,
          email: settings.jira.email,
          api_token: settings.jira.apiToken,
          project_key: settings.jira.projectKey,
        },
      });
      
      if (result) {
        logger.info('Jira 연결 테스트 성공', null, 'SettingsDialog');
        setSuccess('Jira 연결이 성공했습니다!');
      } else {
        logger.warn('Jira 연결 테스트 실패', null, 'SettingsDialog');
        setError('Jira 연결에 실패했습니다. 설정을 확인해주세요.');
      }
    } catch (err) {
      logger.error('Jira 연결 테스트 중 오류가 발생했습니다.', err, 'SettingsDialog');
      setError(err instanceof Error ? err.message : 'Jira 연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      settingsService.saveSettings(settings);
      setSuccess('설정이 저장되었습니다!');
      
      // Tauri 백엔드에도 설정 저장
      await invoke('save_settings', {
        settings: settings,
      });
      
      setTimeout(() => {
        onClose();
      }, 1000);
      logger.info('설정 저장 완료', { settings });
    } catch (err) {
      logger.error('설정 저장 중 오류가 발생했습니다.', { error: err});
      setError(err instanceof Error ? err.message : '설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">설정</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="설정 탭">
            <Tab label="Jira 설정" />
            <Tab label="AI 설정" />
            <Tab label="일반 설정" />
          </Tabs>
        </Box>

        {/* Jira 설정 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Jira Base URL"
                value={settings.jira.baseUrl}
                onChange={(e) => handleJiraChange('baseUrl', e.target.value)}
                placeholder="https://your-domain.atlassian.net"
                helperText="Jira 인스턴스의 기본 URL을 입력하세요"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="이메일"
                type="email"
                value={settings.jira.email}
                onChange={(e) => handleJiraChange('email', e.target.value)}
                placeholder="your-email@example.com"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="API 토큰"
                type="password"
                value={settings.jira.apiToken}
                onChange={(e) => handleJiraChange('apiToken', e.target.value)}
                placeholder="Jira API 토큰"
                helperText="Atlassian 계정에서 생성한 API 토큰"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="프로젝트 키"
                value={settings.jira.projectKey}
                onChange={(e) => handleJiraChange('projectKey', e.target.value)}
                placeholder="PROJ"
                helperText="이슈를 생성할 Jira 프로젝트의 키"
              />
            </Grid>
            <Grid size={12}>
              <Button
                variant="outlined"
                startIcon={isLoading ? <CircularProgress size={20} /> : <TestIcon />}
                onClick={testJiraConnection}
                disabled={isLoading || !settings.jira.baseUrl || !settings.jira.email || !settings.jira.apiToken}
                fullWidth
              >
                연결 테스트
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* AI 설정 탭 */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="OpenAI API 키"
                type="password"
                value={settings.ai.apiKey}
                onChange={(e) => handleAIChange('apiKey', e.target.value)}
                placeholder="sk-..."
                helperText="OpenAI API 키를 입력하세요"
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>모델</InputLabel>
                <Select
                  value={settings.ai.model}
                  label="모델"
                  onChange={(e) => handleAIChange('model', e.target.value)}
                >
                  <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  <MenuItem value="gpt-4">GPT-4</MenuItem>
                  <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Temperature"
                type="number"
                value={settings.ai.temperature}
                onChange={(e) => handleAIChange('temperature', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 2, step: 0.1 }}
                helperText="0.0 (일관성) ~ 2.0 (창의성)"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* 일반 설정 탭 */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>테마</InputLabel>
                <Select
                  value={settings.theme}
                  label="테마"
                  onChange={(e) => handleGeneralChange('theme', e.target.value)}
                >
                  <MenuItem value="light">라이트</MenuItem>
                  <MenuItem value="dark">다크</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>언어</InputLabel>
                <Select
                  value={settings.language}
                  label="언어"
                  onChange={(e) => handleGeneralChange('language', e.target.value)}
                >
                  <MenuItem value="ko">한국어</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 에러 및 성공 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={isLoading}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
