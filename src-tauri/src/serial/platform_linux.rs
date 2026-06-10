use std::fs;
use std::os::unix::io::AsRawFd;

pub fn create_pty_pair(label: &str) -> Result<crate::serial::PortEntry, String> {
    let ends = nix::pty::openpty(None, None)
        .map_err(|e| format!("Failed to create PTY: {}", e))?;

    let slave_path = get_slave_path(ends.slave.as_raw_fd())?;

    let symlink_path = format!("/dev/ttyVARDUINO-{}", label);
    let _ = fs::remove_file(&symlink_path);
    std::os::unix::fs::symlink(&slave_path, &symlink_path)
        .map_err(|e| format!("Failed to create symlink: {}", e))?;

    let master_fd = fs::File::from(ends.master);

    Ok(crate::serial::PortEntry {
        slave_path: symlink_path,
        master_fd,
        label: label.to_string(),
    })
}

fn get_slave_path(fd: i32) -> Result<String, String> {
    let path = nix::pty::ptsname_r(unsafe { std::os::unix::io::BorrowedFd::borrow_raw(fd) })
        .map_err(|e| format!("ptsname_r failed: {}", e))?;
    Ok(path)
}
