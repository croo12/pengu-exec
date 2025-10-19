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
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
} from "@mui/material";
import {
  Send as SendIcon,
  BugReport as BugIcon,
  AddTask as TaskIcon,
  Settings as SettingsIcon,
  BugReport as LogIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { useIssueStore, Issue } from "@/store/issueStore";
import SettingsDialog from "@/components/SettingsDialog";
import LogViewer from "@/components/LogViewer";
import TaskChainSelector from "@/components/TaskChainSelector";
import NodeExecutionResult from "@/components/NodeExecutionResult";
import SettingsService from "@/services/settingsService";
import TaskService from "@/services/task/TaskService";
import { logger } from "@/utils/logger";
import { NodeExecutionOutput } from "@/types";

const MainLayout: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState("create_issue_chain");
  const [nodeExecutionResult, setNodeExecutionResult] =
    useState<NodeExecutionOutput | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const { issues, createIssue, error, currentTaskProgress } = useIssueStore();

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    logger.info(
      "작업 실행 요청 시작",
      { inputText, selectedChain },
      "MainLayout"
    );
    setIsLoading(true);
    setLoadingStep("작업 실행 중...");
    setNodeExecutionResult(null);

    try {
      const taskService = TaskService.getInstance();
      const settingsService = new SettingsService();
      const settings = settingsService.getSettings();

      let result: any;

      switch (selectedChain) {
        case "create_issue_chain":
          setLoadingStep("AI 분석 중...");
          await createIssue(inputText);
          setSuccessMessage("이슈가 성공적으로 생성되었습니다!");
          break;

        case "create_issue_with_notification_chain":
          setLoadingStep("AI 분석 및 이슈 생성 중...");
          result = await taskService.createIssueWithNotification(
            inputText,
            settings
          );
          setSuccessMessage("이슈가 생성되고 알림이 전송되었습니다!");
          break;

        case "ai_analysis_only_chain":
          setLoadingStep("AI 분석 중...");
          result = await taskService.analyzeText(inputText, settings?.ai);
          setSuccessMessage("AI 분석이 완료되었습니다!");
          break;

        case "jira_create_only_chain":
          setLoadingStep("Jira 이슈 생성 중...");
          // 이 경우에는 이미 분석된 데이터가 필요하므로 예시로 처리
          setSuccessMessage(
            "Jira 이슈 생성 기능입니다. 먼저 AI 분석을 수행해주세요."
          );
          break;

        case "node_execution_chain":
          setLoadingStep("Node.js 코드 실행 중...");
          result = await taskService.executeNodeCode(inputText, {
            timeout: 30000,
            workingDirectory: "",
            environment: { NODE_ENV: "development" },
          });
          console.log("Node.js 실행 결과:", result);
          if (result?.data) {
            setNodeExecutionResult(result.data);
            setSuccessMessage("Node.js 코드가 성공적으로 실행되었습니다!");
          } else {
            console.error("Node.js 실행 실패:", result);
            setSuccessMessage(`Node.js 실행 실패: ${result?.error || '알 수 없는 오류'}`);
          }
          break;

        case "ai_analysis_with_node_execution_chain":
          setLoadingStep("AI 분석 및 Node.js 실행 중...");
          result = await taskService.analyzeAndExecuteNodeCode(
            inputText,
            settings?.ai,
            {
              timeout: 30000,
              workingDirectory: "",
              environment: { NODE_ENV: "development" },
            }
          );
          if (result?.data) {
            setNodeExecutionResult(result.data);
            setSuccessMessage("AI 분석 및 Node.js 실행이 완료되었습니다!");
          }
          break;

        default:
          throw new Error(`지원하지 않는 작업 유형: ${selectedChain}`);
      }

      setInputText("");
      setLoadingStep("");
      setTimeout(() => setSuccessMessage(""), 5000);
      logger.info("작업 실행 성공", { inputText, selectedChain }, "MainLayout");
    } catch (err) {
      setLoadingStep("");
      logger.error("작업 실행 실패", err, "MainLayout");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyMessage("클립보드에 복사되었습니다!");
        setTimeout(() => setCopyMessage(""), 2000);
      })
      .catch(() => {
        setCopyMessage("복사에 실패했습니다.");
        setTimeout(() => setCopyMessage(""), 2000);
      });
  };

  const getPlaceholderText = () => {
    switch (selectedChain) {
      case "node_execution_chain":
        return '예: console.log("Hello, World!");\nconsole.log("Current time:", new Date().toISOString());';
      case "ai_analysis_with_node_execution_chain":
        return "예: 사용자 입력을 분석해서 Node.js 코드를 생성해줘";
      case "ai_analysis_only_chain":
        return "예: 로그인 페이지에서 버그가 있어서 수정이 필요해요";
      case "jira_create_only_chain":
        return "이미 분석된 데이터로 Jira 이슈를 생성합니다";
      default:
        return "예: 로그인 페이지에서 버그가 있어서 수정이 필요해요";
    }
  };

  const getButtonText = () => {
    switch (selectedChain) {
      case "node_execution_chain":
        return "Node.js 실행";
      case "ai_analysis_with_node_execution_chain":
        return "AI 분석 + 실행";
      case "ai_analysis_only_chain":
        return "AI 분석";
      case "jira_create_only_chain":
        return "Jira 생성";
      case "create_issue_with_notification_chain":
        return "이슈 생성 + 알림";
      default:
        return "이슈 생성";
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        PenguExec - AI 작업 자동화
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ mb: 4 }}
      >
        다양한 작업 유형을 선택하고 자연어로 입력하면 AI가 분석하여 자동으로
        처리해드립니다.
      </Typography>

      {/* 작업 유형 선택 */}
      <Box sx={{ mb: 3 }}>
        <TaskChainSelector
          selectedChain={selectedChain}
          onChainChange={setSelectedChain}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* 입력 섹션 */}
        <Box sx={{ flex: { xs: 1, md: 2 } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedChain.includes("node")
                ? "코드 또는 요청사항 입력"
                : "요청사항 입력"}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={selectedChain.includes("node") ? 6 : 4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholderText()}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<LogIcon />}
                onClick={() => setLogViewerOpen(true)}
                sx={{ display: import.meta.env.DEV ? "inline-flex" : "none" }}
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
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} />
                  ) : selectedChain.includes("node") ? (
                    <CodeIcon />
                  ) : (
                    <SendIcon />
                  )
                }
                onClick={handleSubmit}
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? loadingStep || "실행 중..." : getButtonText()}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <BugIcon color="error" sx={{ mr: 1, fontSize: 20 }} />
                    <Chip label="버그" size="small" color="error" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    "로그인 버튼이 작동하지 않아요"
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
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

      {/* 태스크 진행 상황 표시 */}
      {currentTaskProgress.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              작업 진행 상황
            </Typography>
            <List>
              {currentTaskProgress.map((task, index) => (
                <ListItem key={task.taskId || index}>
                  <ListItemIcon>
                    {task.status === "completed" ? (
                      <CheckIcon color="success" />
                    ) : task.status === "failed" ? (
                      <ErrorIcon color="error" />
                    ) : task.status === "running" ? (
                      <CircularProgress size={20} />
                    ) : (
                      <PlayIcon color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={task.taskName}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {task.message ||
                            `${
                              task.status === "running"
                                ? "실행 중"
                                : task.status === "completed"
                                ? "완료"
                                : task.status === "failed"
                                ? "실패"
                                : "대기 중"
                            }`}
                        </Typography>
                        {task.status === "running" && (
                          <LinearProgress
                            variant="determinate"
                            value={task.progress || 0}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Node.js 실행 결과 표시 */}
      {nodeExecutionResult && (
        <NodeExecutionResult result={nodeExecutionResult} onCopy={handleCopy} />
      )}

      {/* 성공 메시지 표시 */}
      {successMessage && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        </Box>
      )}

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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Chip
                        label={issue.type}
                        color={
                          issue.type === "Bug"
                            ? "error"
                            : issue.type === "Story"
                            ? "success"
                            : "primary"
                        }
                        size="small"
                        sx={{ mr: 2 }}
                      />
                      <Chip
                        label={issue.priority}
                        color={
                          issue.priority === "Critical"
                            ? "error"
                            : issue.priority === "High"
                            ? "warning"
                            : "default"
                        }
                        size="small"
                        variant="outlined"
                        sx={{ mr: 2 }}
                      />
                      <Chip
                        label={issue.status}
                        color={
                          issue.status === "Done"
                            ? "success"
                            : issue.status === "In Progress"
                            ? "warning"
                            : "default"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    {issue.jiraKey && (
                      <Tooltip title="Jira에서 보기">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const settingsService = new SettingsService();
                            const settings = settingsService.getSettings();
                            if (settings?.jira.baseUrl) {
                              const jiraUrl = `${settings.jira.baseUrl}/browse/${issue.jiraKey}`;
                              window.open(jiraUrl, "_blank");
                            } else {
                              logger.warn(
                                "Jira 설정이 없어 링크를 열 수 없습니다",
                                null,
                                "MainLayout"
                              );
                            }
                          }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {issue.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {issue.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      생성일: {issue.createdAt.toLocaleString("ko-KR")}
                    </Typography>
                    {issue.jiraKey && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: 16, mr: 0.5 }}
                        />
                        <Typography variant="caption" color="success.main">
                          Jira: {issue.jiraKey}
                        </Typography>
                      </Box>
                    )}
                  </Box>
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
      <LogViewer open={logViewerOpen} onClose={() => setLogViewerOpen(false)} />

      {/* 복사 메시지 */}
      <Snackbar
        open={!!copyMessage}
        autoHideDuration={2000}
        onClose={() => setCopyMessage("")}
        message={copyMessage}
      />
    </Box>
  );
};

export default MainLayout;
