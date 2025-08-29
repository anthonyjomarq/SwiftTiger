import React, { useState } from 'react';
import { Settings, Eye, Type, Volume2, X } from 'lucide-react';
import { useAccessibility } from '../hooks/useAccessibility';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ isOpen, onClose }) => {
  const { preferences, updateFontSize, toggleHighContrast, toggleReduceMotion } = useAccessibility();
  const [announcements, setAnnouncements] = useState(true);

  if (!isOpen) return null;

  const fontSizeOptions = [
    { value: 'small', label: 'Small', description: '14px base size' },
    { value: 'medium', label: 'Medium', description: '16px base size (default)' },
    { value: 'large', label: 'Large', description: '18px base size' },
    { value: 'extra-large', label: 'Extra Large', description: '20px base size' }
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md mx-4"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 id="accessibility-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              Accessibility Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close accessibility settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p id="accessibility-description" className="text-gray-600 dark:text-gray-300 text-sm">
            Customize the interface to better suit your accessibility needs.
          </p>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Font Size
              </h3>
            </div>
            
            <fieldset className="space-y-2">
              <legend className="sr-only">Choose font size</legend>
              {fontSizeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="fontSize"
                    value={option.value}
                    checked={preferences.fontSize === option.value}
                    onChange={() => updateFontSize(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </fieldset>
          </div>

          {/* Visual Preferences */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Visual Preferences
              </h3>
            </div>

            {/* High Contrast */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  High Contrast Mode
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Increases contrast for better visibility
                </div>
              </div>
              <button
                type="button"
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  preferences.highContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={preferences.highContrast}
                aria-describedby="high-contrast-description"
              >
                <span className="sr-only">Toggle high contrast mode</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                    preferences.highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            {/* Reduce Motion */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Reduce Motion
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Minimizes animations and transitions
                </div>
              </div>
              <button
                type="button"
                onClick={toggleReduceMotion}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  preferences.reduceMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={preferences.reduceMotion}
                aria-describedby="reduce-motion-description"
              >
                <span className="sr-only">Toggle reduced motion</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                    preferences.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Audio Preferences */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Audio Preferences
              </h3>
            </div>

            {/* Screen Reader Announcements */}
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Screen Reader Announcements
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Announces important updates and changes
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncements(!announcements)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  announcements ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={announcements}
              >
                <span className="sr-only">Toggle screen reader announcements</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                    announcements ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Keyboard Navigation Tips */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Keyboard Navigation Tips
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Press Tab to move forward through interactive elements</li>
              <li>• Press Shift+Tab to move backward</li>
              <li>• Press Enter or Space to activate buttons</li>
              <li>• Press Escape to close dialogs and menus</li>
              <li>• Use arrow keys in menus and form controls</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Settings are saved automatically
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessibilitySettings;