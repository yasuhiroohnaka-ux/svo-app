import React, { useEffect, useState } from "react";
import styles from "./page.module.css";

type LectureOverlayProps = {
    level: 1 | 2 | 3;
    onClose: () => void;
};

export default function LectureOverlay({ level, onClose }: LectureOverlayProps) {
    const [step, setStep] = useState(0);

    // Auto-advance simple animation steps
    useEffect(() => {
        const timer = setInterval(() => {
            setStep((s) => s + 1);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.lectureOverlay}>
            <div className={styles.lectureContent}>
                <button className={styles.closeLecture} onClick={onClose}>×</button>

                {level === 1 && (
                    <div className={styles.lectureScene}>
                        <h2 className={styles.pixelTitle}>Level 1: Short vs Long</h2>
                        <div className={styles.animationStage}>
                            <div className={styles.wordRow}>
                                <div className={styles.word}>
                                    <span>c</span>
                                    <span className={`${styles.char} ${styles.vowelShort}`}>a</span>
                                    <span>t</span>
                                </div>
                                <div className={styles.pixelBubble}>Short! /æ/</div>
                            </div>
                            <div className={styles.divider}>VS</div>
                            <div className={styles.wordRow}>
                                <div className={styles.word}>
                                    <span>g</span>
                                    <span className={`${styles.char} ${styles.vowelLong}`}>o</span>
                                </div>
                                <div className={`${styles.pixelBubble} ${styles.bubbleLong}`}>Long! /foʊ/</div>
                            </div>
                        </div>
                    </div>
                )}

                {level === 2 && (
                    <div className={styles.lectureScene}>
                        <h2 className={styles.pixelTitle}>Level 2: Magic 'e'</h2>
                        <div className={styles.animationStage}>
                            <div className={styles.word}>
                                <span>c</span>
                                <span className={`${styles.char} ${styles.vowelTarget} ${step % 2 === 1 ? styles.vowelZap : ""}`}>a</span>
                                <span>k</span>
                                <span className={`${styles.char} ${styles.magicE} ${step % 2 === 1 ? styles.magicEActive : ""}`}>
                                    e
                                    <div className={styles.wand}>🪄</div>
                                    {step % 2 === 1 && <div className={styles.lightning}>⚡</div>}
                                </span>
                            </div>
                            <div className={styles.pixelBubble}>
                                {step % 2 === 0 ? "Silent..." : "Say your name!"}
                            </div>
                        </div>
                    </div>
                )}

                {level === 3 && (
                    <div className={styles.lectureScene}>
                        <h2 className={styles.pixelTitle}>Level 3: Double Consonants</h2>
                        <div className={styles.animationStage}>
                            <div className={styles.word}>
                                <span>a</span>
                                <div className={styles.charGroup}>
                                    <span className={styles.consonantLock}>p</span>
                                    <div className={styles.lockIcon}>🔒</div>
                                </div>
                                <div className={styles.charGroup}>
                                    <span className={styles.consonantLock}>p</span>
                                </div>
                                <span>l</span>
                                <span>e</span>
                            </div>
                            <div className={styles.pixelBubble}>
                                Locked! Short Sound!
                            </div>
                        </div>
                    </div>
                )}

                <button className={styles.startLevel} onClick={onClose}>
                    Start Level {level}
                </button>
            </div>
        </div>
    );
}
