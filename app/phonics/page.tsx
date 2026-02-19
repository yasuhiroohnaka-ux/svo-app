"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

type Phonic = {
    id: string;
    symbol: string;
    image: string; // Path to mouth/char image
    audio?: string;
};

type Word = {
    id: string;
    text: string;
    phonics: string[]; // sequence of phonic IDs
    image?: string;
};

// Mock Data (To be moved to JSON later)
const MOCK_PHONICS: Phonic[] = [
    { id: "a", symbol: "a", image: "/images/phonics/media__1771519031745.png" }, // 700KB (Big one?)
    { id: "o", symbol: "o", image: "/images/phonics/media__1771519165248.png" },
    { id: "u", symbol: "u", image: "/images/phonics/media__1771519175425.png" },
    { id: "c", symbol: "c", image: "/images/phonics/media__1771519186730.png" }, // Using remaining for others
    { id: "t", symbol: "t", image: "/images/phonics/media__1771519186811.png" },
];

const MOCK_WORDS: Word[] = [
    { id: "cat", text: "cat", phonics: ["c", "a", "t"] },
    { id: "bat", text: "bat", phonics: ["c", "a", "t"] }, // Placeholder using available phonics
];

export default function PhonicsPage() {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [slots, setSlots] = useState<(Phonic | null)[]>([]);
    const [hand, setHand] = useState<Phonic[]>([]);
    const [showHanamaru, setShowHanamaru] = useState(false);
    const [shakeCardId, setShakeCardId] = useState<string | null>(null);

    const currentWord = MOCK_WORDS[currentWordIndex];

    // Initialize Round
    useEffect(() => {
        // 1. Reset Slots
        setSlots(new Array(currentWord.phonics.length).fill(null));
        setShowHanamaru(false);

        // 2. Prepare Hand (Target Phonics + Random Distractors = 5 Total)
        // Ensure we find the phonic, fallback to first if missing
        const targetPhonics = currentWord.phonics.map(id => MOCK_PHONICS.find(p => p.id === id) || MOCK_PHONICS[0]);
        const distractors = MOCK_PHONICS.filter(p => !currentWord.phonics.includes(p.id));

        let pool = [...targetPhonics];
        // Fill up to 5 with distractors
        while (pool.length < 5) {
            const random = distractors[Math.floor(Math.random() * distractors.length)];
            pool.push(random || MOCK_PHONICS[0]); // Fallback if no distractors
        }
        // Shuffle
        pool = pool.sort(() => Math.random() - 0.5).slice(0, 5);
        setHand(pool);
    }, [currentWordIndex, currentWord]);

    const handleSelectPhonic = (p: Phonic) => {
        if (showHanamaru) return;

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
                setTimeout(() => {
                    setShowHanamaru(true);
                    // Next Level Delay
                    setTimeout(() => {
                        setCurrentWordIndex((prev) => (prev + 1) % MOCK_WORDS.length);
                    }, 3000);
                }, 500);
            }
        } else {
            // Incorrect!
            setShakeCardId(p.id);
            setTimeout(() => setShakeCardId(null), 500);
        }
    };

    return (
        <main className={styles.container}>
            <h1 className={styles.header}>oto-man</h1>

            <div className={styles.gameArea}>
                {/* Target Area */}
                <div className={styles.targetArea}>
                    {/* Audio Button Placeholder */}
                    <button className={styles.button} style={{ fontSize: '2rem', borderRadius: '50%', width: 60, height: 60, border: 'none', background: '#e67e22', color: 'white', cursor: 'pointer' }}>
                        🔊
                    </button>

                    <div style={{ fontSize: '3rem', fontWeight: 'bold', marginTop: 10, marginBottom: 20 }}>
                        {/* Hide text in real app, show image? For now showing text for debugging logic */}
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

            {/* Hanamaru Overlay */}
            {showHanamaru && (
                <div className={styles.hanamaruOverlay}>
                    <div className={styles.hanamaru}></div>
                </div>
            )}
        </main>
    );
}
