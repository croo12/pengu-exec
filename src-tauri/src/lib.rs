use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

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

// AI 분석 명령어
#[tauri::command]
async fn analyze_with_ai(text: String, _config: AIConfig) -> Result<IssueAnalysis, String> {
    // TODO: 실제 AI API 호출 구현
    // 현재는 시뮬레이션
    
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    let analysis = IssueAnalysis {
        title: format!("AI 분석된 제목: {}", text.chars().take(50).collect::<String>()),
        description: format!("사용자 요청: {}\n\nAI가 분석하여 생성된 이슈입니다.", text),
        issue_type: if text.to_lowercase().contains("버그") { "Bug".to_string() } else { "Task".to_string() },
        priority: "Medium".to_string(),
        labels: vec!["ai-generated".to_string()],
    };
    
    Ok(analysis)
}

// Jira 이슈 생성 명령어
#[tauri::command]
async fn create_jira_issue(analysis: IssueAnalysis, config: JiraConfig) -> Result<JiraIssue, String> {
    // TODO: 실제 Jira API 호출 구현
    // 현재는 시뮬레이션
    
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
    
    let issue = JiraIssue {
        key: format!("{}-{}", config.project_key, chrono::Utc::now().timestamp()),
        summary: analysis.title,
        description: analysis.description,
        issue_type: analysis.issue_type,
        priority: analysis.priority,
        status: "To Do".to_string(),
    };
    
    Ok(issue)
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

// 기존 greet 명령어 (호환성을 위해 유지)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("안녕하세요, {}님! PenguExec에 오신 것을 환영합니다!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            analyze_with_ai,
            create_jira_issue,
            test_jira_connection,
            save_settings,
            load_settings,
            save_logs_to_file,
            get_log_files,
            read_log_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}