import { useCallback, useEffect, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { MyEleven } from '../components/myEleven/MyEleven';
import { Squad } from '../components/Squad';
import { Ranking } from '../components/Ranking';
import { Footer } from '../components/Footer';
import { getOpenRound, getRanking } from '../firebase/db';
import { useAuth } from '../context/AuthContext';
import type { Round } from '../types';

export function HomePage() {
  const { appUser } = useAuth();
  const [round, setRound] = useState<Round | null>(null);
  const [pickedCount, setPickedCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);

  useEffect(() => {
    getOpenRound().then(r => setRound(r));
    getRanking().then(r => setParticipantsCount(r.length));
  }, []);

  const handlePickedCountChange = useCallback((n: number) => setPickedCount(n), []);

  return (
    <>
      <NavBar currentRound={round?.number} />
      <Hero
        round={round}
        pickedCount={pickedCount}
        totalScore={appUser?.totalPoints ?? 0}
        participantsCount={participantsCount}
      />
      <HowItWorks />
      <MyEleven
        round={round}
        onPickedCountChange={handlePickedCountChange}
      />
      <Squad />
      <Ranking />
      <Footer />
    </>
  );
}
