use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use tokio::time::timeout as tokio_timeout;

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraConfig {
    pub base_url: String,
    pub email: String,
    pub api_token: String,
    pub project_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIConfig {
    pub api_key: String,
    pub model: String,
    pub temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IssueAnalysis {
    pub title: String,
    pub description: String,
    pub issue_type: String,
    pub priority: String,
    pub labels: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraIssue {
    pub key: String,
    pub summary: String,
    pub description: String,
    pub issue_type: String,
    pub priority: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NodeExecutionInput {
    pub code: String,
    pub timeout: Option<u64>,
    pub working_directory: String,
    pub environment: HashMap<String, String>,
    pub args: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NodeExecutionOutput {
    pub stdout: String,
    pub stderr: String,
    pub exitCode: i32,
    pub executionTime: u64,
    pub tempFilePath: Option<String>,
}

// AI 분석 명령어
#[tauri::command]
async fn analyze_with_ai(text: String, config: AIConfig) -> Result<IssueAnalysis, String> {
    let client = reqwest::Client::new();
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent", config.model);
    
    let prompt = format!(
        "다음 사용자 요청을 분석하여 Jira 이슈로 변환해주세요:\n\n\
        사용자 요청: {}\n\n\
        다음 JSON 형식으로 응답해주세요:\n\
        {{\n\
            \"title\": \"이슈 제목 (한국어, 50자 이내)\",\n\
            \"description\": \"상세 설명 (한국어, 사용자 요청을 바탕으로 구체적으로 작성)\",\n\
            \"issue_type\": \"Bug|Task|Story|Epic 중 하나\",\n\
            \"priority\": \"Low|Medium|High|Critical 중 하나\",\n\
            \"labels\": [\"관련 라벨1\", \"관련 라벨2\"]\n\
        }}\n\n\
        분석 기준:\n\
        - 버그 관련 키워드가 있으면 Bug 타입\n\
        - 새로운 기능 요청이면 Story 타입\n\
        - 일반적인 작업이면 Task 타입\n\
        - 큰 프로젝트나 여러 기능을 포함하면 Epic 타입\n\
        - 긴급하거나 중요한 내용이면 High/Critical 우선순위\n\
        - 일반적인 내용이면 Medium 우선순위\n\
        - 간단한 내용이면 Low 우선순위",
        text
    );
    
    let request_data = serde_json::json!({
        "contents": [
            {
                "parts": [
                    {
                        "text": format!("당신은 Jira 이슈 관리 전문가입니다. 사용자의 자연어 요청을 분석하여 적절한 Jira 이슈로 변환해주세요.\n\n{}", prompt)
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": config.temperature,
            "maxOutputTokens": 2000
        }
    });
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .query(&[("key", &config.api_key)])
        .json(&request_data)
        .send()
        .await
        .map_err(|e| format!("Gemini API 네트워크 오류: {}", e))?;
    
    if response.status().is_success() {
        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Gemini API 응답 파싱 오류: {}", e))?;

        println!("Gemini API 응답: {:?}", response_data);
        
        // 응답 구조 분석
        let candidates = &response_data["candidates"];
        if candidates.is_array() && !candidates.as_array().unwrap().is_empty() {
            let candidate = &candidates[0];
            let finish_reason = candidate["finishReason"].as_str().unwrap_or("");
            
            println!("Finish reason: {}", finish_reason);
            
            // finishReason이 MAX_TOKENS인 경우 처리
            if finish_reason == "MAX_TOKENS" {
                return Err("응답이 너무 길어서 잘렸습니다. 더 간단한 요청을 시도해주세요.".to_string());
            }
            
            // content에서 텍스트 추출
            if let Some(content_obj) = candidate["content"].as_object() {
                if let Some(parts) = content_obj["parts"].as_array() {
                    if !parts.is_empty() {
                        if let Some(text) = parts[0]["text"].as_str() {
                            // 코드 블록 제거 (```json ... ```)
                            let content = if text.starts_with("```json") && text.ends_with("```") {
                                // ```json과 ``` 제거
                                let start = text.find('\n').unwrap_or(0) + 1;
                                let end = text.rfind("```").unwrap_or(text.len());
                                &text[start..end]
                            } else if text.starts_with("```") && text.ends_with("```") {
                                // 일반 코드 블록 제거
                                let start = text.find('\n').unwrap_or(0) + 1;
                                let end = text.rfind("```").unwrap_or(text.len());
                                &text[start..end]
                            } else {
                                text
                            };
                            
                            println!("정리된 JSON: {}", content);
                            
                            // JSON 파싱 시도
                            let analysis: IssueAnalysis = serde_json::from_str(content)
                                .map_err(|e| format!("AI 응답 JSON 파싱 오류: {}. 응답 내용: {}", e, content))?;
                            
                            return Ok(analysis);
                        } else {
                            return Err("응답에서 텍스트를 찾을 수 없습니다.".to_string());
                        }
                    } else {
                        return Err("응답 parts가 비어있습니다.".to_string());
                    }
                } else {
                    return Err("응답 content 구조가 올바르지 않습니다.".to_string());
                }
            } else {
                return Err("응답 content가 없습니다.".to_string());
            }
        } else {
            return Err("응답 candidates가 없습니다.".to_string());
        }
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        
        println!("Gemini API 오류 ({}): {}", status, error_text);
        
        // 404 오류인 경우 모델 관련 안내 메시지 추가
        if status == 404 {
            Err(format!("Gemini API 모델 오류: '{}' 모델을 찾을 수 없습니다. 지원되는 모델: gemini-2.0-flash-exp, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-live-2.5-flash-preview, gemini-2.0-flash-live-001", config.model))
        } else {
            Err(format!("Gemini API 오류 ({}): {}", status, error_text))
        }
    }
}

// Jira 이슈 생성 명령어
#[tauri::command]
async fn create_jira_issue(analysis: IssueAnalysis, config: JiraConfig) -> Result<JiraIssue, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/rest/api/3/issue", config.base_url.trim_end_matches('/'));
    
    // Jira 이슈 생성 요청 데이터 구성
    let issue_data = serde_json::json!({
        "fields": {
            "project": {
                "key": config.project_key
            },
            "summary": analysis.title,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": analysis.description
                            }
                        ]
                    }
                ]
            },
            "issuetype": {
                "name": "버그"
            },
            "labels": analysis.labels
        }
    });
    
    let response = client
        .post(&url)
        .basic_auth(&config.email, Some(&config.api_token))
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .json(&issue_data)
        .send()
        .await
        .map_err(|e| format!("네트워크 오류: {}", e))?;
    
    if response.status().is_success() {
        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 오류: {}", e))?;
        
        let key = response_data["key"]
            .as_str()
            .ok_or("응답에서 이슈 키를 찾을 수 없습니다")?
            .to_string();
        
        // 생성된 이슈의 상세 정보 조회
        let issue_detail = get_jira_issue_detail(&client, &config, &key).await?;
        
        Ok(issue_detail)
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        
        println!("Jira API 오류 ({}): {}", status, error_text);
        Err(format!("Jira API 오류 ({}): {}", status, error_text))
    }
}

// Jira 이슈 상세 정보 조회
async fn get_jira_issue_detail(client: &reqwest::Client, config: &JiraConfig, issue_key: &str) -> Result<JiraIssue, String> {
    let url = format!("{}/rest/api/3/issue/{}", config.base_url.trim_end_matches('/'), issue_key);
    
    let response = client
        .get(&url)
        .basic_auth(&config.email, Some(&config.api_token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("네트워크 오류: {}", e))?;
    
    if response.status().is_success() {
        let issue_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 오류: {}", e))?;
        
        let fields = &issue_data["fields"];
        
        let summary = fields["summary"]
            .as_str()
            .unwrap_or("")
            .to_string();
        
        let description = fields["description"]
            .as_object()
            .and_then(|desc| desc["content"].as_array())
            .and_then(|content| content.first())
            .and_then(|para| para["content"].as_array())
            .and_then(|content| content.first())
            .and_then(|text| text["text"].as_str())
            .unwrap_or("")
            .to_string();
        
        let issue_type = fields["issuetype"]["name"]
            .as_str()
            .unwrap_or("Task")
            .to_string();
        
        let priority = fields["priority"]["name"]
            .as_str()
            .unwrap_or("Medium")
            .to_string();
        
        let status = fields["status"]["name"]
            .as_str()
            .unwrap_or("To Do")
            .to_string();
        
        Ok(JiraIssue {
            key: issue_key.to_string(),
            summary,
            description,
            issue_type,
            priority,
            status,
        })
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        Err(format!("이슈 상세 조회 실패 ({}): {}", status, error_text))
    }
}

// Jira 연결 테스트 명령어
#[tauri::command]
async fn test_jira_connection(config: JiraConfig) -> Result<bool, String> {
    // 실제 Jira API 연결 테스트
    let client = reqwest::Client::new();
    let url = format!("{}/rest/api/3/myself", config.base_url.trim_end_matches('/'));
    
    let response = client
        .get(&url)
        .basic_auth(&config.email, Some(&config.api_token))
        .header("Accept", "application/json").send().await.map_err(|e| format!("네트워크 오류: {}", e))?;
    
    if response.status().is_success() {
        let _user_info: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 오류: {}", e))?;
        Ok(true)
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();

        println!("Jira API 오류 ({}): {}", status, error_text);
        Err(format!("Jira API 오류 ({}): {}", status, error_text))
    }
}

// 설정 저장 명령어
#[tauri::command]
async fn save_settings(settings: HashMap<String, serde_json::Value>) -> Result<(), String> {
    // TODO: 실제 설정 저장 구현 (파일 시스템 또는 데이터베이스)
    println!("설정 저장: {:?}", settings);
    Ok(())
}

// 설정 로드 명령어
#[tauri::command]
async fn load_settings() -> Result<HashMap<String, serde_json::Value>, String> {
    // TODO: 실제 설정 로드 구현
    let mut settings = HashMap::new();
    settings.insert("theme".to_string(), serde_json::Value::String("light".to_string()));
    settings.insert("language".to_string(), serde_json::Value::String("ko".to_string()));
    
    Ok(settings)
}

// 로그 파일 저장 명령어
#[tauri::command]
async fn save_logs_to_file(logs: String) -> Result<String, String> {
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let filename = format!("penguexec_logs_{}.json", timestamp);
    
    // 로그 디렉토리 생성
    let log_dir = "logs";
    if !Path::new(log_dir).exists() {
        fs::create_dir_all(log_dir).map_err(|e| format!("로그 디렉토리 생성 실패: {}", e))?;
    }
    
    let filepath = Path::new(log_dir).join(&filename);
    
    // 로그 파일 저장
    fs::write(&filepath, logs).map_err(|e| format!("로그 파일 저장 실패: {}", e))?;
    
    Ok(format!("로그가 저장되었습니다: {:?}", filepath))
}

// 로그 파일 목록 조회 명령어
#[tauri::command]
async fn get_log_files() -> Result<Vec<String>, String> {
    let log_dir = "logs";
    if !Path::new(log_dir).exists() {
        return Ok(vec![]);
    }
    
    let mut files = Vec::new();
    let entries = fs::read_dir(log_dir).map_err(|e| format!("로그 디렉토리 읽기 실패: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("디렉토리 항목 읽기 실패: {}", e))?;
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                files.push(filename.to_string());
            }
        }
    }
    
    files.sort_by(|a, b| b.cmp(a)); // 최신 파일부터 정렬
    Ok(files)
}

// 로그 파일 내용 읽기 명령어
#[tauri::command]
async fn read_log_file(filename: String) -> Result<String, String> {
    let log_dir = "logs";
    let filepath = Path::new(log_dir).join(&filename);
    
    if !filepath.exists() {
        return Err("파일을 찾을 수 없습니다.".to_string());
    }
    
    let content = fs::read_to_string(&filepath).map_err(|e| format!("파일 읽기 실패: {}", e))?;
    Ok(content)
}

// Jira 프로젝트의 이슈 타입 조회 명령어
#[tauri::command]
async fn get_jira_issue_types(config: JiraConfig) -> Result<Vec<serde_json::Value>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/rest/api/3/project/{}/statuses", config.base_url.trim_end_matches('/'), config.project_key);
    
    let response = client
        .get(&url)
        .basic_auth(&config.email, Some(&config.api_token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("네트워크 오류: {}", e))?;
    
    if response.status().is_success() {
        let issue_types: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 오류: {}", e))?;
        
        Ok(issue_types)
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        Err(format!("Jira API 오류 ({}): {}", status, error_text))
    }
}

// Jira 프로젝트 메타데이터 조회 명령어
#[tauri::command]
async fn get_jira_project_metadata(config: JiraConfig) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/rest/api/3/project/{}/metadata", config.base_url.trim_end_matches('/'), config.project_key);
    
    let response = client
        .get(&url)
        .basic_auth(&config.email, Some(&config.api_token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("네트워크 오류: {}", e))?;
    
    if response.status().is_success() {
        let metadata: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 오류: {}", e))?;
        
        Ok(metadata)
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        Err(format!("Jira API 오류 ({}): {}", status, error_text))
    }
}

// Node.js 코드 실행 명령어
#[tauri::command]
async fn execute_node_code(
    code: String,
    timeout: Option<u64>,
    working_directory: String,
    environment: HashMap<String, String>,
    args: Vec<String>,
) -> Result<NodeExecutionOutput, String> {
    let start_time = Instant::now();

    // 입력 검증
    if code.trim().is_empty() {
        return Err("실행할 코드가 제공되지 않았습니다".to_string());
    }

    // 코드 길이 제한 (1MB)
    const MAX_CODE_LENGTH: usize = 1024 * 1024;
    if code.len() > MAX_CODE_LENGTH {
        return Err(format!("코드가 너무 깁니다. 최대 {}바이트까지 허용됩니다", MAX_CODE_LENGTH));
    }

    // 타임아웃 검증
    let timeout_duration = timeout.unwrap_or(30000);
    if timeout_duration < 1000 || timeout_duration > 300000 {
        return Err("타임아웃은 1초에서 300초 사이여야 합니다".to_string());
    }

    // 임시 파일 생성
    let temp_dir = std::env::temp_dir();
    let temp_filename = format!("pengu_exec_{}_{}.js", 
        start_time.elapsed().as_millis(),
        rand::random::<u32>()
    );
    let temp_file = temp_dir.join(&temp_filename);
    let temp_file_path = temp_file.to_string_lossy().to_string();

    // 코드를 임시 파일에 저장
    fs::write(&temp_file, &code)
        .map_err(|e| format!("임시 파일 생성 실패: {}", e))?;

    // Node.js 프로세스 실행
    let mut cmd = Command::new("node");
    cmd.arg(&temp_file);
    
    // 추가 인수 추가
    for arg in &args {
        cmd.arg(arg);
    }

    // 작업 디렉토리 설정
    if !working_directory.is_empty() {
        cmd.current_dir(&working_directory);
    }

    // 환경 변수 설정
    for (key, value) in &environment {
        cmd.env(key, value);
    }

    // 표준 입출력 설정
    cmd.stdin(Stdio::null())
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    // 프로세스 실행 및 타임아웃 처리
    let result = tokio_timeout(
        Duration::from_millis(timeout_duration),
        tokio::process::Command::from(cmd).output()
    ).await;

    let execution_time = start_time.elapsed().as_millis() as u64;

    // 임시 파일 정리
    if let Err(e) = fs::remove_file(&temp_file) {
        eprintln!("임시 파일 정리 실패: {}", e);
    }

    match result {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let exit_code = output.status.code().unwrap_or(-1);

            Ok(NodeExecutionOutput {
                stdout: stdout.trim().to_string(),
                stderr: stderr.trim().to_string(),
                exitCode: exit_code,
                executionTime: execution_time,
                tempFilePath: Some(temp_file_path),
            })
        }
        Ok(Err(e)) => {
            Err(format!("프로세스 실행 오류: {}", e))
        }
        Err(_) => {
            Err(format!("코드 실행이 {}ms 타임아웃되었습니다", timeout_duration))
        }
    }
}

// 기존 greet 명령어 (호환성을 위해 유지)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("안녕하세요, {}님! PenguExec에 오신 것을 환영합니다!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            analyze_with_ai,
            create_jira_issue,
            test_jira_connection,
            get_jira_issue_types,
            get_jira_project_metadata,
            save_settings,
            load_settings,
            save_logs_to_file,
            get_log_files,
            read_log_file,
            execute_node_code
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}