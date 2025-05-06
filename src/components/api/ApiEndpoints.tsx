
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { useBluetooth } from "@/context/BluetoothContext";
import { toast } from "sonner";

interface ApiEndpoint {
  name: string;
  path: string;
  description: string;
  endpoint: string;
}

const ApiEndpoints = () => {
  const { getApiData } = useData();
  const { isConnected } = useBluetooth();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  
  const endpoints: ApiEndpoint[] = [
    { 
      name: "Heart Rate Variability", 
      path: "/api/hrv", 
      description: "Returns the latest HRV data",
      endpoint: "hrv"
    },
    { 
      name: "Sleep Data", 
      path: "/api/sleep", 
      description: "Returns the latest sleep data",
      endpoint: "sleep"
    },
    { 
      name: "Step Count", 
      path: "/api/steps", 
      description: "Returns the current step count",
      endpoint: "steps"
    },
    { 
      name: "Heart Rate", 
      path: "/api/heart-rate", 
      description: "Returns the current heart rate",
      endpoint: "heart-rate"
    },
    { 
      name: "Stress Score", 
      path: "/api/stress", 
      description: "Returns the current stress score",
      endpoint: "stress"
    },
    { 
      name: "Device Info", 
      path: "/api/device-info", 
      description: "Returns device information",
      endpoint: "device-info"
    },
  ];

  const handleGetData = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
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
                      <h4 className="font-medium text-sm">{endpoint.name}</h4>
                      <p className="text-xs text-gray-500">{endpoint.path}</p>
                      <p className="text-xs text-gray-600 mt-1">{endpoint.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGetData(endpoint.endpoint)}
                        disabled={!isConnected}
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
              {!isConnected ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <p>Connect your device to test API endpoints</p>
                </div>
              ) : !selectedEndpoint ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <p>Select an endpoint to view response</p>
                </div>
              ) : (
                <pre className="text-xs overflow-auto p-2 bg-gray-900 text-gray-100 rounded h-full">
                  {JSON.stringify(getApiData(selectedEndpoint), null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium mb-3">API Documentation</h3>
          <p className="text-sm text-gray-600">
            To use these endpoints, make a GET request to the corresponding URL. 
            All responses are returned in JSON format. Ensure your Daring smart ring is connected and 
            data has been synced before making API calls.
          </p>
          
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
