import { useState, useEffect, useCallback } from 'react';

export function useNightMode() {
  const [isNight, setIsNight] = useState(false);

  const checkNightTime = useCallback((): boolean => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 22 || hour < 8;
  }, []);

  const getNextWorkTime = useCallback((): Date => {
    const now = new Date();
    const nextWorkTime = new Date(now);
    
    if (now.getHours() >= 22) {
      nextWorkTime.setDate(nextWorkTime.getDate() + 1);
    }
    nextWorkTime.setHours(8, 30, 0, 0);
    
    return nextWorkTime;
  }, []);

  useEffect(() => {
    setIsNight(checkNightTime());
    
    const interval = setInterval(() => {
      setIsNight(checkNightTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [checkNightTime]);

  return { isNightMode: isNight, isNightTime: isNight, getNextWorkTime };
}
