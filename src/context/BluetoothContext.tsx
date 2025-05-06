
import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { toast } from "sonner";

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
      const devices = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "Daring" },
          { services: ["heart_rate"] }
        ],
        optionalServices: [
          "battery_service",
          "device_information",
          "health_thermometer"
        ]
      });
      
      setAvailableDevices(prev => {
        if (prev.some(d => d.id === devices.id)) {
          return prev;
        }
        return [...prev, devices];
      });
      
      toast.success("Device found");
      return [devices];
    } catch (error) {
      console.error("Error scanning for devices:", error);
      toast.error("Failed to scan for devices");
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
  }, [device, handleDisconnect]);

  // Update last sync time
  const updateLastSyncTime = useCallback(() => {
    const now = new Date();
    setLastSyncTime(now.toLocaleTimeString());
  }, []);

  // Sync data from the device
  const syncData = useCallback(async (): Promise<void> => {
    if (!isConnected || !server) {
      toast.error("Not connected to any device");
      return;
    }

    try {
      toast.info("Syncing data from device...");
      
      // Here we would implement the actual data syncing logic based on the Smart Ring SDK
      // For now, we'll just simulate a successful sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateLastSyncTime();
      toast.success("Data synced successfully");
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
