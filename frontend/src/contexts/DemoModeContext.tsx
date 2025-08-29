import React, { createContext, useContext, useState, useEffect } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  showGoogleApiWarning: boolean;
  setShowGoogleApiWarning: (show: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [showGoogleApiWarning, setShowGoogleApiWarning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('swifttiger-demo-mode');
    if (saved !== null) {
      setIsDemoMode(JSON.parse(saved));
    }
  }, []);

  const toggleDemoMode = () => {
    const newMode = !isDemoMode;
    setIsDemoMode(newMode);
    localStorage.setItem('swifttiger-demo-mode', JSON.stringify(newMode));
    
    if (!newMode && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setShowGoogleApiWarning(true);
    }
  };

  return (
    <DemoModeContext.Provider 
      value={{ 
        isDemoMode, 
        toggleDemoMode, 
        showGoogleApiWarning, 
        setShowGoogleApiWarning 
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};