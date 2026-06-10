pub mod serial;
pub mod commands;

use serial::SerialState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SerialState::new())
        .invoke_handler(tauri::generate_handler![
            commands::serial_cmd::create_virtual_port,
            commands::serial_cmd::destroy_virtual_port,
            commands::serial_cmd::list_virtual_ports,
            commands::serial_cmd::write_serial,
            commands::plugin_cmd::install_plugin,
            commands::plugin_cmd::uninstall_plugin,
            commands::plugin_cmd::list_plugins,
            commands::plugin_cmd::load_plugin_bundle,
            commands::circuit_cmd::save_circuit,
            commands::circuit_cmd::load_circuit,
            commands::circuit_cmd::show_save_dialog,
            commands::circuit_cmd::show_open_dialog,
        ])
        .setup(|_app| {
            let state = _app.state::<SerialState>();
            let mut manager = state.manager.lock().map_err(|e| e.to_string())?;
            if let Err(e) = manager.create_port("arduino-uno") {
                eprintln!("Failed to create default virtual port: {}", e);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
