
import { useState } from "react";
import { useBluetooth } from "@/context/BluetoothContext";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bluetooth, BluetoothConnected, BluetoothOff, RefreshCw, ActivitySquare, Heart, Brain, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const DeviceConnection = () => {
  const { 
    isConnected, 
    isConnecting, 
    device, 
    batteryLevel, 
    lastSyncTime,
    scanForDevices, 
    connectToDevice, 
    disconnectDevice, 
    syncData,
    availableDevices,
    dataFetchStatus
  } = useBluetooth();
  const { healthData, hasRealData, isMonitoring, startRealTimeMonitoring, stopRealTimeMonitoring } = useData();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleScanClick = async () => {
    await scanForDevices();
  };

  const handleConnectClick = async (device: BluetoothDevice) => {
    await connectToDevice(device);
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await syncData();
    setIsSyncing(false);
  };

  const handleMonitoringToggle = (dataType: string, isEnabled: boolean) => {
    if (isEnabled) {
      startRealTimeMonitoring(dataType);
    } else {
      stopRealTimeMonitoring(dataType);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {isConnected ? 
              <BluetoothConnected className="h-5 w-5 text-blue-600" /> : 
              <Bluetooth className="h-5 w-5 text-gray-600" />
            }
            Device Connection
          </CardTitle>
          {isConnected && batteryLevel !== null && (
            <div className="flex items-center text-sm">
              <div className="bg-gray-200 h-4 w-10 rounded-full relative overflow-hidden">
                <div 
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full", 
                    batteryLevel > 20 ? "bg-green-500" : "bg-red-500"
                  )}
                  style={{ width: `${batteryLevel}%` }}
                />
              </div>
              <span className="ml-2 text-xs">{batteryLevel}%</span>
            </div>
          )}
        </div>
        <CardDescription>
          {isConnected 
            ? `Connected to ${device?.name || "Device"}`
            : "Connect to your smart ring"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={cn(
              "font-medium",
              isConnected ? "text-green-600" : "text-gray-600"
            )}>
              {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          
          {isConnected && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Device Model:</span>
                <span className="font-medium">{healthData.deviceInfo.model}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Firmware:</span>
                <span className="font-medium">{healthData.deviceInfo.firmware}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Synced:</span>
                <span className="font-medium">{lastSyncTime || "Never"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Data Status:</span>
                <span className={cn(
                  "font-medium flex items-center",
                  hasRealData ? "text-green-600" : "text-amber-600"
                )}>
                  {hasRealData ? "Real" : (
                    <>
                      <ActivitySquare className="h-3 w-3 mr-1" />
                      Simulated
                    </>
                  )}
                </span>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-medium mb-2">Real-time Monitoring</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <Label htmlFor="heart-rate-monitor" className="text-sm">Heart Rate</Label>
                    </div>
                    <Switch 
                      id="heart-rate-monitor" 
                      checked={isMonitoring.heartRate}
                      onCheckedChange={(checked) => handleMonitoringToggle('heartRate', checked)}
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <Label htmlFor="hrv-monitor" className="text-sm">Heart Rate Variability</Label>
                    </div>
                    <Switch 
                      id="hrv-monitor" 
                      checked={isMonitoring.hrv}
                      onCheckedChange={(checked) => handleMonitoringToggle('hrv', checked)}
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Footprints className="h-4 w-4 text-green-500" />
                      <Label htmlFor="steps-monitor" className="text-sm">Steps</Label>
                    </div>
                    <Switch 
                      id="steps-monitor" 
                      checked={isMonitoring.steps}
                      onCheckedChange={(checked) => handleMonitoringToggle('steps', checked)} 
                      disabled={!isConnected}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {!isConnected && availableDevices.length > 0 && (
            <div className="border rounded-md p-2 mt-2">
              <h4 className="text-sm font-medium mb-2">Available Devices:</h4>
              <ul className="space-y-2">
                {availableDevices.map(device => (
                  <li key={device.id} className="flex justify-between items-center">
                    <span className="text-sm">{device.name || `Unknown Device (${device.id.substring(0, 8)}...)`}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConnectClick(device)}
                      disabled={isConnecting}
                    >
                      Connect
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {!isConnected ? (
          <Button 
            className="w-full"
            onClick={handleScanClick}
            disabled={isConnecting}
          >
            <Bluetooth className="mr-2 h-4 w-4" />
            {isConnecting ? "Scanning..." : "Scan for All Devices"}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={disconnectDevice}
            >
              <BluetoothOff className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
            <Button 
              onClick={handleSyncClick}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isSyncing ? "Syncing..." : "Sync Data"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default DeviceConnection;
