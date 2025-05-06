
import React, { createContext, useState, useContext, useEffect } from "react";
import { useBluetooth } from "./BluetoothContext";

interface HealthData {
  hrv: {
    value: number;
    unit: string;
    timestamp: string;
  };
  sleep: {
    duration: number;
    deep: number;
    light: number;
    rem: number;
    timestamp: string;
  };
  steps: {
    count: number;
    goal: number;
    timestamp: string;
  };
  heartRate: {
    current: number;
    min: number;
    max: number;
    avg: number;
    timestamp: string;
  };
  stress: {
    score: number;
    level: "low" | "medium" | "high";
    timestamp: string;
  };
  deviceInfo: {
    batteryLevel: number | null;
    firmware: string;
    lastSync: string | null;
    model: string;
  };
}

interface DataContextType {
  healthData: HealthData;
  updateHealthData: (key: keyof HealthData, value: any) => void;
  getApiData: (endpoint: string) => any;
}

const initialHealthData: HealthData = {
  hrv: {
    value: 68,
    unit: "ms",
    timestamp: new Date().toISOString(),
  },
  sleep: {
    duration: 7.5,
    deep: 1.2,
    light: 4.3,
    rem: 2.0,
    timestamp: new Date().toISOString(),
  },
  steps: {
    count: 4235,
    goal: 10000,
    timestamp: new Date().toISOString(),
  },
  heartRate: {
    current: 72,
    min: 58,
    max: 120,
    avg: 68,
    timestamp: new Date().toISOString(),
  },
  stress: {
    score: 32,
    level: "low",
    timestamp: new Date().toISOString(),
  },
  deviceInfo: {
    batteryLevel: null,
    firmware: "v1.2.3",
    lastSync: null,
    model: "Daring Ring Pro",
  },
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [healthData, setHealthData] = useState<HealthData>(initialHealthData);
  const { batteryLevel, lastSyncTime, isConnected } = useBluetooth();

  // Update device info when Bluetooth state changes
  useEffect(() => {
    setHealthData(prev => ({
      ...prev,
      deviceInfo: {
        ...prev.deviceInfo,
        batteryLevel,
        lastSync: lastSyncTime,
      }
    }));
  }, [batteryLevel, lastSyncTime]);

  // Simulate updating data every 10 seconds when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setHealthData(prev => {
        const now = new Date().toISOString();
        
        return {
          ...prev,
          heartRate: {
            ...prev.heartRate,
            current: Math.floor(65 + Math.random() * 15),
            timestamp: now
          },
          steps: {
            ...prev.steps,
            count: prev.steps.count + Math.floor(Math.random() * 20),
            timestamp: now
          }
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const updateHealthData = (key: keyof HealthData, value: any) => {
    setHealthData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...value,
        timestamp: new Date().toISOString(),
      }
    }));
  };

  const getApiData = (endpoint: string) => {
    switch(endpoint) {
      case "hrv":
        return healthData.hrv;
      case "sleep":
        return healthData.sleep;
      case "steps":
        return healthData.steps;
      case "heart-rate":
        return healthData.heartRate;
      case "stress":
        return healthData.stress;
      case "device-info":
        return healthData.deviceInfo;
      default:
        return { error: "Endpoint not found" };
    }
  };

  const value = {
    healthData,
    updateHealthData,
    getApiData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
