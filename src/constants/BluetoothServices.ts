
// Smart Ring Bluetooth Service UUIDs
// Note: These are example UUIDs and should be replaced with the actual UUIDs from the ring's documentation

export const BLUETOOTH_SERVICES = {
  // Standard Bluetooth Services
  HEART_RATE: 'heart_rate',
  BATTERY: 'battery_service',
  DEVICE_INFO: 'device_information',
  
  // Ring-specific services (replace with actual UUIDs when available)
  HRV_SERVICE: '00000000-0000-0000-0000-000000000001',
  SLEEP_SERVICE: '00000000-0000-0000-0000-000000000002',
  STEPS_SERVICE: '00000000-0000-0000-0000-000000000003',
  STRESS_SERVICE: '00000000-0000-0000-0000-000000000004',
  TEMPERATURE_SERVICE: '00000000-0000-0000-0000-000000000005'
};

export const BLUETOOTH_CHARACTERISTICS = {
  // Standard characteristics
  HEART_RATE_MEASUREMENT: 'heart_rate_measurement',
  BATTERY_LEVEL: 'battery_level',
  FIRMWARE_REVISION: 'firmware_revision_string',
  HARDWARE_REVISION: 'hardware_revision_string',
  
  // Ring-specific characteristics (replace with actual UUIDs when available)
  HRV_MEASUREMENT: '00000000-0000-0000-0000-000000001001',
  SLEEP_DATA: '00000000-0000-0000-0000-000000001002',
  STEP_COUNT: '00000000-0000-0000-0000-000000001003',
  STRESS_LEVEL: '00000000-0000-0000-0000-000000001004',
  TEMPERATURE_MEASUREMENT: '00000000-0000-0000-0000-000000001005',
  
  // Control characteristics
  MEASUREMENT_CONTROL: '00000000-0000-0000-0000-000000002001',
  SYNC_TIME: '00000000-0000-0000-0000-000000002002',
  USER_INFO: '00000000-0000-0000-0000-000000002003'
};
