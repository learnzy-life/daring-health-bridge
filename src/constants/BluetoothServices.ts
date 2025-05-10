
// Smart Ring Bluetooth Service UUIDs
// Based on the ring manufacturer's SDK documentation

export const BLUETOOTH_SERVICES = {
  // Standard Bluetooth Services
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  BATTERY: '0000180f-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
  
  // Ring-specific services
  HRV_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  SLEEP_SERVICE: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  STEPS_SERVICE: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  STRESS_SERVICE: '6e400004-b5a3-f393-e0a9-e50e24dcca9e',
  TEMPERATURE_SERVICE: '6e400005-b5a3-f393-e0a9-e50e24dcca9e',
  BLOOD_OXYGEN_SERVICE: '6e400006-b5a3-f393-e0a9-e50e24dcca9e',
  ACTIVITY_SERVICE: '6e400007-b5a3-f393-e0a9-e50e24dcca9e',
  CONTROL_SERVICE: '6e400008-b5a3-f393-e0a9-e50e24dcca9e',
  
  // Alternative HRV service UUID - some rings use this format
  ALT_HRV_SERVICE: '0000180d-b5a3-f393-e0a9-e50e24dcca9e'
};

export const BLUETOOTH_CHARACTERISTICS = {
  // Standard characteristics
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  FIRMWARE_REVISION: '00002a26-0000-1000-8000-00805f9b34fb',
  HARDWARE_REVISION: '00002a27-0000-1000-8000-00805f9b34fb',
  
  // Ring-specific characteristics
  HRV_MEASUREMENT: '6e400101-b5a3-f393-e0a9-e50e24dcca9e',
  HRV_CONTROL: '6e400102-b5a3-f393-e0a9-e50e24dcca9e',
  SLEEP_DATA: '6e400201-b5a3-f393-e0a9-e50e24dcca9e',
  STEP_COUNT: '6e400301-b5a3-f393-e0a9-e50e24dcca9e',
  STRESS_LEVEL: '6e400401-b5a3-f393-e0a9-e50e24dcca9e',
  STRESS_CONTROL: '6e400402-b5a3-f393-e0a9-e50e24dcca9e',
  TEMPERATURE_MEASUREMENT: '6e400501-b5a3-f393-e0a9-e50e24dcca9e',
  BLOOD_OXYGEN_MEASUREMENT: '6e400601-b5a3-f393-e0a9-e50e24dcca9e',
  BLOOD_OXYGEN_CONTROL: '6e400602-b5a3-f393-e0a9-e50e24dcca9e',
  
  // Control characteristics
  MEASUREMENT_CONTROL: '6e400801-b5a3-f393-e0a9-e50e24dcca9e',
  SYNC_TIME: '6e400802-b5a3-f393-e0a9-e50e24dcca9e',
  USER_INFO: '6e400803-b5a3-f393-e0a9-e50e24dcca9e',
  DEVICE_SETTINGS: '6e400804-b5a3-f393-e0a9-e50e24dcca9e',
  
  // Alternative HRV characteristic - some rings use this
  ALT_HRV_MEASUREMENT: '00002a38-0000-1000-8000-00805f9b34fb'
};

// Command codes for controlling the ring functions
export const COMMAND_CODES = {
  // Heart Rate
  START_HEART_RATE: [0x01, 0x01],
  STOP_HEART_RATE: [0x01, 0x00],
  ENABLE_TIMING_HEART_RATE: [0x01, 0x02],
  DISABLE_TIMING_HEART_RATE: [0x01, 0x03],
  
  // HRV
  START_HRV: [0x02, 0x01],
  STOP_HRV: [0x02, 0x00],
  ENABLE_TIMING_HRV: [0x02, 0x02],
  DISABLE_TIMING_HRV: [0x02, 0x03],
  
  // Alternative HRV commands - some rings need these specific commands
  ALT_START_HRV: [0x10, 0x01],
  ALT_STOP_HRV: [0x10, 0x00],
  
  // Stress
  START_STRESS: [0x03, 0x01],
  STOP_STRESS: [0x03, 0x00],
  
  // Blood Oxygen
  START_BLOOD_OXYGEN: [0x04, 0x01],
  STOP_BLOOD_OXYGEN: [0x04, 0x00],
  ENABLE_TIMING_BLOOD_OXYGEN: [0x04, 0x02],
  DISABLE_TIMING_BLOOD_OXYGEN: [0x04, 0x03],
  
  // Sync
  SYNC_TIME_NOW: [0x05, 0x01],
  
  // Device Control
  DEVICE_RESET: [0x06, 0x01],
  DEVICE_SHUTDOWN: [0x06, 0x02]
};

// Service UUIDs needed for device scanning
export const SCAN_SERVICE_UUIDS = [
  'heart_rate',
  'battery_service',
  'device_information',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // HRV Service
  '6e400008-b5a3-f393-e0a9-e50e24dcca9e', // Control Service
  // Add all other possible ring services to increase detection chances
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  '6e400004-b5a3-f393-e0a9-e50e24dcca9e',
  '6e400005-b5a3-f393-e0a9-e50e24dcca9e',
  '6e400006-b5a3-f393-e0a9-e50e24dcca9e',
  '6e400007-b5a3-f393-e0a9-e50e24dcca9e',
  '0000180d-b5a3-f393-e0a9-e50e24dcca9e' // Alternative HRV Service
];
