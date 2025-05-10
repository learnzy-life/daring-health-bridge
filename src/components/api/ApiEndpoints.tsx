
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { useBluetooth } from "@/context/BluetoothContext";
import { toast } from "sonner";
import { createApiService } from "@/services/apiService";

interface ApiEndpoint {
  name: string;
  path: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  requiresBody?: boolean;
  bodyExample?: string;
}

const ApiEndpoints = () => {
  const { getApiData, hasRealData } = useData();
  const { isConnected, startMeasurement, stopMeasurement } = useBluetooth();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  
  const endpoints: ApiEndpoint[] = [
    { 
      name: "Status", 
      path: "/api/status", 
      description: "Returns connection and device status",
      endpoint: "status",
      method: "GET",
    },
    { 
      name: "Heart Rate", 
      path: "/api/heart-rate", 
      description: "Returns the current heart rate data",
      endpoint: "heart-rate",
      method: "GET",
    },
    { 
      name: "Heart Rate Variability", 
      path: "/api/hrv", 
      description: "Returns the latest HRV data",
      endpoint: "hrv",
      method: "GET",
    },
    { 
      name: "Stress Score", 
      path: "/api/stress", 
      description: "Returns the current stress score",
      endpoint: "stress",
      method: "GET",
    },
    { 
      name: "Sleep Data", 
      path: "/api/sleep", 
      description: "Returns the latest sleep data",
      endpoint: "sleep",
      method: "GET",
    },
    { 
      name: "Step Count", 
      path: "/api/steps", 
      description: "Returns the current step count",
      endpoint: "steps",
      method: "GET",
    },
    { 
      name: "Device Info", 
      path: "/api/device-info", 
      description: "Returns device information",
      endpoint: "device-info",
      method: "GET",
    },
    { 
      name: "Start Measurement", 
      path: "/api/measure/start", 
      description: "Start a real-time measurement",
      endpoint: "measure-start",
      method: "POST",
      requiresBody: true,
      bodyExample: '{ "metric": "hrv" }'
    },
    { 
      name: "Stop Measurement", 
      path: "/api/measure/stop", 
      description: "Stop a real-time measurement",
      endpoint: "measure-stop",
      method: "POST",
      requiresBody: true,
      bodyExample: '{ "metric": "hrv" }'
    },
    { 
      name: "Sync Data", 
      path: "/api/sync", 
      description: "Force data synchronization",
      endpoint: "sync",
      method: "POST",
    },
  ];

  const handleGetData = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    
    const apiService = createApiService();
    
    let result;
    switch (endpoint) {
      case "status":
        result = apiService.getStatus();
        break;
      case "heart-rate":
        result = apiService.getHeartRate();
        break;
      case "hrv":
        result = apiService.getHrv();
        break;
      case "stress":
        result = apiService.getStress();
        break;
      case "sleep":
        result = apiService.getSleep();
        break;
      case "steps":
        result = apiService.getSteps();
        break;
      case "device-info":
        result = getApiData("device-info");
        break;
      case "measure-start":
        // Show an example response for this endpoint
        result = {
          success: true,
          message: "Started measuring hrv",
          note: "This is an example response. In a real API call, you would specify the metric in the request body."
        };
        break;
      case "measure-stop":
        // Show an example response for this endpoint
        result = {
          success: true,
          message: "Stopped measuring hrv",
          note: "This is an example response. In a real API call, you would specify the metric in the request body."
        };
        break;
      case "sync":
        // Show an example response for this endpoint
        result = {
          success: true,
          message: "Data synchronized successfully",
          note: "This is an example response."
        };
        break;
      default:
        result = getApiData(endpoint);
    }
    
    setResponseData(result);
  };

  const handleCopyUrl = (path: string) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${path}`;
    
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success("API URL copied to clipboard");
    }).catch(err => {
      toast.error("Failed to copy URL");
      console.error("Failed to copy URL: ", err);
    });
  };
  
  const handleTestEndpoint = async (endpoint: ApiEndpoint) => {
    if (endpoint.method === "POST" && endpoint.requiresBody) {
      // For POST endpoints with body, just show the expected body
      handleGetData(endpoint.endpoint);
    } else {
      // For GET endpoints, fetch the data
      handleGetData(endpoint.endpoint);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gray-50">
        <CardTitle>API Endpoints</CardTitle>
        <CardDescription>
          Access your ring data through these RESTful API endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Available Endpoints</h3>
            <div className="space-y-2">
              {endpoints.map((endpoint) => (
                <div 
                  key={endpoint.path} 
                  className="border rounded-md p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          endpoint.method === "GET" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {endpoint.method}
                        </span>
                        <h4 className="font-medium text-sm">{endpoint.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500">{endpoint.path}</p>
                      <p className="text-xs text-gray-600 mt-1">{endpoint.description}</p>
                      {endpoint.requiresBody && (
                        <div className="mt-2 p-1.5 bg-gray-50 rounded border text-xs font-mono">
                          {endpoint.bodyExample}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestEndpoint(endpoint)}
                        disabled={!isConnected && endpoint.endpoint !== "status"}
                      >
                        Test
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopyUrl(endpoint.path)}
                      >
                        Copy URL
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Response Preview</h3>
            <div className="border rounded-md bg-gray-50 p-3 h-full min-h-[300px]">
              {!isConnected && selectedEndpoint !== "status" ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <p>Connect your device to test API endpoints</p>
                </div>
              ) : !selectedEndpoint ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <p>Select an endpoint to view response</p>
                </div>
              ) : (
                <pre className="text-xs overflow-auto p-2 bg-gray-900 text-gray-100 rounded h-full">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium mb-3">API Documentation</h3>
          <p className="text-sm text-gray-600">
            To use these endpoints, make a GET or POST request to the corresponding URL. 
            All responses are returned in JSON format. Ensure your smart ring is connected and 
            data has been synced before making API calls.
          </p>
          
          <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800">Real-time Data Access</h4>
            <p className="text-xs text-blue-700 mt-1">
              Use the Start/Stop Measurement endpoints to control real-time data collection from the ring.
              Currently supported metrics: "heartRate", "hrv", "stress", and "bloodOxygen".
            </p>
          </div>
          
          <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800">Integration with Learnzy</h4>
            <p className="text-xs text-blue-700 mt-1">
              To integrate with Learnzy platform, provide these API endpoints in the Learnzy configuration.
              The bridge will handle authentication and data formatting automatically.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiEndpoints;
