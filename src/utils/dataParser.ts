
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
 * Parses HRV (Heart Rate Variability) data
 * 
 * @param dataView DataView containing HRV data
 * @returns HRV value in milliseconds
 */
export const parseHrvData = (dataView: DataView): number => {
  // This implementation would depend on the specific format used by the ring
  // For now, we'll assume a simple implementation where the first 2 bytes are the HRV in ms
  return dataView.getUint16(0, true);
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
  // Basic implementation - would need to be adjusted based on actual ring data format
  const steps = dataView.getUint32(0, true);
  
  // If additional data is available
  let distance: number | undefined;
  let calories: number | undefined;
  
  if (dataView.byteLength >= 8) {
    distance = dataView.getUint32(4, true);
  }
  
  if (dataView.byteLength >= 12) {
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
  // This would need to be adjusted based on the actual format from the ring
  return {
    duration: dataView.getFloat32(0, true) / 3600, // Convert seconds to hours
    deep: dataView.getFloat32(4, true) / 3600,
    light: dataView.getFloat32(8, true) / 3600,
    rem: dataView.getFloat32(12, true) / 3600,
    awake: dataView.getFloat32(16, true) / 3600,
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
} => {
  const score = dataView.getUint8(0);
  
  // Determine stress level based on score
  let level: "low" | "medium" | "high";
  if (score < 30) {
    level = "low";
  } else if (score < 70) {
    level = "medium";
  } else {
    level = "high";
  }
  
  return { score, level };
};

/**
 * Parses temperature data from the ring
 * 
 * @param dataView DataView containing temperature data
 * @returns Temperature in Celsius
 */
export const parseTemperatureData = (dataView: DataView): number => {
  // Assuming temperature is stored as a float in Celsius
  return dataView.getFloat32(0, true);
};
