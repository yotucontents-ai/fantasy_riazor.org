import { useEffect, useState } from 'react';

function getTimeLeft(deadline: Date | null) {
  if (!deadline) return null;
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    urgent: diff < 3600000,
  };
}

export function Countdown({ deadline }: { deadline: Date | null }) {
  const [t, setT] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!t) return <span className="countdown-expired">Cerrado</span>;

  const cls = `countdown${t.urgent ? ' countdown-urgent' : ''}`;

  if (t.d > 0) {
    return <span className={cls}>{t.d}d {t.h}h {t.m}m</span>;
  }
  return (
    <span className={cls}>
      {String(t.h).padStart(2, '0')}:{String(t.m).padStart(2, '0')}:{String(t.s).padStart(2, '0')}
    </span>
  );
}
