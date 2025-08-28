import React, { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncementsProps {
  message: string;
  priority: 'polite' | 'assertive';
  clearAfter?: number; // Clear message after X milliseconds
}

export const ScreenReaderAnnouncements: React.FC<ScreenReaderAnnouncementsProps> = ({
  message,
  priority = 'polite',
  clearAfter = 5000
}) => {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcementRef.current) {
      // Update the announcement
      announcementRef.current.textContent = message;

      // Clear the announcement after specified time
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = '';
          }
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={announcementRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
};

// Hook for managing screen reader announcements
export const useScreenReaderAnnouncements = () => {
  const [announcement, setAnnouncement] = React.useState<{
    message: string;
    priority: 'polite' | 'assertive';
  } | null>(null);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, priority });
  }, []);

  const clear = React.useCallback(() => {
    setAnnouncement(null);
  }, []);

  return {
    announcement,
    announce,
    clear
  };
};

export default ScreenReaderAnnouncements;