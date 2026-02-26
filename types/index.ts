export interface Card {
  cardId: number;
  page: number;
  pairId: string;
  subject: string;
  verb: string;
  object: string;
  sentence: string;
  imageFile: string;
}

export interface GameStats {
  correctCount: number;
  totalAttempts: number;
  streak: number;
  startTime: number;
}

declare global {
  interface Window {
    __BOOT_OK__?: boolean;
  }
}
