import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  Check,
  Gamepad2,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { ResilientImage } from './ResilientMedia';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'VICTORY';
type Difficulty = 'easy' | 'medium' | 'hard';

interface CardArt {
  key: string;
  label: string;
  src: string;
}

interface BoardCard {
  uid: string;
  artKey: string;
  label: string;
  src: string;
  matched: boolean;
}

const GALLERY_CARDS: CardArt[] = [
  { key: 'bangles', label: 'Bangles', src: '/assets/aistudio/image_00d3b7ab.png' },
  { key: 'hillside', label: 'Hillside', src: '/assets/aistudio/image_066b26fa.png' },
  { key: 'swans', label: 'Lotus Swans', src: '/assets/aistudio/image_297e992c.png' },
  { key: 'horse', label: 'Iridescent', src: '/assets/aistudio/image_554a2b00.png' },
  { key: 'octopus', label: 'Clay Desk', src: '/assets/aistudio/image_a104967c.png' },
  { key: 'cheetah', label: 'Dusk Studio', src: '/assets/aistudio/image_8145de1b.png' },
  { key: 'hydrangea', label: 'Hydrangeas', src: '/assets/aistudio/image_55aee536.png' },
  { key: 'peonies', label: 'Peonies', src: '/assets/aistudio/image_6a8cb40f.png' },
  { key: 'winkcat', label: 'Studio Cat', src: '/assets/aistudio/image_251618e5.png' },
  { key: 'meadow', label: 'Meadow Swan', src: '/assets/aistudio/image_26bbeac6.png' },
];

const DIFFICULTIES: Record<
  Difficulty,
  { label: string; pairs: number; colsClass: string; summary: string }
> = {
  easy: {
    label: 'Relaxed (4×3)',
    pairs: 6,
    colsClass: 'grid-cols-3 sm:grid-cols-4 max-w-lg',
    summary: '6 pairs · 12 cards',
  },
  medium: {
    label: 'Classic (4×4)',
    pairs: 8,
    colsClass: 'grid-cols-4 max-w-lg',
    summary: '8 pairs · 16 cards',
  },
  hard: {
    label: 'Challenge (5×4)',
    pairs: 10,
    colsClass: 'grid-cols-4 sm:grid-cols-5 max-w-2xl',
    summary: '10 pairs · 20 cards',
  },
};

const BEST_SCORE_KEY = 'inztagram_snap_match_best_v1';

