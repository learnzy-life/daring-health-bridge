
// Type definitions for Web Bluetooth API
// These are missing from the standard TypeScript library

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface BluetoothRequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

interface BluetoothLEScanFilter {
  services?: string[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: BluetoothManufacturerData[];
  serviceData?: BluetoothServiceData[];
}

interface BluetoothManufacturerData {
  companyIdentifier: number;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

interface BluetoothServiceData {
  service: string;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

interface Navigator {
  bluetooth?: {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
    getAvailability(): Promise<boolean>;
  };
}

// Custom event types for health data updates
interface HealthDataUpdateEvent extends CustomEvent {
  detail: {
    type: string;
    data: any;
  };
}

// Types for measurement events
interface HeartRateMeasurement {
  current: number;
  timestamp: string;
  isReal: boolean;
}

interface HrvMeasurement {
  value: number;
  timestamp: string;
  isReal: boolean;
}

interface StressMeasurement {
  score: number;
  level: "low" | "medium" | "high";
  timestamp: string;
  isReal: boolean;
}

interface BloodOxygenMeasurement {
  percentage: number;
  timestamp: string;
  isReal: boolean;
}

interface TemperatureMeasurement {
  temperature: number;
  timestamp: string;
  isReal: boolean;
}

