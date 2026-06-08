import { useCallback, useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { BottomNav, type Tab } from '../components/BottomNav';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { MyEleven } from '../components/myEleven/MyEleven';
import { Squad } from '../components/Squad';
import { Ranking } from '../components/Ranking';
import { Footer } from '../components/Footer';
import { PredictionViewModal } from '../components/PredictionViewModal';
import { getLatestRound } from '../firebase/db';
import { useAuth } from '../context/AuthContext';
import type { Round } from '../types';

export function HomePage() {
  const { appUser } = useAuth();
  const [tab, setTab] = useState<Tab>('inicio');
  const [round, setRound] = useState<Round | null>(null);
  const [pickedCount, setPickedCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [viewUid, setViewUid] = useState<string | null>(null);
  const [viewName, setViewName] = useState('');

  useEffect(() => {
    getLatestRound().then(r => setRound(r));
  }, []);

  const handlePickedCountChange = useCallback((n: number) => setPickedCount(n), []);

  function handleViewPrediction(uid: string, name: string) {
    setViewUid(uid);
    setViewName(name);
  }

  return (
    <div className="app-shell">
      <TopBar round={round} />

      <main className="app-content">
        <div className={`tab-pane${tab === 'inicio' ? ' active' : ''}`}>
          <Hero
            round={round}
            pickedCount={pickedCount}
            totalScore={appUser?.totalPoints ?? 0}
            participantsCount={participantsCount}
            onNavigate={setTab}
          />
          <HowItWorks />
          <Footer />
        </div>

        <div className={`tab-pane${tab === 'once' ? ' active' : ''}`}>
          <MyEleven round={round} onPickedCountChange={handlePickedCountChange} />
        </div>

        <div className={`tab-pane${tab === 'plantilla' ? ' active' : ''}`}>
          <Squad />
        </div>

        <div className={`tab-pane${tab === 'ranking' ? ' active' : ''}`}>
          <Ranking round={round} onViewPrediction={handleViewPrediction} onParticipantsCount={setParticipantsCount} />
          <Footer />
        </div>
      </main>

      <BottomNav
        active={tab}
        onChange={setTab}
        isAdmin={appUser?.role === 'admin'}
      />

      <PredictionViewModal
        uid={viewUid}
        userName={viewName}
        currentRound={round}
        onClose={() => setViewUid(null)}
      />
    </div>
  );
}
