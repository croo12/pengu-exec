import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { logger, LogEntry, LogLevel } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ open, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadLogs();
      // 로그 리스너 등록
      const listener = (newLogs: LogEntry[]) => {
        setLogs(newLogs);
        applyFilters(newLogs);
      };
      logger.addListener(listener);

      return () => {
        logger.removeListener(listener);
      };
    }
  }, [open]);

  useEffect(() => {
    applyFilters(logs);
  }, [levelFilter, sourceFilter, searchText, logs]);

  const loadLogs = () => {
    const currentLogs = logger.getLogs();
    setLogs(currentLogs);
    applyFilters(currentLogs);
  };

  const applyFilters = (logEntries: LogEntry[]) => {
    let filtered = [...logEntries];

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (sourceFilter) {
      filtered = filtered.filter(log => log.source?.includes(sourceFilter));
    }

    if (searchText) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchText.toLowerCase()) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  };

  const handleRefresh = () => {
    loadLogs();
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    setFilteredLogs([]);
  };

  const handleExportLogs = async () => {
    try {
      setIsLoading(true);
      const logsData = logger.exportLogs();
      const blob = new Blob([logsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `penguexec_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('로그 내보내기 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToFile = async () => {
    try {
      setIsLoading(true);
      const result = await invoke('save_logs_to_file', {
        logs: logger.exportLogs(),
      });
      logger.info('로그 파일 저장 완료', { result });
    } catch (error) {
      setError('로그 파일 저장 실패');
      logger.error('로그 파일 저장 실패', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: LogLevel): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (level) {
      case LogLevel.DEBUG: return 'default';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warning';
      case LogLevel.ERROR: return 'error';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const uniqueSources = Array.from(new Set(logs.map(log => log.source).filter(Boolean)));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">개발 로그 뷰어</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* 필터 및 액션 영역 */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="로그 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>레벨</InputLabel>
              <Select
                value={levelFilter}
                label="레벨"
                onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
              >
                <MenuItem value="all">모든 레벨</MenuItem>
                <MenuItem value={LogLevel.DEBUG}>DEBUG</MenuItem>
                <MenuItem value={LogLevel.INFO}>INFO</MenuItem>
                <MenuItem value={LogLevel.WARN}>WARN</MenuItem>
                <MenuItem value={LogLevel.ERROR}>ERROR</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>소스</InputLabel>
              <Select
                value={sourceFilter}
                label="소스"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value="">모든 소스</MenuItem>
                {uniqueSources.map(source => (
                  <MenuItem key={source} value={source}>{source}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <Tooltip title="새로고침">
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="로그 내보내기">
                <IconButton onClick={handleExportLogs} size="small" disabled={isLoading}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="로그 파일로 저장">
                <IconButton onClick={handleSaveToFile} size="small" disabled={isLoading}>
                  {isLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="로그 지우기">
                <IconButton onClick={handleClearLogs} size="small">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 로그 목록 */}
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              {logs.length === 0 ? '로그가 없습니다.' : '필터 조건에 맞는 로그가 없습니다.'}
            </Typography>
          ) : (
            filteredLogs.map((log, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip
                      label={log.level.toUpperCase()}
                      color={getLevelColor(log.level)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                    {log.source && (
                      <Chip
                        label={log.source}
                        variant="outlined"
                        size="small"
                      />
                    )}
                    <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {log.message}
                    </Typography>
                    {log.data && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          추가 데이터:
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            bgcolor: 'grey.50', 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem',
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto'
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>

        {/* 로그 통계 */}
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            총 {logs.length}개 로그 중 {filteredLogs.length}개 표시
            {logs.length > 0 && (
              <>
                {' | '}
                DEBUG: {logs.filter(l => l.level === LogLevel.DEBUG).length}개
                {' | '}
                INFO: {logs.filter(l => l.level === LogLevel.INFO).length}개
                {' | '}
                WARN: {logs.filter(l => l.level === LogLevel.WARN).length}개
                {' | '}
                ERROR: {logs.filter(l => l.level === LogLevel.ERROR).length}개
              </>
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogViewer;
