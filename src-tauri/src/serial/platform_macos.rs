use serialport::{self, SerialPort};
use std::fs;
use std::os::unix::io::{FromRawFd, IntoRawFd};

pub fn create_pty_pair(label: &str) -> Result<crate::serial::PortEntry, String> {
    let (master, slave) = serialport::TTYPort::pair()
        .map_err(|e| format!("Failed to create PTY pair: {}", e))?;

    let slave_path = slave
        .name()
        .ok_or_else(|| "Could not determine slave PTY path".to_string())?;

    let raw_fd = master.into_raw_fd();
    let master_fd = unsafe { fs::File::from_raw_fd(raw_fd) };

    Ok(crate::serial::PortEntry {
        slave_path,
        master_fd,
        label: label.to_string(),
    })
}
