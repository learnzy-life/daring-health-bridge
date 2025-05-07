
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ActivitySquare } from "lucide-react";

interface ChartItem {
  name: string;
  value: number;
}

interface DataCardProps {
  title: string;
  value: string;
  unit?: string;
  description?: string;
  trend?: "up" | "down" | "stable";
  progress?: number;
  chart?: ChartItem[];
  color?: "blue" | "red" | "green" | "purple" | "indigo" | "orange";
  className?: string;
  simulated?: boolean;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  unit,
  description,
  trend,
  progress,
  chart,
  color = "blue",
  className,
  simulated = false
}) => {
  const getColorClasses = () => {
    switch (color) {
      case "red": return "bg-red-50 text-red-600 border-red-200";
      case "green": return "bg-green-50 text-green-600 border-green-200";
      case "purple": return "bg-purple-50 text-purple-600 border-purple-200";
      case "indigo": return "bg-indigo-50 text-indigo-600 border-indigo-200";
      case "orange": return "bg-orange-50 text-orange-600 border-orange-200";
      default: return "bg-blue-50 text-blue-600 border-blue-200";
    }
  };

  const getProgressColor = () => {
    switch (color) {
      case "red": return "bg-red-500";
      case "green": return "bg-green-500";
      case "purple": return "bg-purple-500";
      case "indigo": return "bg-indigo-500";
      case "orange": return "bg-orange-500";
      default: return "bg-blue-500";
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend === "up") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else if (trend === "down") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }
  };

  return (
    <Card className={cn("shadow-sm overflow-hidden", className, simulated ? "opacity-80" : "")}>
      <CardHeader className={cn("py-3 px-4 border-b", getColorClasses())}>
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <div className="flex items-center">
            {title}
            {simulated && (
              <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full flex items-center">
                <ActivitySquare className="h-3 w-3 mr-1" />
                Simulated
              </span>
            )}
          </div>
          {trend && <span className="flex items-center">{getTrendIcon()}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm ml-1 text-gray-500">{unit}</span>}
        </div>
        
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
        
        {progress !== undefined && (
          <div className="mt-2">
            <Progress 
              value={progress * 100} 
              className={cn("h-2", getProgressColor())}
            />
          </div>
        )}
        
        {chart && (
          <div className="mt-3 flex h-4">
            {chart.map((item, index) => (
              <div 
                key={index}
                className={cn(
                  "h-full",
                  index === 0 ? "bg-indigo-600" : 
                  index === 1 ? "bg-purple-500" : 
                  "bg-blue-400"
                )}
                style={{ width: `${item.value * 100}%` }}
                title={`${item.name}: ${Math.round(item.value * 100)}%`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataCard;
