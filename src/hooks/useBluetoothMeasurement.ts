import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { BLUETOOTH_SERVICES, BLUETOOTH_CHARACTERISTICS, COMMAND_CODES } from '@/constants/BluetoothServices';
import { createCommandBuffer, createTimeBuffer, createUserInfoBuffer } from '@/utils/bluetoothCommands';
import { parseHeartRateData, parseHrvData, parseStressData, parseBloodOxygenData } from '@/utils/dataParser';

interface MeasurementState {
  heartRate: boolean;
  hrv: boolean;
  stress: boolean;
  bloodOxygen: boolean;
  [key: string]: boolean; // Add index signature to allow string indexing
}

export const useBluetoothMeasurement = (device: BluetoothDevice | null, isConnected: boolean) => {
  const [isMeasuring, setIsMeasuring] = useState<MeasurementState>({
    heartRate: false,
    hrv: false,
    stress: false,
    bloodOxygen: false
  });
  
  const [notificationCharacteristics, setNotificationCharacteristics] = useState<{
    [key: string]: BluetoothRemoteGATTCharacteristic | null
  }>({
    heartRate: null,
    hrv: null,
    stress: null,
    bloodOxygen: null
  });
  
  /**
   * Sync time with the device
   */
  const syncTime = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const timeCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.SYNC_TIME);
      
      const timeBuffer = createTimeBuffer();
      await timeCharacteristic.writeValue(timeBuffer);
      
      toast.success("Time synchronized with device");
      return true;
    } catch (error) {
      console.error("Failed to sync time:", error);
      toast.error("Failed to sync time with device");
      return false;
    }
  }, [device]);
  
  /**
   * Send user info to the device
   */
  const sendUserInfo = useCallback(async (
    weight: number,
    height: number,
    gender: 0 | 1,
    age: number,
    stepLength: number
  ) => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const userInfoCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.USER_INFO);
      
      const userInfoBuffer = createUserInfoBuffer(weight, height, gender, age, stepLength);
      await userInfoCharacteristic.writeValue(userInfoBuffer);
      
      toast.success("User info sent to device");
      return true;
    } catch (error) {
      console.error("Failed to send user info:", error);
      toast.error("Failed to send user info");
      return false;
    }
  }, [device]);
  
  /**
   * Start heart rate measurement
   */
  const startHeartRateMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // First, try to set up notifications for heart rate
      const heartRateService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.HEART_RATE);
      const heartRateCharacteristic = await heartRateService.getCharacteristic(
        BLUETOOTH_CHARACTERISTICS.HEART_RATE_MEASUREMENT
      );
      
      // Enable notifications
      await heartRateCharacteristic.startNotifications();
      
      // Store the characteristic for later use
      setNotificationCharacteristics(prev => ({
        ...prev,
        heartRate: heartRateCharacteristic
      }));
      
      // Set up notification handler
      heartRateCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        // Cast EventTarget to BluetoothRemoteGATTCharacteristic via unknown
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        if (target && target.value) {
          const { heartRate } = parseHeartRateData(target.value);
          
          // Dispatch event with real data
          const heartRateEvent = new CustomEvent('healthDataUpdate', {
            detail: {
              type: 'heartRate',
              data: {
                current: heartRate,
                timestamp: new Date().toISOString(),
                isReal: true
              }
            }
          });
          window.dispatchEvent(heartRateEvent);
        }
      });
      
      // Now send command to start heart rate measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.START_HEART_RATE);
      await controlCharacteristic.writeValue(commandBuffer);
      
      setIsMeasuring(prev => ({ ...prev, heartRate: true }));
      toast.success("Heart rate measurement started");
      return true;
    } catch (error) {
      console.error("Failed to start heart rate measurement:", error);
      toast.error("Failed to start heart rate measurement");
      return false;
    }
  }, [device]);
  
  /**
   * Stop heart rate measurement
   */
  const stopHeartRateMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // Send command to stop heart rate measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.STOP_HEART_RATE);
      await controlCharacteristic.writeValue(commandBuffer);
      
      // Stop notifications
      const heartRateCharacteristic = notificationCharacteristics.heartRate;
      if (heartRateCharacteristic) {
        await heartRateCharacteristic.stopNotifications();
        
        // Update state
        setNotificationCharacteristics(prev => ({
          ...prev,
          heartRate: null
        }));
      }
      
      setIsMeasuring(prev => ({ ...prev, heartRate: false }));
      toast.success("Heart rate measurement stopped");
      return true;
    } catch (error) {
      console.error("Failed to stop heart rate measurement:", error);
      toast.error("Failed to stop heart rate measurement");
      return false;
    }
  }, [device, notificationCharacteristics.heartRate]);
  
  /**
   * Start HRV measurement
   */
  const startHrvMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // First, try to set up notifications for HRV
      const hrvService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.HRV_SERVICE);
      const hrvCharacteristic = await hrvService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.HRV_MEASUREMENT);
      
      // Enable notifications
      await hrvCharacteristic.startNotifications();
      
      // Store the characteristic for later use
      setNotificationCharacteristics(prev => ({
        ...prev,
        hrv: hrvCharacteristic
      }));
      
      // Set up notification handler
      hrvCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        // Cast EventTarget to BluetoothRemoteGATTCharacteristic via unknown
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        if (target && target.value) {
          const { value, status } = parseHrvData(target.value);
          
          if (status === 'completed') {
            // Dispatch event with real data
            const hrvEvent = new CustomEvent('healthDataUpdate', {
              detail: {
                type: 'hrv',
                data: {
                  value,
                  timestamp: new Date().toISOString(),
                  isReal: true
                }
              }
            });
            window.dispatchEvent(hrvEvent);
          }
        }
      });
      
      // Now send command to start HRV measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.START_HRV);
      await controlCharacteristic.writeValue(commandBuffer);
      
      setIsMeasuring(prev => ({ ...prev, hrv: true }));
      toast.success("HRV measurement started");
      return true;
    } catch (error) {
      console.error("Failed to start HRV measurement:", error);
      toast.error("Failed to start HRV measurement");
      return false;
    }
  }, [device]);
  
  /**
   * Stop HRV measurement
   */
  const stopHrvMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // Send command to stop HRV measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.STOP_HRV);
      await controlCharacteristic.writeValue(commandBuffer);
      
      // Stop notifications
      const hrvCharacteristic = notificationCharacteristics.hrv;
      if (hrvCharacteristic) {
        await hrvCharacteristic.stopNotifications();
        
        // Update state
        setNotificationCharacteristics(prev => ({
          ...prev,
          hrv: null
        }));
      }
      
      setIsMeasuring(prev => ({ ...prev, hrv: false }));
      toast.success("HRV measurement stopped");
      return true;
    } catch (error) {
      console.error("Failed to stop HRV measurement:", error);
      toast.error("Failed to stop HRV measurement");
      return false;
    }
  }, [device, notificationCharacteristics.hrv]);
  
  /**
   * Start stress measurement
   */
  const startStressMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // First, try to set up notifications for stress
      const stressService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.STRESS_SERVICE);
      const stressCharacteristic = await stressService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.STRESS_LEVEL);
      
      // Enable notifications
      await stressCharacteristic.startNotifications();
      
      // Store the characteristic for later use
      setNotificationCharacteristics(prev => ({
        ...prev,
        stress: stressCharacteristic
      }));
      
      // Set up notification handler
      stressCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        // Cast EventTarget to BluetoothRemoteGATTCharacteristic via unknown
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        if (target && target.value) {
          const { score, level, status } = parseStressData(target.value);
          
          if (status === 'completed') {
            // Dispatch event with real data
            const stressEvent = new CustomEvent('healthDataUpdate', {
              detail: {
                type: 'stress',
                data: {
                  score,
                  level,
                  timestamp: new Date().toISOString(),
                  isReal: true
                }
              }
            });
            window.dispatchEvent(stressEvent);
          }
        }
      });
      
      // Now send command to start stress measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.START_STRESS);
      await controlCharacteristic.writeValue(commandBuffer);
      
      setIsMeasuring(prev => ({ ...prev, stress: true }));
      toast.success("Stress measurement started");
      return true;
    } catch (error) {
      console.error("Failed to start stress measurement:", error);
      toast.error("Failed to start stress measurement");
      return false;
    }
  }, [device]);
  
  /**
   * Stop stress measurement
   */
  const stopStressMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // Send command to stop stress measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.STOP_STRESS);
      await controlCharacteristic.writeValue(commandBuffer);
      
      // Stop notifications
      const stressCharacteristic = notificationCharacteristics.stress;
      if (stressCharacteristic) {
        await stressCharacteristic.stopNotifications();
        
        // Update state
        setNotificationCharacteristics(prev => ({
          ...prev,
          stress: null
        }));
      }
      
      setIsMeasuring(prev => ({ ...prev, stress: false }));
      toast.success("Stress measurement stopped");
      return true;
    } catch (error) {
      console.error("Failed to stop stress measurement:", error);
      toast.error("Failed to stop stress measurement");
      return false;
    }
  }, [device, notificationCharacteristics.stress]);
  
  /**
   * Start blood oxygen measurement
   */
  const startBloodOxygenMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // First, try to set up notifications for blood oxygen
      const bloodOxygenService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.BLOOD_OXYGEN_SERVICE);
      const bloodOxygenCharacteristic = await bloodOxygenService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.BLOOD_OXYGEN_MEASUREMENT);
      
      // Enable notifications
      await bloodOxygenCharacteristic.startNotifications();
      
      // Store the characteristic for later use
      setNotificationCharacteristics(prev => ({
        ...prev,
        bloodOxygen: bloodOxygenCharacteristic
      }));
      
      // Set up notification handler
      bloodOxygenCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        // Cast EventTarget to BluetoothRemoteGATTCharacteristic via unknown
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        if (target && target.value) {
          const { percentage, status } = parseBloodOxygenData(target.value);
          
          if (status === 'completed') {
            // Dispatch event with real data
            const bloodOxygenEvent = new CustomEvent('healthDataUpdate', {
              detail: {
                type: 'bloodOxygen',
                data: {
                  percentage,
                  timestamp: new Date().toISOString(),
                  isReal: true
                }
              }
            });
            window.dispatchEvent(bloodOxygenEvent);
          }
        }
      });
      
      // Now send command to start blood oxygen measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.START_BLOOD_OXYGEN);
      await controlCharacteristic.writeValue(commandBuffer);
      
      setIsMeasuring(prev => ({ ...prev, bloodOxygen: true }));
      toast.success("Blood oxygen measurement started");
      return true;
    } catch (error) {
      console.error("Failed to start blood oxygen measurement:", error);
      toast.error("Failed to start blood oxygen measurement");
      return false;
    }
  }, [device]);
  
  /**
   * Stop blood oxygen measurement
   */
  const stopBloodOxygenMeasurement = useCallback(async () => {
    if (!device?.gatt?.connected) {
      toast.error("Device not connected");
      return false;
    }
    
    try {
      // Send command to stop blood oxygen measurement
      const controlService = await device.gatt.getPrimaryService(BLUETOOTH_SERVICES.CONTROL_SERVICE);
      const controlCharacteristic = await controlService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
      
      const commandBuffer = createCommandBuffer(COMMAND_CODES.STOP_BLOOD_OXYGEN);
      await controlCharacteristic.writeValue(commandBuffer);
      
      // Stop notifications
      const bloodOxygenCharacteristic = notificationCharacteristics.bloodOxygen;
      if (bloodOxygenCharacteristic) {
        await bloodOxygenCharacteristic.stopNotifications();
        
        // Update state
        setNotificationCharacteristics(prev => ({
          ...prev,
          bloodOxygen: null
        }));
      }
      
      setIsMeasuring(prev => ({ ...prev, bloodOxygen: false }));
      toast.success("Blood oxygen measurement stopped");
      return true;
    } catch (error) {
      console.error("Failed to stop blood oxygen measurement:", error);
      toast.error("Failed to stop blood oxygen measurement");
      return false;
    }
  }, [device, notificationCharacteristics.bloodOxygen]);
  
  return {
    isMeasuring,
    syncTime,
    sendUserInfo,
    startHeartRateMeasurement,
    stopHeartRateMeasurement,
    startHrvMeasurement,
    stopHrvMeasurement,
    startStressMeasurement,
    stopStressMeasurement,
    startBloodOxygenMeasurement,
    stopBloodOxygenMeasurement
  };
};
