import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { toast } from "sonner";
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
  startRealTimeMonitoring: (dataType: string) => void;
  stopRealTimeMonitoring: (dataType: string) => void;
  isMonitoring: { [key: string]: boolean };
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
  const { batteryLevel, lastSyncTime, isConnected, startMeasurement, stopMeasurement, isMeasuring } = useBluetooth();
  const [hasRealData, setHasRealData] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState<{ [key: string]: boolean }>({
    heartRate: false,
    hrv: false,
    steps: false,
    sleep: false,
    stress: false
  });

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
  }, [batteryLevel, lastSyncTime, isConnected]);

  // Listen for health data updates from the Bluetooth context
  useEffect(() => {
    const handleHealthDataUpdate = (event: Event) => {
      const { type, data } = (event as CustomEvent).detail;
      
      if (data.isReal) {
        setHasRealData(true);
      }
      
      setHealthData(prev => {
        switch (type) {
          case 'heartRate':
            // Update min/max values if needed
            const min = data.current < prev.heartRate.min ? data.current : prev.heartRate.min;
            const max = data.current > prev.heartRate.max ? data.current : prev.heartRate.max;
            
            // Calculate running average
            const newAvg = prev.heartRate.isReal ? 
              (prev.heartRate.avg + data.current) / 2 : 
              data.current;
            
            return {
              ...prev,
              heartRate: {
                ...prev.heartRate,
                current: data.current,
                min,
                max,
                avg: newAvg,
                timestamp: data.timestamp,
                isReal: data.isReal,
              }
            };
            
          case 'hrv':
            return {
              ...prev,
              hrv: {
                ...prev.hrv,
                value: data.value,
                timestamp: data.timestamp,
                isReal: data.isReal,
              }
            };
            
          case 'steps':
            return {
              ...prev,
              steps: {
                ...prev.steps,
                count: data.count,
                timestamp: data.timestamp,
                isReal: data.isReal,
              }
            };
            
          case 'sleep':
            return {
              ...prev,
              sleep: {
                ...data,
                isReal: data.isReal,
              }
            };
            
          case 'stress':
            return {
              ...prev,
              stress: {
                ...data,
                isReal: data.isReal,
              }
            };
            
          default:
            return prev;
        }
      });
    };
    
    window.addEventListener('healthDataUpdate', handleHealthDataUpdate);
    return () => window.removeEventListener('healthDataUpdate', handleHealthDataUpdate);
  }, []);

  // Simulate updating data when no real data is available
  useEffect(() => {
    if (!isConnected) return;
    
    // Only simulate data if we don't have real data
    if (hasRealData) return;

    const interval = setInterval(() => {
      setHealthData(prev => {
        const now = new Date().toISOString();
        
        return {
          ...prev,
          heartRate: {
            ...prev.heartRate,
            current: Math.floor(65 + Math.random() * 15),
            timestamp: now,
            isReal: false,
          },
          steps: {
            ...prev.steps,
            count: prev.steps.count + Math.floor(Math.random() * 20),
            timestamp: now,
            isReal: false,
          }
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, hasRealData]);

  // Start real-time monitoring for a specific data type
  const startRealTimeMonitoring = useCallback(async (dataType: string) => {
    if (!isConnected) {
      toast.error("Not connected to a device");
      return;
    }
    
    setIsMonitoring(prev => ({ ...prev, [dataType]: true }));
    
    // Map data types to their corresponding measurement types
    const measurementMap: { [key: string]: "heartRate" | "hrv" | "stress" | "bloodOxygen" | null } = {
      heartRate: "heartRate",
      hrv: "hrv", 
      stress: "stress",
      sleep: null, // Sleep doesn't have real-time monitoring
      steps: null  // Steps don't have real-time monitoring
    };
    
    // If this data type has a corresponding measurement, start it
    const measurementType = measurementMap[dataType];
    if (measurementType) {
      await startMeasurement(measurementType);
    }
  }, [isConnected, startMeasurement]);
  
  // Stop real-time monitoring for a specific data type
  const stopRealTimeMonitoring = useCallback(async (dataType: string) => {
    setIsMonitoring(prev => ({ ...prev, [dataType]: false }));
    
    // Map data types to their corresponding measurement types
    const measurementMap: { [key: string]: "heartRate" | "hrv" | "stress" | "bloodOxygen" | null } = {
      heartRate: "heartRate",
      hrv: "hrv", 
      stress: "stress",
      sleep: null,
      steps: null
    };
    
    // If this data type has a corresponding measurement, stop it
    const measurementType = measurementMap[dataType];
    if (measurementType) {
      await stopMeasurement(measurementType);
    }
  }, [stopMeasurement]);

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
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    isMonitoring
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
