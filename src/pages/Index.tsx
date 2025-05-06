
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import DeviceConnection from "@/components/bluetooth/DeviceConnection";
import DataDashboard from "@/components/dashboard/DataDashboard";
import ApiEndpoints from "@/components/api/ApiEndpoints";
import { BluetoothProvider } from "@/context/BluetoothContext";
import { DataProvider } from "@/context/DataContext";

const Index = () => {
  return (
    <BluetoothProvider>
      <DataProvider>
        <Layout>
          <div className="container mx-auto px-4 py-6">
            <header className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Ring Data Bridge</h1>
              <p className="text-gray-600">Connect your Daring smart ring and expose health data to Learnzy</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <DeviceConnection />
              </div>
              <div className="md:col-span-2">
                <DataDashboard />
              </div>
            </div>
            
            <div className="mt-8">
              <ApiEndpoints />
            </div>
          </div>
        </Layout>
      </DataProvider>
    </BluetoothProvider>
  );
};

export default Index;
