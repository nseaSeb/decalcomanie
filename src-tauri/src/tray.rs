use crate::captur;

use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};
use tauri_plugin_positioner::WindowExt;

pub fn init_macos_menu_extra<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "Fermer Décalcomanie", true, None::<&str>)?;
    let capture_i = MenuItem::with_id(app, "snap", "Capture viseur", true, None::<&str>)?;
    let captured_i = MenuItem::with_id(
        app,
        "snap_delay",
        "Capture viseur différé",
        true,
        None::<&str>,
    )?;
    let menu = Menu::with_items(app, &[&capture_i, &captured_i, &quit_i])?;

    let _ = TrayIconBuilder::with_id("menu_extra")
        .icon(Image::from_bytes(include_bytes!("../../src/assets/menubar.png")).unwrap())
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "snap" => {
                println!("Clic on capture");
                if let Ok(base64) = captur::capture_base64() {
                    let _ = app.emit("capture_done", base64);
                } else {
                    let _ = app.emit("capture_error", "Erreur de capture");
                }
            }
            "snap_delay" => {
                println!("Clic on capture with delay");
            }
            "quit" => {
                app.exit(0);
            }
            // @TODO: Add and handle more menu entries, like play, pause, open, ...
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            let app = tray.app_handle();

            tauri_plugin_positioner::on_tray_event(app.app_handle(), &event);

            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = app.get_webview_window("main") {
                    if !window.is_visible().unwrap_or(false) {
                        let _ =
                            window.move_window(tauri_plugin_positioner::Position::TrayBottomCenter);
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        let _ = window.hide();
                    }
                }
            }
        })
        .build(app);

    Ok(())
}
