// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::env;
use tauri::Manager;
use tauri_plugin_store::{StoreBuilder, Store};
mod captur;
mod tray;
mod store;
mod sellsy;

#[tauri::command]
fn greet() -> String {
    match env::current_dir() {
        Ok(path) => println!("Dossier courant : {}", path.display()),
        Err(e) => eprintln!("Erreur : {}", e),
    }
    format!("file:///Users/sebastienportrait/rust/template.png")
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            captur::capture_base64,
            captur::copy_image_to_clipboard,
            store::save_api_keys,
            store::get_api_key,
            store::make_api_request,
            sellsy::get_sellsy_token,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
        
                tray::init_macos_menu_extra(app.handle())?;
                // Make the Dock icon invisible
                // app.set_activation_policy(ActivationPolicy::Accessory);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    // decalcomanie_lib::run()
}
