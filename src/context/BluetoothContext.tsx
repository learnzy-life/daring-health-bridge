
import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { BLUETOOTH_SERVICES, BLUETOOTH_CHARACTERISTICS } from "../constants/BluetoothServices";
import { 
  parseHeartRateData, 
  parseHrvData, 
  parseStepData,
  parseSleepData,
  parseStressData,
  parseTemperatureData
} from "../utils/dataParser";

interface BluetoothContextType {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  isConnected: boolean;
  isConnecting: boolean;
  batteryLevel: number | null;
  lastSyncTime: string | null;
  scanForDevices: () => Promise<BluetoothDevice[]>;
  connectToDevice: (device: BluetoothDevice) => Promise<void>;
  disconnectDevice: () => void;
  syncData: () => Promise<void>;
  availableDevices: BluetoothDevice[];
  startMeasurement: (type: "heartRate" | "hrv" | "stress" | "bloodOxygen") => Promise<void>;
  stopMeasurement: (type: "heartRate" | "hrv" | "stress" | "bloodOxygen") => Promise<void>;
  isMeasuring: { [key: string]: boolean };
  dataFetchStatus: { [key: string]: "idle" | "fetching" | "success" | "error" };
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isMeasuring, setIsMeasuring] = useState<{ [key: string]: boolean }>({
    heartRate: false,
    hrv: false,
    stress: false,
    bloodOxygen: false
  });
  const [dataFetchStatus, setDataFetchStatus] = useState<{ [key: string]: "idle" | "fetching" | "success" | "error" }>({
    heartRate: "idle",
    hrv: "idle",
    steps: "idle",
    sleep: "idle",
    stress: "idle",
    temperature: "idle"
  });

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = useCallback(() => {
    return navigator.bluetooth !== undefined;
  }, []);

  // Scan for Bluetooth devices
  const scanForDevices = useCallback(async (): Promise<BluetoothDevice[]> => {
    if (!isBluetoothSupported()) {
      toast.error("Web Bluetooth is not supported in this browser");
      return [];
    }

    try {
      setIsConnecting(true);
      
      // Define the services we're looking for - include both standard services and custom ones
      const optionalServices = [
        'battery_service',
        'device_information',
        'heart_rate',
        // Include our custom service UUIDs here
        BLUETOOTH_SERVICES.HRV_SERVICE,
        BLUETOOTH_SERVICES.SLEEP_SERVICE,
        BLUETOOTH_SERVICES.STEPS_SERVICE,
        BLUETOOTH_SERVICES.STRESS_SERVICE,
        BLUETOOTH_SERVICES.TEMPERATURE_SERVICE
      ];
      
      // First try to find specifically Daring ring devices
      let devices: BluetoothDevice;
      try {
        devices = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: "Daring" },      // Filter by name prefix
            { namePrefix: "Smart Ring" },  // Alternative name prefix
            { services: [BLUETOOTH_SERVICES.HEART_RATE] } // Filter by a service we expect the ring to have
          ],
          optionalServices
        });
      } catch (e) {
        // If no Daring rings found, broaden the search
        console.log("No Daring rings found, broadening search...");
        devices = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices
        });
      }
      
      setAvailableDevices(prev => {
        if (prev.some(d => d.id === devices.id)) {
          return prev;
        }
        return [...prev, devices];
      });
      
      toast.success(`Device found: ${devices.name || "Unknown Device"}`);
      return [devices];
    } catch (error) {
      console.error("Error scanning for devices:", error);
      // Don't show error if user just canceled the dialog
      if (error instanceof Error && error.name !== "NotFoundError") {
        toast.error("Failed to scan for devices");
      }
      return [];
    } finally {
      setIsConnecting(false);
    }
  }, [isBluetoothSupported]);

  // Connect to a specific device
  const connectToDevice = useCallback(async (deviceToConnect: BluetoothDevice): Promise<void> => {
    try {
      setIsConnecting(true);
      toast.info("Connecting to device...");
      
      setDevice(deviceToConnect);
      
      // Connect to GATT server
      const gattServer = await deviceToConnect.gatt?.connect();
      
      if (!gattServer) {
        throw new Error("Failed to connect to GATT server");
      }

      setServer(gattServer);
      setIsConnected(true);
      updateLastSyncTime();
      
      // Get battery level if service is available
      try {
        const batteryService = await gattServer.getPrimaryService("battery_service");
        const batteryCharacteristic = await batteryService.getCharacteristic("battery_level");
        const batteryValue = await batteryCharacteristic.readValue();
        setBatteryLevel(batteryValue.getUint8(0));
        
        // Set up notification for battery level changes
        await batteryCharacteristic.startNotifications();
        batteryCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
          if (value) {
            setBatteryLevel(value.getUint8(0));
          }
        });
      } catch (batteryError) {
        console.log("Battery service not available", batteryError);
        setBatteryLevel(null);
      }

      toast.success("Connected to device");
      
      // Set up disconnect listener
      deviceToConnect.addEventListener('gattserverdisconnected', handleDisconnect);
      
    } catch (error) {
      console.error("Error connecting to device:", error);
      toast.error("Failed to connect to device");
      setDevice(null);
      setServer(null);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Handle device disconnection
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setServer(null);
    toast.warning("Device disconnected");
    
    // Reset measurement states
    setIsMeasuring({
      heartRate: false,
      hrv: false,
      stress: false,
      bloodOxygen: false
    });
    
    // Reset data fetch statuses
    setDataFetchStatus({
      heartRate: "idle",
      hrv: "idle",
      steps: "idle",
      sleep: "idle",
      stress: "idle",
      temperature: "idle"
    });
  }, []);

  // Manually disconnect from device
  const disconnectDevice = useCallback(() => {
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
    
    if (device) {
      device.removeEventListener('gattserverdisconnected', handleDisconnect);
    }
    
    setDevice(null);
    setServer(null);
    setIsConnected(false);
    setBatteryLevel(null);
    toast.info("Disconnected from device");
    
    // Reset all measurement states
    setIsMeasuring({
      heartRate: false,
      hrv: false,
      stress: false,
      bloodOxygen: false
    });
  }, [device, handleDisconnect]);

  // Update last sync time
  const updateLastSyncTime = useCallback(() => {
    const now = new Date();
    setLastSyncTime(now.toLocaleTimeString());
  }, []);

  // Start a measurement
  const startMeasurement = useCallback(async (type: "heartRate" | "hrv" | "stress" | "bloodOxygen"): Promise<void> => {
    if (!isConnected || !server) {
      toast.error("Not connected to any device");
      return;
    }
    
    try {
      setIsMeasuring(prev => ({ ...prev, [type]: true }));
      toast.info(`Starting ${type} measurement...`);
      
      // This would be implemented differently based on the specific ring's API
      // Here's a placeholder implementation
      switch (type) {
        case "heartRate":
          try {
            const service = await server.getPrimaryService(BLUETOOTH_SERVICES.HEART_RATE);
            const characteristic = await service.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
            
            // Send command to start heart rate measurement (this is a placeholder)
            await characteristic.writeValue(new Uint8Array([0x01]));
            
            toast.success("Heart rate measurement started");
          } catch (error) {
            console.error("Error starting heart rate measurement:", error);
            toast.error("Failed to start heart rate measurement");
            setIsMeasuring(prev => ({ ...prev, heartRate: false }));
          }
          break;
          
        // Similar implementations for other measurement types
        case "hrv":
        case "stress":
        case "bloodOxygen":
          // These would be implemented similarly
          toast.info(`${type} measurement is not yet implemented`);
          setIsMeasuring(prev => ({ ...prev, [type]: false }));
          break;
      }
    } catch (error) {
      console.error(`Error starting ${type} measurement:`, error);
      toast.error(`Failed to start ${type} measurement`);
      setIsMeasuring(prev => ({ ...prev, [type]: false }));
    }
  }, [isConnected, server]);

  // Stop a measurement
  const stopMeasurement = useCallback(async (type: "heartRate" | "hrv" | "stress" | "bloodOxygen"): Promise<void> => {
    if (!isConnected || !server) {
      toast.error("Not connected to any device");
      return;
    }
    
    try {
      toast.info(`Stopping ${type} measurement...`);
      
      // This would be implemented differently based on the specific ring's API
      // Here's a placeholder implementation
      switch (type) {
        case "heartRate":
          try {
            const service = await server.getPrimaryService(BLUETOOTH_SERVICES.HEART_RATE);
            const characteristic = await service.getCharacteristic(BLUETOOTH_CHARACTERISTICS.MEASUREMENT_CONTROL);
            
            // Send command to stop heart rate measurement (this is a placeholder)
            await characteristic.writeValue(new Uint8Array([0x00]));
            
            toast.success("Heart rate measurement stopped");
          } catch (error) {
            console.error("Error stopping heart rate measurement:", error);
            toast.error("Failed to stop heart rate measurement");
          } finally {
            setIsMeasuring(prev => ({ ...prev, heartRate: false }));
          }
          break;
          
        // Similar implementations for other measurement types
        case "hrv":
        case "stress":
        case "bloodOxygen":
          // These would be implemented similarly
          toast.info(`${type} measurement is not yet implemented`);
          setIsMeasuring(prev => ({ ...prev, [type]: false }));
          break;
      }
    } catch (error) {
      console.error(`Error stopping ${type} measurement:`, error);
      toast.error(`Failed to stop ${type} measurement`);
      setIsMeasuring(prev => ({ ...prev, [type]: false }));
    }
  }, [isConnected, server]);

  // Sync data from the device
  const syncData = useCallback(async (): Promise<void> => {
    if (!isConnected || !server) {
      toast.error("Not connected to any device");
      return;
    }

    try {
      toast.info("Syncing data from device...");
      
      // Track which data types were successfully synced
      const syncedData: string[] = [];
      
      // Sync heart rate data
      try {
        setDataFetchStatus(prev => ({ ...prev, heartRate: "fetching" }));
        const heartRateService = await server.getPrimaryService(BLUETOOTH_SERVICES.HEART_RATE);
        const heartRateCharacteristic = await heartRateService.getCharacteristic(BLUETOOTH_CHARACTERISTICS.HEART_RATE_MEASUREMENT);
        const heartRateValue = await heartRateCharacteristic.readValue();
        
        const heartRateData = parseHeartRateData(heartRateValue);
        console.log("Heart Rate Data:", heartRateData);
        
        // This would trigger an update in the DataContext
        // Implementation would depend on how we've set up the data flow
        window.dispatchEvent(new CustomEvent('healthDataUpdate', { 
          detail: { 
            type: 'heartRate', 
            data: {
              current: heartRateData.heartRate,
              isReal: true,
              timestamp: new Date().toISOString()
            }
          } 
        }));
        
        setDataFetchStatus(prev => ({ ...prev, heartRate: "success" }));
        syncedData.push("Heart Rate");
      } catch (error) {
        console.error("Error syncing heart rate data:", error);
        setDataFetchStatus(prev => ({ ...prev, heartRate: "error" }));
      }
      
      // Sync other types of data - this would be expanded based on the ring's capabilities
      // and the specific services and characteristics it provides
      
      updateLastSyncTime();
      
      if (syncedData.length > 0) {
        toast.success(`Data synced successfully: ${syncedData.join(", ")}`);
      } else {
        toast.warning("No data could be synced. Try again or check device compatibility.");
      }
    } catch (error) {
      console.error("Error syncing data:", error);
      toast.error("Failed to sync data");
    }
  }, [isConnected, server, updateLastSyncTime]);

  const value = {
    device,
    server,
    isConnected,
    isConnecting,
    batteryLevel,
    lastSyncTime,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    syncData,
    availableDevices,
    startMeasurement,
    stopMeasurement,
    isMeasuring,
    dataFetchStatus
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }
  return context;
};
