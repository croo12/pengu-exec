import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Code as CodeIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Terminal as TerminalIcon,
  BugReport as BugIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { NodeExecutionOutput } from "@/entities/task";

interface NodeExecutionResultProps {
  result: NodeExecutionOutput;
  onCopy?: (text: string) => void;
}

const NodeExecutionResult: React.FC<NodeExecutionResultProps> = ({
  result,
  onCopy,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [stdoutExpanded, setStdoutExpanded] = useState(true);
  const [stderrExpanded, setStderrExpanded] = useState(false);

  const isSuccess = result.exitCode === 0;
  const executionTimeSeconds = (result.executionTime / 1000).toFixed(2);

  const handleCopy = (text: string) => {
    if (onCopy) {
      onCopy(text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CodeIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="h3">
          Node.js 실행 결과
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip
            icon={isSuccess ? <SuccessIcon /> : <ErrorIcon />}
            label={isSuccess ? '성공' : '실패'}
            color={isSuccess ? 'success' : 'error'}
            size="small"
          />
          <Chip
            icon={<TimeIcon />}
            label={`${executionTimeSeconds}s`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Exit Code: ${result.exitCode}`}
            variant="outlined"
            size="small"
            color={isSuccess ? 'default' : 'error'}
          />
        </Box>
      </Box>

      {/* 실행 정보 요약 */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <List dense>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <TerminalIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="실행 시간"
                secondary={`${executionTimeSeconds}초`}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <BugIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="종료 코드"
                secondary={result.exitCode}
              />
            </ListItem>
            {result.tempFilePath && (
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="임시 파일"
                  secondary={result.tempFilePath}
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* stdout 결과 */}
      {result.stdout && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <TerminalIcon sx={{ mr: 1, fontSize: 20 }} />
              표준 출력 (stdout)
            </Typography>
            <Box>
              <Tooltip title="복사">
                <IconButton
                  size="small"
                  onClick={() => handleCopy(result.stdout)}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => setStdoutExpanded(!stdoutExpanded)}
              >
                {stdoutExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={stdoutExpanded}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#f5f5f5',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {result.stdout}
            </Paper>
          </Collapse>
        </Box>
      )}

      {/* stderr 결과 */}
      {result.stderr && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <ErrorIcon sx={{ mr: 1, fontSize: 20 }} />
              표준 오류 (stderr)
            </Typography>
            <Box>
              <Tooltip title="복사">
                <IconButton
                  size="small"
                  onClick={() => handleCopy(result.stderr)}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => setStderrExpanded(!stderrExpanded)}
              >
                {stderrExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={stderrExpanded}>
            <Alert severity="warning" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {result.stderr}
            </Alert>
          </Collapse>
        </Box>
      )}

      {/* 전체 결과 접기/펼치기 */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          <Typography variant="body2" sx={{ ml: 1 }}>
            {expanded ? '간단히 보기' : '상세 보기'}
          </Typography>
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            전체 실행 정보:
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: '#f9f9f9',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Paper>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default NodeExecutionResult;
