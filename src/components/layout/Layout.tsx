
import React from "react";
import { Toaster } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-teal-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-white/60"></div>
            </div>
            <span className="font-bold text-lg">Daring Health Bridge</span>
          </div>
          <div className="text-sm">
            <span className="bg-teal-700 py-1 px-3 rounded-full">Prototype v1.0</span>
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
      <footer className="py-4 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; 2025 Daring Health Bridge - A data bridge between Daring smart rings and Learnzy
        </div>
      </footer>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
