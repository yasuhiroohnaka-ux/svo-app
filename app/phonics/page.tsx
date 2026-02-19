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
    { id: "bat", text: "bat", phonics: ["b", "a", "t"] },
];

export default function PhonicsPage() {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [slots, setSlots] = useState<(Phonic | null)[]>([]);
    const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");

    const currentWord = MOCK_WORDS[currentWordIndex];

    useEffect(() => {
        // Initialize slots based on word length
        setSlots(new Array(currentWord.phonics.length).fill(null));
        setFeedback("idle");
    }, [currentWordIndex]);

    const handleSelectPhonic = (p: Phonic) => {
        // Find first empty slot
        const emptyIndex = slots.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            const newSlots = [...slots];
            newSlots[emptyIndex] = p;
            setSlots(newSlots);
        }
    };

    const handleRemoveSlot = (index: number) => {
        const newSlots = [...slots];
        newSlots[index] = null;
        setSlots(newSlots);
    };

    const checkAnswer = () => {
        const currentPhonics = slots.map(s => s?.id);
        const isCorrect = JSON.stringify(currentPhonics) === JSON.stringify(currentWord.phonics);

        if (isCorrect) {
            setFeedback("correct");
            // Play success sound
            setTimeout(() => {
                // Next word
                setCurrentWordIndex((prev) => (prev + 1) % MOCK_WORDS.length);
            }, 1500);
        } else {
            setFeedback("incorrect");
            // Play error sound
        }
    };

    return (
        <main className={styles.container}>
            <h1 className={styles.header}>Phonics Builder</h1>

            <div className={styles.gameArea}>
                {/* Target Area */}
                <div className={styles.targetArea}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                        {/* Placeholder for Word Image */}
                        {currentWord.text.toUpperCase()}
                    </div>

                    {/* Slots */}
                    <div className={styles.slots}>
                        {slots.map((slot, i) => (
                            <button
                                key={i}
                                className={`${styles.slot} ${slot ? styles.slotFilled : ""}`}
                                onClick={() => handleRemoveSlot(i)}
                            >
                                {slot ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div>{slot.symbol}</div>
                                        {/* <img src={slot.image} ... /> */}
                                    </div>
                                ) : (
                                    <span style={{ opacity: 0.3 }}>{i + 1}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                {feedback !== "idle" && (
                    <div style={{
                        color: feedback === "correct" ? "green" : "red",
                        fontSize: "1.5rem",
                        fontWeight: "bold"
                    }}>
                        {feedback === "correct" ? "Correct!" : "Try Again!"}
                    </div>
                )}

                {/* Check Button */}
                <button
                    className={styles.checkButton}
                    onClick={checkAnswer}
                    disabled={slots.some(s => s === null)}
                >
                    Check Answer
                </button>

                {/* Keyboard / Deck */}
                <div className={styles.phonicsDeck}>
                    {MOCK_PHONICS.map((p) => (
                        <button
                            key={p.id}
                            className={styles.phonicsCard}
                            onClick={() => handleSelectPhonic(p)}
                        >
                            <div className={styles.phonicsCardLabel}>{p.symbol}</div>
                            {/* <img src={p.image} className={styles.phonicsCardImage} /> */}
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}
