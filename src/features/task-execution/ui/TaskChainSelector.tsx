import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  BugReport as BugIcon,
  AddTask as TaskIcon,
  Code as CodeIcon,
  Psychology as AIIcon,
  Notifications as NotificationIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';

export interface TaskChain {
  id: string;
  name: string;
  description: string;
  tasks: TaskDefinition[];
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export interface TaskDefinition {
  taskId: string;
  taskType: string;
  description?: string;
  icon?: React.ReactNode;
}

const availableTaskChains: TaskChain[] = [
  {
    id: 'create_issue_chain',
    name: '이슈 생성',
    description: '자연어 입력을 AI로 분석하고 Jira 이슈를 생성합니다',
    icon: <BugIcon />,
    color: 'primary',
    tasks: [
      {
        taskId: 'ai_analysis',
        taskType: 'ai_analysis',
        description: 'AI 분석',
        icon: <AIIcon />,
      },
      {
        taskId: 'jira_create',
        taskType: 'jira_create',
        description: 'Jira 이슈 생성',
        icon: <BugIcon />,
      },
    ],
  },
  {
    id: 'create_issue_with_notification_chain',
    name: '이슈 생성 + 알림',
    description: '이슈를 생성한 후 알림을 전송합니다',
    icon: <NotificationIcon />,
    color: 'success',
    tasks: [
      {
        taskId: 'ai_analysis',
        taskType: 'ai_analysis',
        description: 'AI 분석',
        icon: <AIIcon />,
      },
      {
        taskId: 'jira_create',
        taskType: 'jira_create',
        description: 'Jira 이슈 생성',
        icon: <BugIcon />,
      },
      {
        taskId: 'notification',
        taskType: 'notification',
        description: '알림 전송',
        icon: <NotificationIcon />,
      },
    ],
  },
  {
    id: 'ai_analysis_only_chain',
    name: 'AI 분석만',
    description: '자연어를 AI로 분석만 수행합니다',
    icon: <AIIcon />,
    color: 'info',
    tasks: [
      {
        taskId: 'ai_analysis',
        taskType: 'ai_analysis',
        description: 'AI 분석',
        icon: <AIIcon />,
      },
    ],
  },
  {
    id: 'jira_create_only_chain',
    name: 'Jira 생성만',
    description: '이미 분석된 데이터로 Jira 이슈만 생성합니다',
    icon: <TaskIcon />,
    color: 'warning',
    tasks: [
      {
        taskId: 'jira_create',
        taskType: 'jira_create',
        description: 'Jira 이슈 생성',
        icon: <BugIcon />,
      },
    ],
  },
  {
    id: 'node_execution_chain',
    name: 'Node.js 실행',
    description: 'Node.js 코드를 실행하고 결과를 반환합니다',
    icon: <CodeIcon />,
    color: 'secondary',
    tasks: [
      {
        taskId: 'node_execution',
        taskType: 'node_execution',
        description: 'Node.js 코드 실행',
        icon: <CodeIcon />,
      },
    ],
  },
  {
    id: 'ai_analysis_with_node_execution_chain',
    name: 'AI 분석 + Node.js 실행',
    description: '자연어를 AI로 분석한 후 Node.js 코드를 실행합니다',
    icon: <PlayIcon />,
    color: 'error',
    tasks: [
      {
        taskId: 'ai_analysis',
        taskType: 'ai_analysis',
        description: 'AI 분석',
        icon: <AIIcon />,
      },
      {
        taskId: 'node_execution',
        taskType: 'node_execution',
        description: 'Node.js 코드 실행',
        icon: <CodeIcon />,
      },
    ],
  },
];

interface TaskChainSelectorProps {
  selectedChain: string;
  onChainChange: (chainId: string) => void;
}

const TaskChainSelector: React.FC<TaskChainSelectorProps> = ({
  selectedChain,
  onChainChange,
}) => {
  const selectedChainData = availableTaskChains.find(
    (chain) => chain.id === selectedChain
  );

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        작업 유형 선택
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>작업 유형</InputLabel>
        <Select
          value={selectedChain}
          onChange={(e) => onChainChange(e.target.value)}
          label="작업 유형"
        >
          {availableTaskChains.map((chain) => (
            <MenuItem key={chain.id} value={chain.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {chain.icon}
                <Box>
                  <Typography variant="body1">{chain.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {chain.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedChainData && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                icon={selectedChainData.icon as React.ReactElement}
                label={selectedChainData.name}
                color={selectedChainData.color}
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedChainData.description}
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              실행 단계:
            </Typography>
            <List dense>
              {selectedChainData.tasks.map((task, index) => (
                <ListItem key={task.taskId} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {task.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {index + 1}. {task.description}
                        </Typography>
                        <Chip
                          label={task.taskType}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};

export default TaskChainSelector;
