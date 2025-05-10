/**
 * Data parsing utilities for smart ring data
 */

/**
 * Parses heart rate data according to the Bluetooth Heart Rate Profile specification
 * 
 * @param dataView DataView containing the heart rate data
 * @returns Parsed heart rate value and additional information
 */
export const parseHeartRateData = (dataView: DataView): {
  heartRate: number;
  contactDetected?: boolean;
  energyExpended?: number;
} => {
  // First byte contains flags
  const flags = dataView.getUint8(0);
  
  // Check format of heart rate value (bit 0)
  const format = flags & 0x01;
  
  // Check if sensor contact status is present (bit 1)
  const contactBit = flags & 0x02;
  const contactDetected = contactBit ? Boolean(flags & 0x04) : undefined;
  
  // Check if energy expended status is present (bit 3)
  const energyPresent = flags & 0x08;
  
  // Heart rate value starts at index 1
  let heartRate: number;
  let nextByteIndex = 1;
  
  if (format === 0) {
    // Heart Rate is in UINT8 format
    heartRate = dataView.getUint8(nextByteIndex++);
  } else {
    // Heart Rate is in UINT16 format
    heartRate = dataView.getUint16(nextByteIndex, true);
    nextByteIndex += 2;
  }
  
  // Parse energy expended if present
  let energyExpended: number | undefined;
  if (energyPresent) {
    energyExpended = dataView.getUint16(nextByteIndex, true);
  }
  
  return { heartRate, contactDetected, energyExpended };
};

/**
 * Parses HRV (Heart Rate Variability) data based on the smart ring format
 * 
 * @param dataView DataView containing HRV data
 * @returns Parsed HRV information
 */
export const parseHrvData = (dataView: DataView): {
  value: number;
  status: 'completed' | 'measuring' | 'error';
} => {
  console.log("Parsing HRV data:", Array.from(new Uint8Array(dataView.buffer)));
  
  try {
    // Try to detect the data format based on the content
    if (dataView.byteLength === 1) {
      // Some devices only send a status value
      const statusByte = dataView.getUint8(0);
      console.log("Single byte HRV data, status byte:", statusByte);
      return { 
        value: 0, 
        status: statusByte === 1 ? 'completed' : 'measuring' 
      };
    }
    
    // Standard format: first byte is status, next two are HRV value
    if (dataView.byteLength >= 3) {
      const statusByte = dataView.getUint8(0);
      
      let status: 'completed' | 'measuring' | 'error';
      switch (statusByte) {
        case 0x00:
          status = 'measuring';
          break;
        case 0x01:
          status = 'completed';
          break;
        default:
          status = 'error';
      }
      
      // Second and third bytes contain HRV value in ms
      const value = dataView.getUint16(1, true);
      console.log("Standard format HRV data:", { status, value });
      
      return { value, status };
    }
    
    // Alternative format: all bytes are the actual HRV value
    // Try to extract a meaningful value
    if (dataView.byteLength >= 2) {
      const value = dataView.getUint16(0, true);
      console.log("Alternative format HRV data, value:", value);
      return { 
        value, 
        status: 'completed' 
      };
    }
    
    // Fall back to measuring status with zero value if data format is unrecognized
    console.log("Unknown HRV data format");
    return { value: 0, status: 'measuring' };
    
  } catch (error) {
    console.error("Error parsing HRV data:", error);
    return { value: 0, status: 'error' };
  }
};

/**
 * Parses step count data from the ring
 * 
 * @param dataView DataView containing step data
 * @returns Step count information
 */
export const parseStepData = (dataView: DataView): {
  steps: number;
  distance?: number;
  calories?: number;
} => {
  // First 4 bytes contain step count
  const steps = dataView.getUint32(0, true);
  
  // If additional data is available
  let distance: number | undefined;
  let calories: number | undefined;
  
  if (dataView.byteLength >= 8) {
    // Next 4 bytes contain distance in meters
    distance = dataView.getUint32(4, true);
  }
  
  if (dataView.byteLength >= 12) {
    // Next 4 bytes contain calories
    calories = dataView.getUint32(8, true);
  }
  
  return { steps, distance, calories };
};

/**
 * Parses sleep data from the ring
 * 
 * @param dataView DataView containing sleep data
 * @returns Parsed sleep information
 */
export const parseSleepData = (dataView: DataView): {
  duration: number;  // in hours
  deep: number;      // in hours
  light: number;     // in hours
  rem: number;       // in hours
  awake: number;     // in hours
} => {
  // Convert raw values from minutes to hours
  return {
    duration: dataView.getUint32(0, true) / 60, 
    deep: dataView.getUint32(4, true) / 60,
    light: dataView.getUint32(8, true) / 60,
    rem: dataView.getUint32(12, true) / 60,
    awake: dataView.getUint32(16, true) / 60,
  };
};

/**
 * Parses stress score data from the ring
 * 
 * @param dataView DataView containing stress data
 * @returns Stress score and level
 */
export const parseStressData = (dataView: DataView): {
  score: number;
  level: "low" | "medium" | "high";
  status: 'completed' | 'measuring' | 'error';
} => {
  // First byte contains status
  const statusByte = dataView.getUint8(0);
  
  let status: 'completed' | 'measuring' | 'error';
  switch (statusByte) {
    case 0x00:
      status = 'measuring';
      break;
    case 0x01:
      status = 'completed';
      break;
    default:
      status = 'error';
  }
  
  // Second byte contains the stress score
  const score = dataView.getUint8(1);
  
  // Determine stress level based on score
  let level: "low" | "medium" | "high";
  if (score < 30) {
    level = "low";
  } else if (score < 70) {
    level = "medium";
  } else {
    level = "high";
  }
  
  return { score, level, status };
};

/**
 * Parses temperature data from the ring
 * 
 * @param dataView DataView containing temperature data
 * @returns Temperature in Celsius
 */
export const parseTemperatureData = (dataView: DataView): {
  temperature: number;
  status: 'completed' | 'measuring' | 'error';
} => {
  // First byte contains status
  const statusByte = dataView.getUint8(0);
  
  let status: 'completed' | 'measuring' | 'error';
  switch (statusByte) {
    case 0x00:
      status = 'measuring';
      break;
    case 0x01:
      status = 'completed';
      break;
    default:
      status = 'error';
  }
  
  // Temperature is stored as a float in Celsius
  // With the first byte being status, temperature starts at index 1
  const temperature = dataView.getFloat32(1, true);
  
  return { temperature, status };
};

/**
 * Parses blood oxygen data from the ring
 * 
 * @param dataView DataView containing blood oxygen data
 * @returns Blood oxygen percentage and status
 */
export const parseBloodOxygenData = (dataView: DataView): {
  percentage: number;
  status: 'completed' | 'measuring' | 'error';
} => {
  // First byte contains status
  const statusByte = dataView.getUint8(0);
  
  let status: 'completed' | 'measuring' | 'error';
  switch (statusByte) {
    case 0x00:
      status = 'measuring';
      break;
    case 0x01:
      status = 'completed';
      break;
    default:
      status = 'error';
  }
  
  // Second byte contains blood oxygen percentage
  const percentage = dataView.getUint8(1);
  
  return { percentage, status };
};
