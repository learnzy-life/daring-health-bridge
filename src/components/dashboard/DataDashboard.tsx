
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { useBluetooth } from "@/context/BluetoothContext";
import { Progress } from "@/components/ui/progress";
import DataCard from "./DataCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const DataDashboard = () => {
  const { healthData, hasRealData } = useData();
  const { isConnected } = useBluetooth();
  
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="bg-teal-50">
          <CardTitle>Health Data Dashboard</CardTitle>
          <CardDescription>
            {isConnected 
              ? hasRealData
                ? "Real-time health data from your connected device" 
                : "Connected to device. Waiting for real data..."
              : "Connect your device to view health data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {!isConnected ? (
            <div className="text-center py-12 text-gray-500">
              <p>No device connected</p>
              <p className="text-sm mt-2">Connect your smart ring to view your health data</p>
            </div>
          ) : !hasRealData ? (
            <div className="space-y-4">
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-600" />
                <AlertTitle>Simulated Data</AlertTitle>
                <AlertDescription>
                  Currently showing simulated data. Sync with your device to view real health data.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDataCards(healthData, formatTime, true)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderDataCards(healthData, formatTime, false)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const renderDataCards = (healthData: any, formatTime: (hours: number) => string, isSimulated: boolean) => {
  return (
    <>
      <DataCard
        title="Heart Rate"
        value={`${healthData.heartRate.current}`}
        unit="BPM"
        description={`Range: ${healthData.heartRate.min}-${healthData.heartRate.max} BPM`}
        trend="stable"
        color="red"
        simulated={isSimulated || !healthData.heartRate.isReal}
      />
      
      <DataCard
        title="Heart Rate Variability"
        value={`${healthData.hrv.value}`}
        unit="ms"
        description="Good autonomic balance"
        trend="up"
        color="blue"
        simulated={isSimulated || !healthData.hrv.isReal}
      />
      
      <DataCard
        title="Steps"
        value={`${healthData.steps.count}`}
        unit="steps"
        description={`${Math.round(healthData.steps.count / healthData.steps.goal * 100)}% of daily goal`}
        progress={healthData.steps.count / healthData.steps.goal}
        color="green"
        simulated={isSimulated || !healthData.steps.isReal}
      />
      
      <DataCard
        title="Stress Score"
        value={`${healthData.stress.score}`}
        unit="/100"
        description={`${healthData.stress.level === 'low' ? 'Low' : healthData.stress.level === 'medium' ? 'Medium' : 'High'} stress level`}
        trend={healthData.stress.level === 'low' ? 'down' : healthData.stress.level === 'medium' ? 'stable' : 'up'}
        color="purple"
        simulated={isSimulated || !healthData.stress.isReal}
      />
      
      <DataCard
        title="Sleep Duration"
        value={formatTime(healthData.sleep.duration)}
        description={`Deep: ${formatTime(healthData.sleep.deep)}, REM: ${formatTime(healthData.sleep.rem)}`}
        color="indigo"
        className="md:col-span-2"
        chart={[
          { name: "Deep", value: healthData.sleep.deep / healthData.sleep.duration },
          { name: "REM", value: healthData.sleep.rem / healthData.sleep.duration },
          { name: "Light", value: healthData.sleep.light / healthData.sleep.duration }
        ]}
        simulated={isSimulated || !healthData.sleep.isReal}
      />
    </>
  );
};

export default DataDashboard;
