import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, orderBy, getDocs, Timestamp, where, writeBatch, increment,
} from 'firebase/firestore';
import { db } from './config';
import type { AppUser, Round, Prediction, RankingEntry } from '../types';

// ─── Users ───────────────────────────────────────────
export async function createUserDoc(uid: string, displayName: string, email: string) {
  await setDoc(doc(db, 'users', uid), {
    uid, displayName, email,
    role: 'user',
    totalPoints: 0,
    createdAt: Timestamp.now(),
  });
}

export async function getUserDoc(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { ...d, createdAt: d.createdAt.toDate() } as AppUser;
}

// ─── Rounds ───────────────────────────────────────────
export async function getRounds(): Promise<Round[]> {
  const q = query(collection(db, 'rounds'), orderBy('number', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      deadline: data.deadline.toDate(),
    } as Round;
  });
}

export async function getOpenRound(): Promise<Round | null> {
  const q = query(collection(db, 'rounds'), where('status', '==', 'open'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return { ...data, id: d.id, deadline: data.deadline.toDate() } as Round;
}

export async function createRound(round: Omit<Round, 'id'>) {
  const ref = doc(collection(db, 'rounds'));
  await setDoc(ref, {
    ...round,
    deadline: Timestamp.fromDate(round.deadline),
  });
  return ref.id;
}

export async function updateRound(id: string, data: Partial<Round>) {
  const payload: Record<string, unknown> = { ...data };
  if (data.deadline) payload.deadline = Timestamp.fromDate(data.deadline);
  await updateDoc(doc(db, 'rounds', id), payload);
}

// ─── Predictions ──────────────────────────────────────
function predId(uid: string, roundId: string) {
  return `${uid}_${roundId}`;
}

export async function savePrediction(pred: Omit<Prediction, 'points'>) {
  await setDoc(doc(db, 'predictions', predId(pred.userId, pred.roundId)), {
    ...pred,
    points: null,
    submittedAt: Timestamp.now(),
  });
}

export async function getPrediction(uid: string, roundId: string): Promise<Prediction | null> {
  const snap = await getDoc(doc(db, 'predictions', predId(uid, roundId)));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { ...d, submittedAt: d.submittedAt.toDate() } as Prediction;
}

// ─── Points calculation ───────────────────────────────
export async function calculateRoundPoints(roundId: string) {
  const roundSnap = await getDoc(doc(db, 'rounds', roundId));
  if (!roundSnap.exists()) throw new Error('Round not found');
  const round = roundSnap.data() as Round;
  if (!round.officialLineup || !round.officialMVP || !round.officialScore) {
    throw new Error('Round results not complete');
  }

  const q = query(collection(db, 'predictions'), where('roundId', '==', roundId));
  const predsSnap = await getDocs(q);
  const batch = writeBatch(db);

  predsSnap.docs.forEach(predDoc => {
    const pred = predDoc.data() as Prediction;
    let pts = 0;

    // +1 per correct player (up to 5 if all 11 correct → give 5 flat)
    const correct = pred.lineup.filter(d => round.officialLineup!.includes(d)).length;
    if (correct === 11) pts += 5;
    else pts += Math.floor(correct * 0.45); // partial credit

    // MVP +3
    if (pred.mvp === round.officialMVP) pts += 3;

    // Score +5 exact, +2 winner/draw
    const ps = pred.score;
    const os = round.officialScore!;
    if (ps.home === os.home && ps.away === os.away) {
      pts += 5;
    } else {
      const predWinner = ps.home > ps.away ? 1 : ps.home < ps.away ? -1 : 0;
      const realWinner = os.home > os.away ? 1 : os.home < os.away ? -1 : 0;
      if (predWinner === realWinner) pts += 2;
    }

    batch.update(predDoc.ref, { points: pts });
  });

  await batch.commit();

  // Update user totals with Firestore increment
  const predsSnap2 = await getDocs(q);
  const batch2 = writeBatch(db);
  predsSnap2.docs.forEach(predDoc => {
    const pred = predDoc.data() as Prediction & { points: number };
    batch2.update(doc(db, 'users', pred.userId), {
      totalPoints: increment(pred.points),
    });
  });
  await batch2.commit();

  await updateDoc(doc(db, 'rounds', roundId), { status: 'completed' });
}

// ─── Ranking ──────────────────────────────────────────
export async function getRanking(): Promise<RankingEntry[]> {
  const usersSnap = await getDocs(collection(db, 'users'));
  const users = usersSnap.docs.map(d => d.data() as AppUser);

  // Get latest completed round for last round points
  const roundsQ = query(collection(db, 'rounds'), where('status', '==', 'completed'), orderBy('number', 'desc'));
  const roundsSnap = await getDocs(roundsQ);
  const latestRoundId = roundsSnap.docs[0]?.id ?? null;

  const entries: RankingEntry[] = await Promise.all(users.map(async u => {
    const predsQ = query(collection(db, 'predictions'), where('userId', '==', u.uid));
    const predsSnap = await getDocs(predsQ);
    const preds = predsSnap.docs.map(d => d.data() as Prediction & { points: number });

    const roundsPlayed = preds.filter(p => p.points !== null).length;
    const mvpHits = preds.filter(p => {
      // We'd need to cross-reference rounds — approximation: count per round
      return p.points !== null && p.points >= 3;
    }).length;
    const scoreHits = preds.filter(p => p.points !== null && p.points >= 5).length;

    let lastRoundPoints: number | null = null;
    if (latestRoundId) {
      const lp = preds.find(p => p.roundId === latestRoundId);
      lastRoundPoints = lp?.points ?? null;
    }

    return {
      uid: u.uid,
      displayName: u.displayName,
      totalPoints: u.totalPoints,
      roundsPlayed,
      mvpHits,
      scoreHits,
      lastRoundPoints,
      trend: 'eq' as const,
    };
  }));

  return entries.sort((a, b) => b.totalPoints - a.totalPoints);
}
