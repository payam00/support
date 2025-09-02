import { useState, useEffect } from 'react';

export const useCountdown = (initialSeconds: number) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [seconds]);

  const start = () => {
    setSeconds(initialSeconds);
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return { minutes, remainingSeconds, isRunning: seconds > 0, start };
};