function loadBestScores(): Partial<Record<Difficulty, number>> {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<Difficulty, number>>) : {};
  } catch {
    return {};
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const GameView: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bestScores, setBestScores] = useState<Partial<Record<Difficulty, number>>>(() =>
    loadBestScores()
  );
  const [isNewBest, setIsNewBest] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const mismatchTimerRef = useRef<number | null>(null);

  const playTone = useCallback(
    (type: 'flip' | 'match' | 'miss' | 'victory') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
        const now = ctx.currentTime;

        const playNote = (freq: number, startOffset: number, dur: number, gainVal: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type === 'miss' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + startOffset);
          gain.gain.setValueAtTime(0.001, now + startOffset);
          gain.gain.exponentialRampToValueAtTime(gainVal, now + startOffset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + startOffset);
          osc.stop(now + startOffset + dur + 0.02);
        };

        if (type === 'flip') {
          playNote(520, 0, 0.08, 0.05);
        } else if (type === 'match') {
          playNote(587.33, 0, 0.14, 0.07);
          playNote(783.99, 0.07, 0.18, 0.07);
        } else if (type === 'miss') {
          playNote(240, 0, 0.14, 0.05);
        } else if (type === 'victory') {
          playNote(523.25, 0, 0.16, 0.08);
          playNote(659.25, 0.1, 0.16, 0.08);
          playNote(783.99, 0.2, 0.18, 0.08);
          playNote(1046.5, 0.32, 0.32, 0.09);
        }
      } catch {
        // Ignore audio errors if blocked
      }
    },
    [soundEnabled]
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mismatchTimerRef.current) window.clearTimeout(mismatchTimerRef.current);
    };
  }, []);

  // Run active game timer
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState]);

  const startGame = useCallback(
    (selectedDiff: Difficulty = difficulty) => {
      if (mismatchTimerRef.current) {
        window.clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = null;
      }
      const config = DIFFICULTIES[selectedDiff];
      const chosen = shuffle(GALLERY_CARDS).slice(0, config.pairs);
      const deck: BoardCard[] = shuffle(
        chosen.flatMap((art) => [
          {
            uid: `${art.key}_a_${Math.random().toString(36).slice(2, 6)}`,
            artKey: art.key,
            label: art.label,
            src: art.src,
            matched: false,
          },
          {
            uid: `${art.key}_b_${Math.random().toString(36).slice(2, 6)}`,
            artKey: art.key,
            label: art.label,
            src: art.src,
            matched: false,
          },
        ])
      );

      setDifficulty(selectedDiff);
      setCards(deck);
      setFlippedIndices([]);
      setIsChecking(false);
      setMoves(0);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setElapsedSec(0);
      setIsNewBest(false);
      setGameState('PLAYING');
    },
    [difficulty]
  );

  const handleCardClick = (index: number) => {
    if (gameState !== 'PLAYING' || isChecking) return;
    if (flippedIndices.includes(index) || cards[index]?.matched) return;

    playTone('flip');
    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length < 2) return;

    const [firstIdx, secondIdx] = nextFlipped;
    const firstCard = cards[firstIdx];
    const secondCard = cards[secondIdx];
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (firstCard.artKey === secondCard.artKey) {
      const nextStreak = streak + 1;
      const pointsEarned = 100 + (nextStreak - 1) * 35;
      const nextScore = score + pointsEarned;

      playTone('match');
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setScore(nextScore);

      const updatedCards = cards.map((card, i) =>
        i === firstIdx || i === secondIdx ? { ...card, matched: true } : card
      );
      setCards(updatedCards);
      setFlippedIndices([]);

      const allMatched = updatedCards.every((c) => c.matched);
      if (allMatched) {
        const timeBonus = Math.max(0, 240 - elapsedSec * 2);
        const finalScore = nextScore + timeBonus;
        setScore(finalScore);
        playTone('victory');

        const prevBest = bestScores[difficulty] || 0;
        if (finalScore > prevBest) {
          const updatedBest = { ...bestScores, [difficulty]: finalScore };
          setBestScores(updatedBest);
          setIsNewBest(true);
          try {
            localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(updatedBest));
          } catch {
            // ignore storage errors
          }
        }
        setGameState('VICTORY');
      }
    } else {
      setStreak(0);
      setIsChecking(true);
      playTone('miss');
      mismatchTimerRef.current = window.setTimeout(() => {
        setFlippedIndices([]);
        setIsChecking(false);
      }, 680);
    }
  };

  const matchedPairs = cards.filter((c) => c.matched).length / 2;
  const totalPairs = DIFFICULTIES[difficulty].pairs;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#39243B] dark:text-[#F6EFF8] flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
            <span>Snap Match</span>
          </h1>
          <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] mt-0.5">
            Gallery card memory game · Match studio artworks to build streaks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label={soundEnabled ? 'Mute game sound' : 'Enable game sound'}
            className="min-h-[38px] px-3 rounded-xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] inline-flex items-center gap-1.5"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
            )}
            <span>{soundEnabled ? 'Sound on' : 'Muted'}</span>
          </button>

          {gameState !== 'TITLE_MENU' && (
            <button
              type="button"
              onClick={() => startGame(difficulty)}
              className="min-h-[38px] px-3.5 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#ff7abb] inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restart</span>
            </button>
          )}
        </div>
      </div>

      {/* Title Menu */}
      {gameState === 'TITLE_MENU' && (
        <section className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="shrink-0">
              <BrandMark size={64} />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-lg font-bold text-[#39243B] dark:text-[#F6EFF8]">
                Match the Inztagram Gallery
              </h2>
              <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] max-w-xl leading-relaxed">
                Flip two cards at a time to uncover matching studio paintings and photos. Consecutive matches increase your streak multiplier, and faster finishes earn a speed bonus.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8]">
              Select board size
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diffKey) => {
                const info = DIFFICULTIES[diffKey];
                const selected = difficulty === diffKey;
                const best = bestScores[diffKey];
                return (
                  <button
                    key={diffKey}
                    type="button"
                    onClick={() => setDifficulty(diffKey)}
                    className={`rounded-xl p-4 text-left border transition-colors ${
                      selected
                        ? 'bg-[#FDF5FB] dark:bg-[#2A1D2D] border-[#A74695] dark:border-[#FF64AE]'
                        : 'bg-[#FAF8FC] dark:bg-[#231C29] border-[#E5DCE9] dark:border-[#2E2436] hover:border-[#D57FC4]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#39243B] dark:text-[#F6EFF8]">
                        {info.label}
                      </span>
                      {selected && (
                        <Check className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] mt-1">
                      {info.summary}
                    </p>
                    {best !== undefined && (
                      <p className="text-xs font-semibold text-[#37689E] dark:text-[#7AA6FF] mt-2 tabular-nums">
                        Best: {best.toLocaleString()} pts
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => startGame(difficulty)}
              className="min-h-[44px] px-6 rounded-xl bg-[#A74695] hover:bg-[#913980] dark:bg-[#FF64AE] dark:hover:bg-[#ff7abb] text-white dark:text-[#111111] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>Start Game</span>
            </button>
          </div>
        </section>
      )}

      {/* Active Play & Victory */}
      {gameState !== 'TITLE_MENU' && (
        <div className="space-y-4">
          {/* HUD Bar */}
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm">
              <div>
                <span className="text-[#68556B] dark:text-[#B7A6BD] mr-1.5">Score</span>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {score.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#68556B] dark:text-[#B7A6BD] mr-1.5">Pairs</span>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {matchedPairs}/{totalPairs}
                </span>
              </div>
              <div>
                <span className="text-[#68556B] dark:text-[#B7A6BD] mr-1.5">Moves</span>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {moves}
                </span>
              </div>
              <div>
                <span className="text-[#68556B] dark:text-[#B7A6BD] mr-1.5">Streak</span>
                <span className="font-bold text-[#A74695] dark:text-[#FF64AE] tabular-nums">
                  {streak}x
                </span>
              </div>
              <div>
                <span className="text-[#68556B] dark:text-[#B7A6BD] mr-1.5">Time</span>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {formatTimer(elapsedSec)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGameState('TITLE_MENU')}
              className="text-xs font-semibold text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8] underline"
            >
              Change size
            </button>
          </div>

          {/* Card Grid */}
          <div className={`grid gap-2.5 sm:gap-3 mx-auto ${DIFFICULTIES[difficulty].colsClass}`}>
            {cards.map((card, idx) => {
              const isFaceUp = card.matched || flippedIndices.includes(idx);
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardClick(idx)}
                  disabled={isFaceUp || isChecking}
                  aria-label={
                    isFaceUp
                      ? `${card.label}${card.matched ? ' (matched)' : ''}`
                      : `Hidden gallery card ${idx + 1}`
                  }
                  className={`group relative aspect-square rounded-2xl border overflow-hidden transition-transform duration-200 focus-visible:outline-offset-2 ${
                    card.matched
                      ? 'border-[#A74695] dark:border-[#FF64AE] ring-2 ring-[#D57FC4]/30 dark:ring-[#FF64AE]/25 scale-[0.98]'
                      : isFaceUp
                        ? 'border-[#37689E] dark:border-[#7AA6FF] scale-[1.01]'
                        : 'border-[#E5DCE9] dark:border-[#2E2436] bg-white dark:bg-[#18131D] hover:border-[#D57FC4] dark:hover:border-[#FF64AE] active:scale-95 cursor-pointer'
                  }`}
                >
                  {isFaceUp ? (
                    <>
                      <ResilientImage
                        src={card.src}
                        alt={card.label}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-2 py-1.5 text-[11px] font-semibold text-white truncate text-left">
                        {card.label}
                      </span>
                    </>
                  ) : (
                    <span className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#FAF8FC] dark:bg-[#211928]">
                      <BrandMark size={30} />
                      <span className="text-[10px] font-medium text-[#8E7B91] dark:text-[#8E7B91]">
                        Tap
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Victory Banner */}
      {gameState === 'VICTORY' && (
        <section
          aria-live="polite"
          className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#D57FC4] dark:border-[#FF64AE] p-6 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FDF5FB] dark:bg-[#2F1D2C] text-[#A74695] dark:text-[#FF64AE] flex items-center justify-center mx-auto">
            {isNewBest ? (
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Award className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[#39243B] dark:text-[#F6EFF8]">
              {isNewBest ? 'New High Score!' : 'Board Complete!'}
            </h2>
            <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] tabular-nums">
              Final Score: <strong className="text-[#39243B] dark:text-[#F6EFF8]">{score.toLocaleString()}</strong> ·{' '}
              {moves} moves · {formatTimer(elapsedSec)} · Best streak {bestStreak}x
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => startGame(difficulty)}
              className="min-h-[40px] px-5 rounded-xl bg-[#A74695] hover:bg-[#913980] dark:bg-[#FF64AE] dark:hover:bg-[#ff7abb] text-white dark:text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={() => setGameState('TITLE_MENU')}
              className="min-h-[40px] px-4 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#F8F5FA] dark:bg-[#231C29] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]"
            >
              Change Difficulty
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
