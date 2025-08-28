import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';

interface JobTimerProps {
  jobId: string;
  initialStartTime?: Date | null;
  onTimeUpdate?: (startTime: Date, currentTime: Date) => void;
  onTimerStart?: (startTime: Date) => void;
  onTimerStop?: (startTime: Date, endTime: Date, duration: number) => void;
  disabled?: boolean;
}

const JobTimer: React.FC<JobTimerProps> = ({
  jobId,
  initialStartTime,
  onTimeUpdate,
  onTimerStart,
  onTimerStop,
  disabled = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(initialStartTime || null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Calculate elapsed time
  useEffect(() => {
    if (startTime) {
      const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }
  }, [startTime, currentTime]);

  // Timer interval
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        onTimeUpdate?.(startTime, now);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime, onTimeUpdate]);

  // Initialize from props
  useEffect(() => {
    if (initialStartTime) {
      setStartTime(initialStartTime);
      setIsRunning(true);
    }
  }, [initialStartTime]);

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setCurrentTime(now);
    setIsRunning(true);
    onTimerStart?.(now);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      setIsRunning(false);
      onTimerStop?.(startTime, endTime, duration);
      
      // Reset timer
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isRunning) return 'text-green-600 dark:text-green-400';
    if (startTime && !isRunning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Work Timer
          </h3>
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {isRunning ? 'Running' : startTime ? 'Paused' : 'Stopped'}
        </div>
      </div>

      {/* Time Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
          {formatTime(elapsedTime)}
        </div>
        {startTime && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Started at {startTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-3">
        {!startTime ? (
          <button
            onClick={handleStart}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Timer</span>
          </button>
        ) : (
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                disabled={disabled}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                disabled={disabled}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            )}
            
            <button
              onClick={handleStop}
              disabled={disabled}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </>
        )}
      </div>

      {/* Duration Summary */}
      {elapsedTime > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Elapsed Time:</span>
              <span className="font-medium">{formatTime(elapsedTime)}</span>
            </div>
            {elapsedTime >= 3600 && (
              <div className="flex justify-between mt-1">
                <span>Hours:</span>
                <span className="font-medium">{(elapsedTime / 3600).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTimer;