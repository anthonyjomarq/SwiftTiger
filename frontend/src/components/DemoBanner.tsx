import React from 'react';
import { Info, X } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';

const DemoBanner: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem('demo-banner-dismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('demo-banner-dismissed', 'true');
  };

  if (!isDemoMode || dismissed) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Demo Mode Active
          </h3>
          <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            <p>
              🚀 <strong>Welcome to SwiftTiger Demo!</strong> Explore a complete field service management system with realistic data.
            </p>
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">✨ Try These Features:</h4>
                <ul className="text-xs space-y-1">
                  <li>• View active jobs with real-time progress</li>
                  <li>• Create new jobs and assign technicians</li>
                  <li>• Add detailed job logs with photos</li>
                  <li>• Manage customers across PR locations</li>
                  <li>• Dashboard analytics & reports</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">👥 Demo Credentials:</h4>
                <ul className="text-xs space-y-1">
                  <li>• <strong>Admin:</strong> admin@demo.com</li>
                  <li>• <strong>Manager:</strong> manager@demo.com</li>
                  <li>• <strong>Technician:</strong> tech@demo.com</li>
                  <li>• <strong>Password:</strong> demo123</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs">
                💾 Data persists in browser storage • 🔄 Reset anytime in settings • 📱 Fully responsive design
              </p>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md bg-blue-50 dark:bg-blue-900/20 p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;