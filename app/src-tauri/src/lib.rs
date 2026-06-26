use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use serde::Deserialize;

#[derive(Deserialize)]
struct LogEntry {
    timestamp: String,
    level: String,
    message: String,
}

fn get_logs_dir() -> PathBuf {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    // When run via start.bat -> cd app/ -> cwd = project-root/app/
    // We want logs/ at project root, so go up one level
    cwd.parent()
        .map(|p| p.join("logs"))
        .unwrap_or_else(|| cwd.join("logs"))
}

#[tauri::command]
fn append_logs(entries: Vec<LogEntry>) -> Result<(), String> {
    let logs_dir = get_logs_dir();
    fs::create_dir_all(&logs_dir).map_err(|e| e.to_string())?;

    if entries.is_empty() {
        return Ok(());
    }

    let filename = format!("app-{}.log", &entries[0].timestamp[..10]);
    let path = logs_dir.join(&filename);
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;

    for entry in &entries {
        let line = format!(
            "[{}] [{}] {}\n",
            entry.timestamp, entry.level, entry.message
        );
        file.write_all(line.as_bytes())
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_logs_path() -> Result<String, String> {
    Ok(get_logs_dir().to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![append_logs, get_logs_path])
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
