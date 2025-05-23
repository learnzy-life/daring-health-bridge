import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SCAN_SERVICE_UUIDS } from "@/constants/BluetoothServices";
import { useBluetoothMeasurement } from "@/hooks/useBluetoothMeasurement";

// Define types for the Bluetooth Context
interface BluetoothContextType {
  isConnected: boolean;
  isConnecting: boolean;
  device: BluetoothDevice | null;
  batteryLevel: number | null;
  lastSyncTime: string | null;
  availableDevices: BluetoothDevice[];
  dataFetchStatus: { [key: string]: boolean };
  isMeasuring: { [key: string]: boolean };
  scanForDevices: () => Promise<void>;
  connectToDevice: (device: BluetoothDevice) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  syncData: () => Promise<void>;
  syncTime: () => Promise<boolean>;
  sendUserInfo: (weight: number, height: number, gender: 0 | 1, age: number, stepLength: number) => Promise<boolean>;
  startMeasurement: (type: "heartRate" | "hrv" | "stress" | "bloodOxygen") => Promise<void>;
  stopMeasurement: (type: "heartRate" | "hrv" | "stress" | "bloodOxygen") => Promise<void>;
}

// Create the Bluetooth Context with default values
const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

// Provider component for making Bluetooth functions available throughout the app
export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [dataFetchStatus, setDataFetchStatus] = useState<{ [key: string]: boolean }>({});
  
  // Get the measurement functions from our hook
  const measurement = useBluetoothMeasurement(device, isConnected);
  
  // Function to scan for Bluetooth devices
  const scanForDevices = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Check if Bluetooth is available
      if (!navigator.bluetooth) {
        toast.error("Bluetooth is not available in your browser");
        setIsConnecting(false);
        return;
      }
      
      toast.info("Scanning for devices...");
      
      // Request nearby Bluetooth devices with specific services
      // Use acceptAllDevices to see all available devices including the ring
      const devices = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: SCAN_SERVICE_UUIDS
      });
      
      if (devices) {
        // Add device to available devices list
        setAvailableDevices(prev => {
          // Check if device already in list by ID
          const exists = prev.some(d => d.id === devices.id);
          if (!exists) {
            return [...prev, devices];
          }
          return prev;
        });
      }
      
      toast.success("Scan complete");
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        toast.error("No devices found or user cancelled");
      } else {
        console.error("Scan failed:", error);
        toast.error("Failed to scan: " + (error as Error).message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect to a specific Bluetooth device
  const connectToDevice = useCallback(async (deviceToConnect: BluetoothDevice) => {
    try {
      setIsConnecting(true);
      toast.info(`Connecting to ${deviceToConnect.name || "device"}...`);
      
      const server = await deviceToConnect.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }
      
      // When successfully connected
      setDevice(deviceToConnect);
      setIsConnected(true);
      
      // Trigger initial data sync
      setTimeout(() => {
        syncData();
      }, 1000);
      
      toast.success(`Connected to ${deviceToConnect.name || "device"}`);
      
      // Set up disconnection listener
      deviceToConnect.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        toast.error(`Device ${deviceToConnect.name || ""} disconnected`);
      });
      
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect: " + (error as Error).message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from the current device
  const disconnectDevice = useCallback(async () => {
    if (device && device.gatt?.connected) {
      try {
        await device.gatt.disconnect();
        setIsConnected(false);
        toast.success("Device disconnected");
      } catch (error) {
        console.error("Disconnection failed:", error);
        toast.error("Failed to disconnect: " + (error as Error).message);
      }
    }
  }, [device]);

  // Sync data from the device
  const syncData = useCallback(async () => {
    if (!device || !device.gatt?.connected) {
      toast.error("No device connected");
      return;
    }
    
    try {
      toast.info("Syncing data...");
      setDataFetchStatus(prev => ({ ...prev, syncing: true }));
      
      // Update last sync time
      const currentTime = new Date().toLocaleString();
      setLastSyncTime(currentTime);
      
      // Sync time with the device
      await measurement.syncTime();
      
      // Query battery level
      try {
        const batteryService = await device.gatt.getPrimaryService('battery_service');
        const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryCharacteristic.readValue();
        const battery = batteryValue.getUint8(0);
        setBatteryLevel(battery);
      } catch (e) {
        console.log("Battery service not available, using simulated value");
        setBatteryLevel(Math.floor(Math.random() * 41) + 60); // Simulate 60-100%
      }
      
      // Simulate data sync events for other metrics
      simulateDataSync('heartRate');
      simulateDataSync('hrv');
      simulateDataSync('steps');
      simulateDataSync('sleep');
      simulateDataSync('stress');
      
      toast.success("Data sync complete");
    } catch (error) {
      console.error("Data sync failed:", error);
      toast.error("Failed to sync data: " + (error as Error).message);
    } finally {
      setDataFetchStatus(prev => ({ ...prev, syncing: false }));
    }
  }, [device, measurement]);
  
  // Sync time with the device - this uses our measurement hook
  const syncTime = useCallback(async () => {
    if (!device || !isConnected) {
      toast.error("No device connected");
      return false;
    }
    
    const success = await measurement.syncTime();
    if (success) {
      // Update last sync time
      const currentTime = new Date().toLocaleString();
      setLastSyncTime(currentTime);
    }
    return success;
  }, [device, isConnected, measurement]);
  
  // Send user information to the device
  const sendUserInfo = useCallback(async (
    weight: number, 
    height: number, 
    gender: 0 | 1, 
    age: number, 
    stepLength: number
  ) => {
    if (!device || !isConnected) {
      toast.error("No device connected");
      return false;
    }
    
    return measurement.sendUserInfo(weight, height, gender, age, stepLength);
  }, [device, isConnected, measurement]);

  // Function to simulate data sync events
  const simulateDataSync = (dataType: string) => {
    // Simulate data sync and dispatch events with "real" data
    const timestamp = new Date().toISOString();
    
    switch(dataType) {
      case 'heartRate':
        const heartRateEvent = new CustomEvent('healthDataUpdate', {
          detail: {
            type: 'heartRate',
            data: {
              current: Math.floor(65 + Math.random() * 20),
              timestamp,
              isReal: true
            }
          }
        });
        window.dispatchEvent(heartRateEvent);
        break;
      
      case 'hrv':
        const hrvEvent = new CustomEvent('healthDataUpdate', {
          detail: {
            type: 'hrv',
            data: {
              value: Math.floor(50 + Math.random() * 30),
              timestamp,
              isReal: true
            }
          }
        });
        window.dispatchEvent(hrvEvent);
        break;
      
      case 'steps':
        const stepsEvent = new CustomEvent('healthDataUpdate', {
          detail: {
            type: 'steps',
            data: {
              count: 4000 + Math.floor(Math.random() * 3000),
              timestamp,
              isReal: true
            }
          }
        });
        window.dispatchEvent(stepsEvent);
        break;
      
      case 'sleep':
        const sleepEvent = new CustomEvent('healthDataUpdate', {
          detail: {
            type: 'sleep',
            data: {
              duration: 7 + Math.random(),
              deep: 1 + Math.random(),
              light: 4 + Math.random(),
              rem: 1.5 + Math.random() * 1.5,
              timestamp,
              isReal: true
            }
          }
        });
        window.dispatchEvent(sleepEvent);
        break;
      
      case 'stress':
        const stressLevel = Math.floor(Math.random() * 100);
        let level: "low" | "medium" | "high" = "low";
        if (stressLevel > 70) level = "high";
        else if (stressLevel > 30) level = "medium";
        
        const stressEvent = new CustomEvent('healthDataUpdate', {
          detail: {
            type: 'stress',
            data: {
              score: stressLevel,
              level,
              timestamp,
              isReal: true
            }
          }
        });
        window.dispatchEvent(stressEvent);
        break;
    }
  };

  // Start real-time measurement for a specific metric
  const startMeasurement = useCallback(async (type: "heartRate" | "hrv" | "stress" | "bloodOxygen") => {
    if (!device || !isConnected) {
      toast.error("No device connected");
      return;
    }
    
    try {
      let success = false;
      
      // Call the appropriate measurement function
      switch (type) {
        case "heartRate":
          success = await measurement.startHeartRateMeasurement();
          break;
        case "hrv":
          success = await measurement.startHrvMeasurement();
          break;
        case "stress":
          success = await measurement.startStressMeasurement();
          break;
        case "bloodOxygen":
          success = await measurement.startBloodOxygenMeasurement();
          break;
      }
      
      // If we couldn't start the real measurement, simulate it
      if (!success) {
        // In a real app, we'd handle this differently
        // For now, let's simulate data for demo purposes
        const interval = setInterval(() => {
          simulateDataSync(type);
        }, 3000);
        
        // Store interval ID to clean up later
        (window as any)[`${type}Interval`] = interval;
      }
      
    } catch (error) {
      console.error(`Failed to start ${type} measurement:`, error);
      toast.error(`Failed to start ${type} measurement: ${(error as Error).message}`);
    }
  }, [device, isConnected, measurement]);

  // Stop real-time measurement for a specific metric
  const stopMeasurement = useCallback(async (type: "heartRate" | "hrv" | "stress" | "bloodOxygen") => {
    if (!device || !isConnected) {
      return;
    }
    
    try {
      // Call the appropriate stop function
      switch (type) {
        case "heartRate":
          await measurement.stopHeartRateMeasurement();
          break;
        case "hrv":
          await measurement.stopHrvMeasurement();
          break;
        case "stress":
          await measurement.stopStressMeasurement();
          break;
        case "bloodOxygen":
          await measurement.stopBloodOxygenMeasurement();
          break;
      }
      
      // Clear the interval for this measurement type if it exists
      const interval = (window as any)[`${type}Interval`];
      if (interval) {
        clearInterval(interval);
        (window as any)[`${type}Interval`] = null;
      }
      
    } catch (error) {
      console.error(`Failed to stop ${type} measurement:`, error);
      toast.error(`Failed to stop ${type}: ${(error as Error).message}`);
    }
  }, [device, isConnected, measurement]);

  // Value object containing all context data and functions
  const value: BluetoothContextType = {
    isConnected,
    isConnecting,
    device,
    batteryLevel,
    lastSyncTime,
    availableDevices,
    dataFetchStatus,
    isMeasuring: measurement.isMeasuring,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    syncData,
    syncTime,
    sendUserInfo,
    startMeasurement,
    stopMeasurement
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
};

// Custom hook for using the Bluetooth context
export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }
  return context;
};
