import { useEffect, useRef, useState } from 'react';

interface ToastMsg { text: string; type: 'ok' | 'warn'; }

let _setToast: ((msg: ToastMsg) => void) | null = null;

export function showToast(text: string, type: 'ok' | 'warn' = 'ok') {
  _setToast?.({ text, type });
}

export function Toast() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    _setToast = (m) => {
      setMsg(m);
      setVisible(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 3000);
    };
    return () => { _setToast = null; };
  }, []);

  return (
    <div className={`toast${msg ? ` ${msg.type}` : ''}${visible ? ' show' : ''}`}>
      {msg?.text}
    </div>
  );
}
