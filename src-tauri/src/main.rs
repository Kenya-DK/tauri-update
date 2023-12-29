// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use handler::MonitorHandler;
use serde_json::Value;
use std::sync::{Arc, Mutex};
use tauri::{async_runtime::block_on, App, Manager};
mod handler;
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
async fn get_msg(device_id: &str, secret: &str) -> Result<Value, String> {
    let response2: Value = reqwest::get(format!(
        "https://api.pushover.net/1/messages.json?secret={}&device_id={}",
        secret, device_id
    ))
    .await
    .map_err(|e| {
        eprintln!("failed to send request: {}", e);
        format!("failed to send request: {}", e)
    })?
    .json()
    .await
    .map_err(|e| {
        eprintln!("failed to send request: {}", e);
        format!("failed to send request: {}", e)
    })?;
    Ok(response2)
}

#[tauri::command]
fn show_notification(
    title: String,
    message: String,
    icon: Option<String>,
    sound: Option<String>,
    mh: tauri::State<'_, Arc<std::sync::Mutex<MonitorHandler>>>,
) {
    let mh = mh.lock().unwrap();
    mh.show_notification(
        &title,
        &message,
        Some("https://i.imgur.com/UggEVVI.jpeg"),
        sound.as_deref(),
    );
}

async fn setup_async(app: &mut App) -> Result<(), String> {
    // create and manage PriceScraper state
    let monitor_handler_arc: Arc<Mutex<MonitorHandler>> =
        Arc::new(Mutex::new(MonitorHandler::new(app.handle().clone())));
    app.manage(monitor_handler_arc.clone());

    Ok(())
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
        .setup(move |app| {
            // create and manage DatabaseClient state
            match block_on(setup_async(app)) {
                Ok(_) => {}
                Err(e) => {}
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_msg, show_notification])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
