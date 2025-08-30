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
              You're using SwiftTiger in demo mode. All features work with sample data stored locally.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Add, edit, and delete customers with demo addresses</li>
              <li>Create and manage jobs with full scheduling</li>
              <li>View interactive dashboard with live statistics</li>
              <li>Manage users and roles</li>
              <li>Data persists in your browser's local storage</li>
            </ul>
            <p className="mt-2 text-xs">
              <strong>Note:</strong> Route Optimizer and Audit Logs are hidden in demo mode.
            </p>
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