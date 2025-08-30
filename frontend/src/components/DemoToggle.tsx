import React from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';

const DemoToggle: React.FC = () => {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center">
      <label className="flex items-center cursor-pointer">
        <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Demo
        </span>
        <div className="relative">
          <input
            type="checkbox"
            checked={isDemoMode}
            onChange={toggleDemoMode}
            className="sr-only"
          />
          <div
            className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
              isDemoMode 
                ? 'bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                isDemoMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </label>
    </div>
  );
};

export default DemoToggle;