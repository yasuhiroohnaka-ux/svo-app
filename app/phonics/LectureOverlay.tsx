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
                        <h2>Level 1: Short vs Long</h2>
                        <div className={styles.animationStage}>
                            <div className={styles.word}>
                                <span className={styles.char}>c</span>
                                <span className={`${styles.char} ${styles.vowelShort}`}>a</span>
                                <span className={styles.char}>t</span>
                            </div>
                            <div className={styles.explanation}>
                                "a" says /æ/ (apple)
                            </div>
                            <br />
                            <div className={styles.word}>
                                <span className={styles.char}>g</span>
                                <span className={`${styles.char} ${styles.vowelLong}`}>o</span>
                            </div>
                            <div className={styles.explanation}>
                                "o" says /oʊ/ (go)
                            </div>
                        </div>
                    </div>
                )}

                {level === 2 && (
                    <div className={styles.lectureScene}>
                        <h2>Level 2: Magic 'e'</h2>
                        <div className={styles.animationStage}>
                            <div className={styles.word}>
                                <span className={styles.char}>c</span>
                                <span className={`${styles.char} ${styles.vowelTarget}`}>a</span>
                                <span className={styles.char}>k</span>
                                <span className={`${styles.char} ${styles.magicE} ${step % 2 === 1 ? styles.magicEActive : ""}`}>e</span>
                            </div>
                            <div className={styles.explanation}>
                                {step % 2 === 0 ? "..." : "Zap! 'a' says its name!"}
                            </div>
                        </div>
                    </div>
                )}

                {level === 3 && (
                    <div className={styles.lectureScene}>
                        <h2>Level 3: Double Consonants</h2>
                        <div className={styles.animationStage}>
                            <div className={styles.word}>
                                <span className={styles.char}>a</span>
                                <span className={`${styles.char} ${styles.consonantLock}`}>p</span>
                                <span className={styles.separator}>|</span>
                                <span className={`${styles.char} ${styles.consonantLock}`}>p</span>
                                <span className={styles.char}>l</span>
                                <span className={styles.char}>e</span>
                            </div>
                            <div className={styles.explanation}>
                                Double 'p' locks the short 'a'!
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
