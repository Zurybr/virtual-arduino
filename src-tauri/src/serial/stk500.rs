use std::io::Read;

const STK_OK: u8 = 0x10;
const STK_INSYNC: u8 = 0x14;
const STK_CRC_EOP: u8 = 0x20;

const CMD_STK_GET_SYNC: u8 = 0x30;
const CMD_STK_READ_SIGN: u8 = 0x75;
const CMD_STK_ENTER_PROGMODE: u8 = 0x50;
const CMD_STK_LEAVE_PROGMODE: u8 = 0x51;
const CMD_STK_LOAD_ADDRESS: u8 = 0x55;
const CMD_STK_PROG_PAGE: u8 = 0x64;

const ATMEGA328P_SIGNATURE: [u8; 3] = [0x1E, 0x95, 0x0F];

pub struct Stk500Handler {
    flash_data: Vec<u8>,
    current_address: u16,
    in_progmode: bool,
}

impl Stk500Handler {
    pub fn new() -> Self {
        Self {
            flash_data: Vec::new(),
            current_address: 0,
            in_progmode: false,
        }
    }

    pub fn process_byte(&mut self, byte: u8) -> Option<Stk500Response> {
        match byte {
            CMD_STK_GET_SYNC => Some(Stk500Response::Sync),
            CMD_STK_READ_SIGN => Some(Stk500Response::ReadSign),
            CMD_STK_ENTER_PROGMODE => {
                self.in_progmode = true;
                Some(Stk500Response::EnterProgmode)
            }
            CMD_STK_LEAVE_PROGMODE => {
                self.in_progmode = false;
                let flash = std::mem::take(&mut self.flash_data);
                Some(Stk500Response::LeaveProgmode(flash))
            }
            CMD_STK_LOAD_ADDRESS => Some(Stk500Response::LoadAddress),
            CMD_STK_PROG_PAGE => Some(Stk500Response::ProgPage),
            _ => None,
        }
    }

    pub fn set_address(&mut self, addr: u16) {
        self.current_address = addr;
    }

    pub fn write_page(&mut self, data: &[u8]) {
        let start = (self.current_address as usize) * 2;
        let end = start + data.len();
        if end > self.flash_data.len() {
            self.flash_data.resize(end, 0);
        }
        self.flash_data[start..end].copy_from_slice(data);
    }
}

pub enum Stk500Response {
    Sync,
    ReadSign,
    EnterProgmode,
    LeaveProgmode(Vec<u8>),
    LoadAddress,
    ProgPage,
}

impl Stk500Response {
    pub fn to_bytes(&self) -> Vec<u8> {
        match self {
            Stk500Response::Sync => vec![STK_INSYNC, STK_OK],
            Stk500Response::ReadSign => vec![
                STK_INSYNC,
                ATMEGA328P_SIGNATURE[0],
                ATMEGA328P_SIGNATURE[1],
                ATMEGA328P_SIGNATURE[2],
                STK_OK,
            ],
            Stk500Response::EnterProgmode => vec![STK_INSYNC, STK_OK],
            Stk500Response::LeaveProgmode(_) => vec![STK_INSYNC, STK_OK],
            Stk500Response::LoadAddress => vec![STK_INSYNC, STK_OK],
            Stk500Response::ProgPage => vec![STK_INSYNC, STK_OK],
        }
    }

    pub fn flash_data(&self) -> Option<&Vec<u8>> {
        match self {
            Stk500Response::LeaveProgmode(data) => Some(data),
            _ => None,
        }
    }
}
