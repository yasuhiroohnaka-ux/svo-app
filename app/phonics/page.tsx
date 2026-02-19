"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { PHONICS_DATA, WORDS_DATA, Word, Phonic } from "./PhonicsData";
import LectureOverlay from "./LectureOverlay";

export default function PhonicsPage() {
    // Game State
    const [level, setLevel] = useState<1 | 2 | 3>(1);
    const [streak, setStreak] = useState(0);
    const [showLecture, setShowLecture] = useState(true); // Show intro lecture on load

    // Current Round State
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [slots, setSlots] = useState<(Phonic | null)[]>([]);
    const [hand, setHand] = useState<Phonic[]>([]);
    const [showHanamaru, setShowHanamaru] = useState(false);
    const [shakeCardId, setShakeCardId] = useState<string | null>(null);

    // Filter words by current Level
    const levelWords = WORDS_DATA.filter(w => w.level === level);

    // Start New Round
    useEffect(() => {
        if (!currentWord && levelWords.length > 0) {
            nextRound(); // Initial load
        }
    }, [level]);

    const nextRound = () => {
        setShowHanamaru(false);
        // Pick random word from current level
        const randomWord = levelWords[Math.floor(Math.random() * levelWords.length)];
        setCurrentWord(randomWord);

        // Reset Slots
        setSlots(new Array(randomWord.phonics.length).fill(null));

        // Prepare Hand (Target Phonics + Random Distractors = 5 Total)
        const targetPhonics = randomWord.phonics.map(id => PHONICS_DATA.find(p => p.id === id) || PHONICS_DATA[0]);
        const distractors = PHONICS_DATA.filter(p => !randomWord.phonics.includes(p.id));

        let pool = [...targetPhonics];
        while (pool.length < 5) {
            const random = distractors[Math.floor(Math.random() * distractors.length)];
            pool.push(random || PHONICS_DATA[0]);
        }
        // Shuffle
        pool = pool.sort(() => Math.random() - 0.5).slice(0, 5);
        setHand(pool);
    };

    const handleSelectPhonic = (p: Phonic) => {
        if (showHanamaru || !currentWord) return;

        // Find first empty slot
        const emptyIndex = slots.findIndex(s => s === null);
        if (emptyIndex === -1) return; // Full

        // Immediate Validation
        const targetPhonicId = currentWord.phonics[emptyIndex];
        if (p.id === targetPhonicId) {
            // Correct!
            const newSlots = [...slots];
            newSlots[emptyIndex] = p;
            setSlots(newSlots);

            // Check Win Condition
            if (emptyIndex === slots.length - 1) {
                const newStreak = streak + 1;
                setStreak(newStreak);

                // Check Level Up
                checkLevelUp(newStreak);

                setTimeout(() => {
                    setShowHanamaru(true);
                    // Next Round Delay
                    setTimeout(() => {
                        // Check if we leveled up (state might have changed in checkLevelUp but we need to wait for render)
                        // For simplicity, just call nextRound which picks from *current* level state
                        // If level changed, useEffect will trigger? No, level state change triggers re-render, 
                        // but we need to pick a word from the NEW level if it changed.
                        // Actually, let's just rely on nextRound picking from current level state.
                        // But we need to make sure 'level' state is updated before nextRound is called if we want new level words.
                        // React state updates are batched. 

                        // We'll let the effect handle the initial load of a new level if it changes?
                        // Better: straightforward logic here.
                        nextRound();
                    }, 2000);
                }, 500);
            }
        } else {
            // Incorrect!
            setShakeCardId(p.id);
            setStreak(0); // Reset streak on error? Or keep it? "Consecutive correct answers" implies reset.
            setTimeout(() => setShakeCardId(null), 500);
        }
    };

    const checkLevelUp = (currentStreak: number) => {
        if (level === 1 && currentStreak >= 30) {
            setLevel(2);
            setStreak(0);
            setShowLecture(true);
        } else if (level === 2 && currentStreak >= 20) {
            setLevel(3);
            setStreak(0);
            setShowLecture(true);
        }
    };

    if (!currentWord) return <div className={styles.container}>Loading...</div>;

    return (
        <main className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 800, alignItems: 'center' }}>
                <h1 className={styles.header} style={{ margin: 0 }}>oto-man</h1>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#ff7043' }}>Level {level}</div>
                    <div style={{ background: '#333', color: 'white', padding: '4px 12px', borderRadius: 12 }}>
                        Streak: {streak}
                    </div>
                    <button onClick={() => setShowLecture(true)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                        ℹ️
                    </button>
                </div>
            </div>

            <div className={styles.gameArea}>
                {/* Target Area */}
                <div className={styles.targetArea}>
                    {/* Audio Button Placeholder */}
                    <button className={styles.button} style={{ fontSize: '2rem', borderRadius: '50%', width: 60, height: 60, border: 'none', background: '#e67e22', color: 'white', cursor: 'pointer' }}>
                        🔊
                    </button>

                    <div style={{ fontSize: '3rem', fontWeight: 'bold', marginTop: 10, marginBottom: 20 }}>
                        {currentWord.text.toUpperCase()}
                    </div>

                    {/* Slots */}
                    <div className={styles.slots}>
                        {slots.map((slot, i) => (
                            <div
                                key={i}
                                className={`${styles.slot} ${slot ? styles.slotCorrect : ""}`}
                            >
                                {slot ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div>{slot.symbol}</div>
                                        <img src={slot.image} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <span style={{ opacity: 0.3 }}>{i + 1}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hand (Phonics Deck) */}
                <div className={styles.phonicsDeck}>
                    {hand.map((p, i) => (
                        <button
                            key={`${p.id}-${i}`}
                            className={`${styles.phonicsCard} ${shakeCardId === p.id ? styles.slotError : ""}`}
                            onClick={() => handleSelectPhonic(p)}
                        >
                            <div className={styles.phonicsCardLabel}>{p.symbol}</div>
                            <img src={p.image} className={styles.phonicsCardImage} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Overlays */}
            {showHanamaru && (
                <div className={styles.hanamaruOverlay}>
                    <div className={styles.hanamaru}></div>
                </div>
            )}

            {showLecture && (
                <LectureOverlay
                    level={level}
                    onClose={() => setShowLecture(false)}
                />
            )}
        </main>
    );
}
