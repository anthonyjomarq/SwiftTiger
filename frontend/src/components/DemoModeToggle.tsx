import React from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import { AlertTriangle, MapPin, Map } from 'lucide-react';

const DemoModeToggle: React.FC = () => {
  const { isDemoMode, toggleDemoMode, showGoogleApiWarning, setShowGoogleApiWarning } = useDemoMode();
  const hasGoogleApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {isDemoMode ? <MapPin className="w-5 h-5 text-blue-500 mr-2" /> : <Map className="w-5 h-5 text-green-500 mr-2" />}
            <span className="font-medium text-sm">
              {isDemoMode ? 'Demo Mode' : 'Live Mode'}
            </span>
          </div>
          
          <button
            onClick={toggleDemoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isDemoMode 
                ? 'bg-blue-600' 
                : hasGoogleApiKey 
                  ? 'bg-green-600' 
                  : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!isDemoMode && !hasGoogleApiKey}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDemoMode ? 'translate-x-1' : 'translate-x-6'
              }`}
            />
          </button>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {isDemoMode 
            ? 'Maps show demo data only' 
            : hasGoogleApiKey 
              ? 'Using live Google Maps API'
              : 'Google API key required for live mode'
          }
        </p>
        
        {!hasGoogleApiKey && !isDemoMode && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
            <div>
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">API Key Required</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Add VITE_GOOGLE_MAPS_API_KEY to enable live maps
              </p>
            </div>
          </div>
        )}
      </div>
      
      {showGoogleApiWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Google API Required
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Live mode requires a Google Maps API key. Without it, you'll see broken maps and address features won't work.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                  VITE_GOOGLE_MAPS_API_KEY=your_key_here
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDemoMode(true);
                  setShowGoogleApiWarning(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Use Demo Mode
              </button>
              
              <button
                onClick={() => setShowGoogleApiWarning(false)}
                className="px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoModeToggle;