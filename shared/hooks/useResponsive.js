/**
 * Responsive Utilities Hook
 * Provides device detection and responsive utilities
 */

import { useState, useEffect } from 'react';
import { BREAKPOINTS, DEVICE_TYPES } from '../types/index.js';

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [deviceType, setDeviceType] = useState(DEVICE_TYPES.DESKTOP);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine device type based on screen size and touch capability
      if (width <= BREAKPOINTS.SM) {
        setDeviceType(DEVICE_TYPES.MOBILE);
      } else if (width <= BREAKPOINTS.LG) {
        setDeviceType(DEVICE_TYPES.TABLET);
      } else {
        setDeviceType(DEVICE_TYPES.DESKTOP);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive utility functions
  const isMobile = deviceType === DEVICE_TYPES.MOBILE;
  const isTablet = deviceType === DEVICE_TYPES.TABLET;
  const isDesktop = deviceType === DEVICE_TYPES.DESKTOP;
  
  const isXS = screenSize.width < BREAKPOINTS.XS;
  const isSM = screenSize.width >= BREAKPOINTS.SM && screenSize.width < BREAKPOINTS.MD;
  const isMD = screenSize.width >= BREAKPOINTS.MD && screenSize.width < BREAKPOINTS.LG;
  const isLG = screenSize.width >= BREAKPOINTS.LG && screenSize.width < BREAKPOINTS.XL;
  const isXL = screenSize.width >= BREAKPOINTS.XL;

  // Media query helpers
  const isAbove = (breakpoint) => screenSize.width >= BREAKPOINTS[breakpoint.toUpperCase()];
  const isBelow = (breakpoint) => screenSize.width < BREAKPOINTS[breakpoint.toUpperCase()];
  const isBetween = (min, max) => 
    screenSize.width >= BREAKPOINTS[min.toUpperCase()] && 
    screenSize.width < BREAKPOINTS[max.toUpperCase()];

  return {
    screenSize,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isXS,
    isSM,
    isMD,
    isLG,
    isXL,
    isAbove,
    isBelow,
    isBetween,
  };
};

// Touch detection hook
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  return isTouch;
};

// Orientation hook
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
};

// Safe area hook for mobile devices
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      if (typeof window !== 'undefined' && 'getComputedStyle' in window) {
        const style = getComputedStyle(document.documentElement);
        
        setSafeArea({
          top: parseInt(style.getPropertyValue('--sat') || '0', 10),
          right: parseInt(style.getPropertyValue('--sar') || '0', 10),
          bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
          left: parseInt(style.getPropertyValue('--sal') || '0', 10),
        });
      }
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};

export default useResponsive;