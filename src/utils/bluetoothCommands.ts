
import { COMMAND_CODES } from "@/constants/BluetoothServices";

/**
 * Utility functions for sending commands to the ring device
 */

/**
 * Creates a buffer to send commands to the ring
 * @param command The command array to send
 * @returns ArrayBuffer with the command
 */
export function createCommandBuffer(command: number[]): ArrayBuffer {
  const buffer = new Uint8Array(command);
  return buffer.buffer;
}

/**
 * Converts date to a buffer for time sync
 * @returns ArrayBuffer containing time data
 */
export function createTimeBuffer(): ArrayBuffer {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  
  const buffer = new Uint8Array([
    COMMAND_CODES.SYNC_TIME_NOW[0],
    COMMAND_CODES.SYNC_TIME_NOW[1],
    year & 0xFF,
    (year >> 8) & 0xFF,
    month,
    day,
    hour,
    minute,
    second
  ]);
  
  return buffer.buffer;
}

/**
 * Creates a buffer with user information for the ring
 * @param weight Weight in kg
 * @param height Height in cm
 * @param gender 0 for male, 1 for female
 * @param age Age in years
 * @param stepLength Step length in cm
 * @returns ArrayBuffer containing user information
 */
export function createUserInfoBuffer(
  weight: number, 
  height: number, 
  gender: 0 | 1, 
  age: number, 
  stepLength: number
): ArrayBuffer {
  // Convert weight to value expected by device (usually integer value in kg)
  const weightValue = Math.round(weight);
  
  const buffer = new Uint8Array([
    0x07, 0x01, // User info command
    weightValue,
    height, 
    gender,
    age,
    stepLength
  ]);
  
  return buffer.buffer;
}

/**
 * Creates a buffer for timing measurements (intervals)
 * @param commandType The command type (heart rate, blood oxygen)
 * @param interval Interval in minutes (will be multiplied by 5)
 * @returns ArrayBuffer with the command
 */
export function createTimingMeasurementBuffer(commandType: number[], interval: number): ArrayBuffer {
  const buffer = new Uint8Array([
    commandType[0],
    commandType[1], 
    interval
  ]);
  
  return buffer.buffer;
}

