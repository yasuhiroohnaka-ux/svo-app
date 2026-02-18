export type RankEntry = {
    name: string;
    time: number; // seconds (float)
    date: string; // ISO string
    cards: number; // how many cards were cleared
};

const MAX_ENTRIES = 10;

export function getRanking(appKey: string): RankEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(`ranking-${appKey}`);
        if (!raw) return [];
        return JSON.parse(raw) as RankEntry[];
    } catch {
        return [];
    }
}

export function saveRanking(appKey: string, entry: RankEntry): RankEntry[] {
    const current = getRanking(appKey);
    const updated = [...current, entry]
        .sort((a, b) => a.time - b.time)
        .slice(0, MAX_ENTRIES);
    localStorage.setItem(`ranking-${appKey}`, JSON.stringify(updated));
    return updated;
}

export function clearRanking(appKey: string): void {
    localStorage.removeItem(`ranking-${appKey}`);
}

export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(2).padStart(5, "0");
    return m > 0 ? `${m}:${s}` : `${s}s`;
}
