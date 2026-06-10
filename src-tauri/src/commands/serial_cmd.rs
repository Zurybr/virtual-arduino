use serde::Serialize;
use tauri::State;

use crate::serial::SerialState;

#[derive(Serialize)]
pub struct PortInfo {
    path: String,
    label: String,
}

#[tauri::command]
pub fn create_virtual_port(label: String, state: State<'_, SerialState>) -> Result<String, String> {
    let mut manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager.create_port(&label)
}

#[tauri::command]
pub fn destroy_virtual_port(
    port_path: String,
    state: State<'_, SerialState>,
) -> Result<(), String> {
    let mut manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager.destroy_port(&port_path)
}

#[tauri::command]
pub fn list_virtual_ports(state: State<'_, SerialState>) -> Result<Vec<PortInfo>, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    let ports = manager
        .list_ports()
        .into_iter()
        .map(|(path, label)| PortInfo { path, label })
        .collect();
    Ok(ports)
}

#[tauri::command]
pub fn write_serial(
    port_path: String,
    data: Vec<u8>,
    state: State<'_, SerialState>,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager.write_to_port(&port_path, &data)
}
