export type RankEntry = {
    name: string;
    time: number; // seconds (float)
    date: string; // ISO string
    cards: number; // how many cards were cleared
};

export const MAX_RANKING_ENTRIES = 10;

export function getRanking(appKey: string): RankEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(`ranking-${appKey}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as RankEntry[]) : [];
    } catch {
        return [];
    }
}

/** 同じ枚数どうしのランキング(速い順)。枚数が違うタイムは比べない */
export function rankingForCards(entries: RankEntry[], cards: number): RankEntry[] {
    return entries.filter((entry) => entry.cards === cards).sort((a, b) => a.time - b.time);
}

/** そのタイムを登録したときの順位(1 始まり)。ランク外なら null */
export function getRankPosition(entries: RankEntry[], cards: number, time: number): number | null {
    const position = rankingForCards(entries, cards).filter((entry) => entry.time <= time).length + 1;
    return position <= MAX_RANKING_ENTRIES ? position : null;
}

/** 枚数ごとに上位 MAX_RANKING_ENTRIES 件だけ残して追加する */
export function addRankingEntry(entries: RankEntry[], entry: RankEntry): RankEntry[] {
    const sameCards = rankingForCards([...entries, entry], entry.cards).slice(0, MAX_RANKING_ENTRIES);
    const others = entries.filter((existing) => existing.cards !== entry.cards);
    return [...others, ...sameCards];
}

export function saveRanking(appKey: string, entry: RankEntry): RankEntry[] {
    const updated = addRankingEntry(getRanking(appKey), entry);
    try {
        localStorage.setItem(`ranking-${appKey}`, JSON.stringify(updated));
    } catch {
        // 保存できない環境では、この画面の中だけで記録を見せる
    }
    return updated;
}

export function clearRanking(appKey: string): void {
    try {
        localStorage.removeItem(`ranking-${appKey}`);
    } catch {
        // noop
    }
}

export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(2).padStart(5, "0");
    return m > 0 ? `${m}:${s}` : `${s}s`;
}
