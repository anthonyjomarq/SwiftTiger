import { useEffect, useState } from 'react';

interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  screenReader: boolean;
}

export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
    screenReader: false
  });

  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    // Detect system preferences
    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      screenReader: window.matchMedia('(prefers-reduced-motion: reduce)') // Proxy for screen reader usage
    };

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        screenReader: mediaQueries.screenReader.matches
      }));
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    // Cleanup
    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  useEffect(() => {
    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    // Apply accessibility preferences to document
    const root = document.documentElement;

    // Reduce motion
    if (preferences.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${preferences.fontSize}`);
  }, [preferences]);

  const updateFontSize = (size: AccessibilityPreferences['fontSize']) => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
    localStorage.setItem('accessibility-font-size', size);
  };

  const toggleHighContrast = () => {
    const newValue = !preferences.highContrast;
    setPreferences(prev => ({ ...prev, highContrast: newValue }));
    localStorage.setItem('accessibility-high-contrast', String(newValue));
  };

  const toggleReduceMotion = () => {
    const newValue = !preferences.reduceMotion;
    setPreferences(prev => ({ ...prev, reduceMotion: newValue }));
    localStorage.setItem('accessibility-reduce-motion', String(newValue));
  };

  // Load saved preferences
  useEffect(() => {
    const savedFontSize = localStorage.getItem('accessibility-font-size') as AccessibilityPreferences['fontSize'];
    const savedHighContrast = localStorage.getItem('accessibility-high-contrast') === 'true';
    const savedReduceMotion = localStorage.getItem('accessibility-reduce-motion') === 'true';

    if (savedFontSize) {
      setPreferences(prev => ({ ...prev, fontSize: savedFontSize }));
    }
    if (savedHighContrast !== null) {
      setPreferences(prev => ({ ...prev, highContrast: savedHighContrast }));
    }
    if (savedReduceMotion !== null) {
      setPreferences(prev => ({ ...prev, reduceMotion: savedReduceMotion }));
    }
  }, []);

  return {
    preferences,
    isKeyboardUser,
    updateFontSize,
    toggleHighContrast,
    toggleReduceMotion
  };
};

export default useAccessibility;