"use client";

import { formatTime, type RankEntry } from "@/utils/ranking";

import type { RecordResult } from "@/app/lib/rewards";

import ResultDialog, { type ResultAction } from "./ResultDialog";
import RewardSummary from "./RewardSummary";
import styles from "./Ranking.module.css";

export type RankingLabels = {
  newRecord: string;
  /** "{n}" を順位に置き換える */
  rankIn: string;
  cleared: string;
  outOfRank: string;
  enterName: string;
  ranking: string;
  rank: string;
  name: string;
  time: string;
  noRecords: string;
  close: string;
  clearRanking: string;
  playAgain: string;
  /** 枚数の単位(例: "まい") */
  cardsUnit: string;
};

type TimeTrialResultProps = {
  labels: RankingLabels;
  time: number;
  /** 登録したときの順位。ランク外なら null */
  rank: number | null;
  playerName: string;
  onNameChange: (name: string) => void;
  /** このクリアで もらった ⭐ */
  reward?: RecordResult | null;
  /** ランクインなら名前を登録、ランク外ならそのまま閉じる */
  onSubmit: () => void;
};

/** タイムトライアルのクリア画面。ランクインしたときだけ名前を聞く */
export function TimeTrialResultDialog({ labels, time, rank, playerName, onNameChange, onSubmit, reward }: TimeTrialResultProps) {
  const title = rank === 1 ? labels.newRecord : rank !== null ? labels.rankIn.replace("{n}", String(rank)) : labels.cleared;

  return (
    <ResultDialog
      title={title}
      mark={!reward}
      highlight={formatTime(time)}
      actions={[{ label: rank !== null ? "OK" : labels.playAgain, onClick: onSubmit }]}
    >
      {reward && <RewardSummary result={reward} />}
      {rank !== null ? (
        <label className={styles.nameField}>
          <span>{labels.enterName}</span>
          <input
            type="text"
            className={styles.nameInput}
            value={playerName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Name"
            maxLength={10}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
          />
        </label>
      ) : (
        <p className={styles.note}>{labels.outOfRank}</p>
      )}
    </ResultDialog>
  );
}

type RankingDialogProps = {
  labels: RankingLabels;
  cards: number;
  entries: RankEntry[];
  /** この日時の行を「いま登録した記録」として強調する */
  highlightDate?: string;
  onClose: () => void;
  onClear?: () => void;
};

/** 同じ枚数どうしのタイムランキング */
export function RankingDialog({ labels, cards, entries, highlightDate, onClose, onClear }: RankingDialogProps) {
  const actions: ResultAction[] = [{ label: labels.close, onClick: onClose }];
  if (onClear && entries.length > 0) {
    actions.push({
      label: labels.clearRanking,
      variant: "secondary",
      onClick: () => {
        // 消すと戻せないので、ここだけは確認する
        if (window.confirm(`${labels.clearRanking}?`)) onClear();
      },
    });
  }

  return (
    <ResultDialog title={`${labels.ranking}(${cards}${labels.cardsUnit})`} mark="🏆" actions={actions} onClose={onClose}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{labels.rank}</th>
            <th>{labels.name}</th>
            <th>{labels.time}</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={3}>{labels.noRecords}</td>
            </tr>
          ) : (
            entries.map((entry, index) => (
              <tr key={`${entry.date}-${index}`} className={entry.date === highlightDate ? styles.rowNew : undefined}>
                <td>{index + 1}</td>
                <td>{entry.name}</td>
                <td>{formatTime(entry.time)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ResultDialog>
  );
}
