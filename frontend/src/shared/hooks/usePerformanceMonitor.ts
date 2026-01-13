import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  navigationTiming: PerformanceNavigationTiming | null;
  paintTiming: PerformancePaintTiming[];
  resourceTiming: PerformanceResourceTiming[];
  memoryUsage: any;
  connectionInfo: any;
  vitals: {
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
    fcp: number | null; // First Contentful Paint
    ttfb: number | null; // Time to First Byte
  };
}

interface ComponentPerformance {
  name: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
}

export const usePerformanceMonitor = (componentName?: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    navigationTiming: null,
    paintTiming: [],
    resourceTiming: [],
    memoryUsage: null,
    connectionInfo: null,
    vitals: {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null
    }
  });

  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformance | null>(null);
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number | null>(null);
  const updateCount = useRef<number>(0);

  // Component performance tracking
  useEffect(() => {
    if (componentName) {
      const mountEndTime = Date.now();
      mountTime.current = mountEndTime - renderStartTime.current;
      
      setComponentMetrics({
        name: componentName,
        renderTime: mountEndTime - renderStartTime.current,
        mountTime: mountTime.current,
        updateCount: updateCount.current
      });
    }
  }, [componentName]);

  // Track component updates
  useEffect(() => {
    updateCount.current += 1;
    
    if (componentMetrics) {
      setComponentMetrics(prev => prev ? {
        ...prev,
        updateCount: updateCount.current
      } : null);
    }
  });

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Navigation timing
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // Paint timing
      const paintTiming = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      
      // Resource timing
      const resourceTiming = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Memory usage (Chrome only)
      const memoryUsage = (performance as any).memory || null;
      
      // Connection info
      const connectionInfo = (navigator as any).connection || null;

      // Core Web Vitals
      const vitals = {
        lcp: null as number | null,
        fid: null as number | null,
        cls: null as number | null,
        fcp: paintTiming.find(entry => entry.name === 'first-contentful-paint')?.startTime || null,
        ttfb: navigationTiming?.responseStart - navigationTiming?.requestStart || null
      };

      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }

      // CLS (Cumulative Layout Shift)
      if ('PerformanceObserver' in window) {
        try {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }

      setMetrics({
        navigationTiming,
        paintTiming,
        resourceTiming,
        memoryUsage,
        connectionInfo,
        vitals
      });
    } catch (error) {
      console.warn('Performance monitoring error:', error);
    }
  }, []);

  // Collect metrics on mount and periodically
  useEffect(() => {
    collectMetrics();
    
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [collectMetrics]);

  // Performance utilities
  const markStart = useCallback((name: string) => {
    if (typeof window !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }, []);

  const markEnd = useCallback((name: string) => {
    if (typeof window !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }, []);

  const getMeasures = useCallback(() => {
    if (typeof window === 'undefined') return [];
    return performance.getEntriesByType('measure');
  }, []);

  const clearMarks = useCallback(() => {
    if (typeof window !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }, []);

  // Get performance score (0-100)
  const getPerformanceScore = useCallback((): number => {
    const { vitals } = metrics;
    let score = 100;

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s)
    if (vitals.lcp) {
      if (vitals.lcp > 4000) score -= 30;
      else if (vitals.lcp > 2500) score -= 15;
    }

    // FCP scoring (Good: <1.8s, Needs Improvement: 1.8s-3s, Poor: >3s)
    if (vitals.fcp) {
      if (vitals.fcp > 3000) score -= 25;
      else if (vitals.fcp > 1800) score -= 10;
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (vitals.cls !== null) {
      if (vitals.cls > 0.25) score -= 25;
      else if (vitals.cls > 0.1) score -= 10;
    }

    // TTFB scoring (Good: <800ms, Needs Improvement: 800ms-1800ms, Poor: >1800ms)
    if (vitals.ttfb) {
      if (vitals.ttfb > 1800) score -= 20;
      else if (vitals.ttfb > 800) score -= 10;
    }

    return Math.max(0, score);
  }, [metrics]);

  // Get recommendations based on metrics
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    const { vitals, resourceTiming } = metrics;

    if (vitals.lcp && vitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing critical resources');
    }

    if (vitals.fcp && vitals.fcp > 1800) {
      recommendations.push('Improve First Contentful Paint by eliminating render-blocking resources and optimizing CSS');
    }

    if (vitals.cls !== null && vitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and avoiding dynamic content injection');
    }

    if (vitals.ttfb && vitals.ttfb > 800) {
      recommendations.push('Optimize Time to First Byte by improving server response times and using CDN');
    }

    // Check for large resources
    const largeResources = resourceTiming.filter(resource => resource.transferSize > 1024 * 1024); // 1MB+
    if (largeResources.length > 0) {
      recommendations.push(`Optimize ${largeResources.length} large resources (>1MB) by compressing or lazy loading`);
    }

    // Check for slow resources
    const slowResources = resourceTiming.filter(resource => resource.duration > 2000); // 2s+
    if (slowResources.length > 0) {
      recommendations.push(`Optimize ${slowResources.length} slow-loading resources (>2s) by using faster servers or CDN`);
    }

    return recommendations;
  }, [metrics]);

  // Export performance data
  const exportMetrics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      componentMetrics,
      performanceScore: getPerformanceScore(),
      recommendations: getRecommendations(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metrics, componentMetrics, getPerformanceScore, getRecommendations]);

  return {
    metrics,
    componentMetrics,
    markStart,
    markEnd,
    getMeasures,
    clearMarks,
    getPerformanceScore,
    getRecommendations,
    exportMetrics,
    collectMetrics
  };
};

// Hook for measuring component render time
export const useRenderTime = (componentName: string) => {
  const startTime = useRef<number>(performance.now());
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    setRenderTime(duration);
    
    // Log slow renders (>16ms for 60fps)
    if (duration > 16) {
      console.warn(`Slow render detected for ${componentName}: ${duration.toFixed(2)}ms`);
    }
  }, [componentName]);

  return renderTime;
};

// Hook for monitoring API call performance
export const useAPIPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<Map<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    errors: number;
  }>>(new Map());

  const trackAPICall = useCallback(async <T>(
    url: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      setApiMetrics(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(url) || { count: 0, totalTime: 0, averageTime: 0, errors: 0 };
        
        const newMetric = {
          count: existing.count + 1,
          totalTime: existing.totalTime + duration,
          averageTime: (existing.totalTime + duration) / (existing.count + 1),
          errors: existing.errors
        };
        
        newMap.set(url, newMetric);
        return newMap;
      });

      return result;
    } catch (error) {
      setApiMetrics(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(url) || { count: 0, totalTime: 0, averageTime: 0, errors: 0 };
        
        const newMetric = {
          ...existing,
          errors: existing.errors + 1
        };
        
        newMap.set(url, newMetric);
        return newMap;
      });

      throw error;
    }
  }, []);

  return { apiMetrics, trackAPICall };
};

export default usePerformanceMonitor;