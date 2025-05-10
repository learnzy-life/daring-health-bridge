
import { useData } from "@/context/DataContext";
import { useBluetooth } from "@/context/BluetoothContext";

/**
 * API service for external applications to access health data
 */
export const createApiService = () => {
  const { healthData, hasRealData } = useData();
  const { isConnected, startMeasurement, stopMeasurement, syncData } = useBluetooth();
  
  return {
    /**
     * Get the current status of the connection and data
     */
    getStatus: () => {
      return {
        isConnected,
        dataSource: hasRealData ? 'real' : 'simulated',
        lastUpdated: healthData.deviceInfo.lastSync,
        availableMetrics: [
          'heartRate', 
          'hrv', 
          'steps', 
          'sleep', 
          'stress', 
          'bloodOxygen',
          'temperature'
        ]
      };
    },
    
    /**
     * Get heart rate data
     */
    getHeartRate: () => {
      return {
        current: healthData.heartRate.current,
        min: healthData.heartRate.min,
        max: healthData.heartRate.max,
        avg: healthData.heartRate.avg,
        timestamp: healthData.heartRate.timestamp,
        isRealData: healthData.heartRate.isReal
      };
    },
    
    /**
     * Get HRV data
     */
    getHrv: () => {
      return {
        value: healthData.hrv.value,
        unit: healthData.hrv.unit,
        timestamp: healthData.hrv.timestamp,
        isRealData: healthData.hrv.isReal
      };
    },
    
    /**
     * Get steps data
     */
    getSteps: () => {
      return {
        count: healthData.steps.count,
        goal: healthData.steps.goal,
        timestamp: healthData.steps.timestamp,
        isRealData: healthData.steps.isReal
      };
    },
    
    /**
     * Get sleep data
     */
    getSleep: () => {
      return {
        duration: healthData.sleep.duration,
        deep: healthData.sleep.deep,
        light: healthData.sleep.light,
        rem: healthData.sleep.rem,
        timestamp: healthData.sleep.timestamp,
        isRealData: healthData.sleep.isReal
      };
    },
    
    /**
     * Get stress data
     */
    getStress: () => {
      return {
        score: healthData.stress.score,
        level: healthData.stress.level,
        timestamp: healthData.stress.timestamp,
        isRealData: healthData.stress.isReal
      };
    },
    
    /**
     * Start real-time measurement of a specific metric
     */
    startMeasuring: async (metric: "heartRate" | "hrv" | "stress" | "bloodOxygen") => {
      if (!isConnected) {
        return {
          success: false,
          message: "No device connected"
        };
      }
      
      try {
        await startMeasurement(metric);
        return {
          success: true,
          message: `Started measuring ${metric}`
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to start ${metric} measurement: ${(error as Error).message}`
        };
      }
    },
    
    /**
     * Stop real-time measurement of a specific metric
     */
    stopMeasuring: async (metric: "heartRate" | "hrv" | "stress" | "bloodOxygen") => {
      if (!isConnected) {
        return {
          success: false,
          message: "No device connected"
        };
      }
      
      try {
        await stopMeasurement(metric);
        return {
          success: true,
          message: `Stopped measuring ${metric}`
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to stop ${metric} measurement: ${(error as Error).message}`
        };
      }
    },
    
    /**
     * Sync data from the device
     */
    syncNow: async () => {
      if (!isConnected) {
        return {
          success: false,
          message: "No device connected"
        };
      }
      
      try {
        await syncData();
        return {
          success: true,
          message: "Data synchronized successfully"
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to sync data: ${(error as Error).message}`
        };
      }
    }
  };
};
