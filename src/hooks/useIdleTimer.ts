import { useEffect, useRef } from 'react';

export const useIdleTimer = (onIdle: () => void, timeout: number = 15 * 60 * 1000) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(onIdle, timeout);
  };

  useEffect(() => {
    // Daftar aktivitas yang dianggap "user masih aktif"
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    // Pasang listener di window
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Mulai timer pertama kali
    resetTimer();

    // Bersihkan timer dan listener saat komponen unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onIdle, timeout]);
};