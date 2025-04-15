use arboard;
use base64::engine::general_purpose;
use base64::Engine as _;
use fs_extra::dir;
use image::{DynamicImage, ImageOutputFormat, RgbaImage};
use std::io::Cursor;
use std::time::Instant;
use tauri::command;
use xcap::Monitor;
use xcap::Window;
fn normalized(filename: String) -> String {
    filename.replace(['|', '\\', ':', '/'], "")
}

// pub fn capture() {
//     let start = Instant::now();
//     let monitors = Monitor::all().unwrap();

//     dir::create_all("target/monitors", true).unwrap();

//     for monitor in monitors {
//         let image = monitor.capture_image().unwrap();

//     image.save("../../template.png").unwrap();
//     }

//     println!("Délai: {:?}", start.elapsed());
// }
#[tauri::command]
pub fn copy_text_to_clipboard(link: String) -> Result<(), String> {
    use arboard::Clipboard;

    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Erreur initialisation presse-papier: {}", e))?;

    clipboard
        .set_text(link)
        .map_err(|e| format!("Erreur copie lien texte: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn copy_image_to_clipboard(base64_data: String) -> Result<(), String> {
    use arboard::Clipboard;
    use image::load_from_memory;

    // Extraire la partie base64 après la virgule (pour les data URLs)
    let clean_base64 = base64_data.split(',').nth(1).unwrap_or(&base64_data);

    // Décoder le base64
    let bytes =
        base64::decode(clean_base64).map_err(|e| format!("Erreur de décodage base64: {}", e))?;

    // Charger l'image
    let img = load_from_memory(&bytes).map_err(|e| format!("Erreur chargement image: {}", e))?;

    // Convertir en ImageData pour arboard
    let img_data = arboard::ImageData {
        width: img.width() as usize,
        height: img.height() as usize,
        bytes: img.to_rgba8().into_raw().into(),
    };

    // Copier dans le presse-papier
    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Erreur initialisation presse-papier: {}", e))?;

    clipboard
        .set_image(img_data)
        .map_err(|e| format!("Erreur copie image: {}", e))?;

    Ok(())
}


// pub fn capture_base64() -> Result<Vec<String>, String> {
//     let start = Instant::now();
//     let monitors = Monitor::all().map_err(|e| e.to_string())?;
//     let mut base64_images = Vec::new();

//     for monitor in monitors {
//         let xcap_image = monitor.capture_image().map_err(|e| e.to_string())?;

//         // Conversion entre les deux types d'image
//         let image_buffer: RgbaImage = image::ImageBuffer::from_raw(
//             xcap_image.width(),
//             xcap_image.height(),
//             xcap_image.into_raw(),
//         )
//         .ok_or("Échec de conversion d'image")?;

//         let dyn_image = DynamicImage::ImageRgba8(image_buffer);
//         let mut buffer = Cursor::new(Vec::new());

//         dyn_image
//             .write_to(&mut buffer, ImageOutputFormat::Png)
//             .map_err(|e| e.to_string())?;

//         let base64_str = general_purpose::STANDARD.encode(buffer.get_ref());
//         base64_images.push(format!("data:image/png;base64,{}", base64_str));
//     }

//     println!("Délai: {:?}", start.elapsed());
//     Ok(base64_images)
// }
#[command]
pub fn capture_base64() -> Result<String, String> {
    let start = Instant::now();
    // monitors_images();
    let monitor = Monitor::all()
        .map_err(|e| e.to_string())?
        .into_iter()
        .next()
        .ok_or("Aucun moniteur trouvé")?;

    //let xcap_image = monitor.capture_image().map_err(|e| e.to_string())?;
    let xcap_image = monitor.capture_image().unwrap();
    

    // Conversion entre les deux types d'image
    let image_buffer: RgbaImage = image::ImageBuffer::from_raw(
        xcap_image.width(),
        xcap_image.height(),
        xcap_image.into_raw(),
    )
    .ok_or("Échec de conversion d'image")?;

    let dyn_image = DynamicImage::ImageRgba8(image_buffer);
    let mut buffer = Cursor::new(Vec::new());

    dyn_image
        .write_to(&mut buffer, ImageOutputFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64_str = general_purpose::STANDARD.encode(buffer.get_ref());
    println!("Délai: {:?}", start.elapsed());
    Ok(format!("data:image/png;base64,{}", base64_str))
}

// fn monitors_images() {
//     let start = Instant::now();
//     let windows = Window::all().unwrap();

//     dir::create_all("target/windows", true).unwrap();

//     let mut i = 0;
//     for window in windows {
//         // 最小化的窗口不能截屏
//         if window.is_minimized().unwrap() {
//             continue;
//         }

//         println!(
//             "Window: {:?} {:?} {:?}",
//             window.title().unwrap(),
//             (
//                 window.x().unwrap(),
//                 window.y().unwrap(),
//                 window.width().unwrap(),
//                 window.height().unwrap()
//             ),
//             (
//                 window.is_minimized().unwrap(),
//                 window.is_maximized().unwrap()
//             )
//         );

//         let image = window.capture_image().unwrap();
//         image
//             .save(format!(
//                 "target/windows/window-{}-{}.png",
//                 i,
//                 normalized(&window.title().unwrap())
//             ))
//             .unwrap();

//         i += 1;
//     }

//     println!("运行耗时: {:?}", start.elapsed());
// }