
import React, { createContext, useState, useContext, useEffect } from "react";
import { useBluetooth } from "./BluetoothContext";

interface HealthData {
  hrv: {
    value: number;
    unit: string;
    timestamp: string;
    isReal: boolean;
  };
  sleep: {
    duration: number;
    deep: number;
    light: number;
    rem: number;
    timestamp: string;
    isReal: boolean;
  };
  steps: {
    count: number;
    goal: number;
    timestamp: string;
    isReal: boolean;
  };
  heartRate: {
    current: number;
    min: number;
    max: number;
    avg: number;
    timestamp: string;
    isReal: boolean;
  };
  stress: {
    score: number;
    level: "low" | "medium" | "high";
    timestamp: string;
    isReal: boolean;
  };
  deviceInfo: {
    batteryLevel: number | null;
    firmware: string;
    lastSync: string | null;
    model: string;
    isReal: boolean;
  };
}

interface DataContextType {
  healthData: HealthData;
  updateHealthData: (key: keyof HealthData, value: any) => void;
  getApiData: (endpoint: string) => any;
  hasRealData: boolean;
}

const initialHealthData: HealthData = {
  hrv: {
    value: 68,
    unit: "ms",
    timestamp: new Date().toISOString(),
    isReal: false,
  },
  sleep: {
    duration: 7.5,
    deep: 1.2,
    light: 4.3,
    rem: 2.0,
    timestamp: new Date().toISOString(),
    isReal: false,
  },
  steps: {
    count: 4235,
    goal: 10000,
    timestamp: new Date().toISOString(),
    isReal: false,
  },
  heartRate: {
    current: 72,
    min: 58,
    max: 120,
    avg: 68,
    timestamp: new Date().toISOString(),
    isReal: false,
  },
  stress: {
    score: 32,
    level: "low",
    timestamp: new Date().toISOString(),
    isReal: false,
  },
  deviceInfo: {
    batteryLevel: null,
    firmware: "v1.2.3",
    lastSync: null,
    model: "Daring Ring Pro",
    isReal: false,
  },
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [healthData, setHealthData] = useState<HealthData>(initialHealthData);
  const { batteryLevel, lastSyncTime, isConnected } = useBluetooth();
  const [hasRealData, setHasRealData] = useState(false);

  // Update device info when Bluetooth state changes
  useEffect(() => {
    setHealthData(prev => ({
      ...prev,
      deviceInfo: {
        ...prev.deviceInfo,
        batteryLevel,
        lastSync: lastSyncTime,
        isReal: isConnected && batteryLevel !== null,
      }
    }));
  }, [batteryLevel, lastSyncTime]);

  // Simulate updating data every 10 seconds when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setHealthData(prev => {
        const now = new Date().toISOString();
        
        // Check if this is real data or simulated data
        // In a real implementation, this would be determined by actual data from the device
        const isRealData = isConnected && Math.random() > 0.5; // Simulating a 50% chance of getting real data
        
        if (isRealData) {
          setHasRealData(true);
        }
        
        return {
          ...prev,
          heartRate: {
            ...prev.heartRate,
            current: Math.floor(65 + Math.random() * 15),
            timestamp: now,
            isReal: isRealData,
          },
          steps: {
            ...prev.steps,
            count: prev.steps.count + Math.floor(Math.random() * 20),
            timestamp: now,
            isReal: isRealData,
          }
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const updateHealthData = (key: keyof HealthData, value: any) => {
    setHealthData(prev => {
      const isRealData = isConnected && value.isReal !== undefined ? value.isReal : false;
      
      if (isRealData) {
        setHasRealData(true);
      }
      
      return {
        ...prev,
        [key]: {
          ...prev[key],
          ...value,
          timestamp: new Date().toISOString(),
          isReal: isRealData,
        }
      };
    });
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
    hasRealData,
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
