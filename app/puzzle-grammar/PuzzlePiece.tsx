"use client";

/**
 * ジグソーピース(と、スロットのゴースト輪郭)を SVG で描くコンポーネント。
 * 役割(role)ごとに辺の形が変わり、正しい役割どうしだけ「かみ合う」見た目になる。
 *
 *  - subject : 左辺フラット・右辺に外向きタブ
 *  - verb    : 両辺ともソケット(内側にへこみ)
 *  - object  : 左辺に外向きタブ・右辺フラット
 *
 * 高さ H=64、タブ半径 r=12、弦の半分 c=10、mid=H/2 固定。
 * タブがはみ出すので viewBox は左右に 16px マージンを取る。
 */

export type Role = "subject" | "verb" | "object";

const H = 64;
const R = 12;
const C = 10;
const MID = H / 2;
const MARGIN = 16;

/** ラベルの長さに応じてピース幅を可変にする */
export function pieceWidth(label: string): number {
  return Math.max(120, label.length * 13 + 56);
}

/** 役割ごとのジグソーパスを返す */
export function piecePath(role: Role, w: number): string {
  if (role === "subject") {
    // 左辺フラット・右辺に外向きタブ
    return `M 0 0 H ${w} V ${MID - C} A ${R} ${R} 0 1 1 ${w} ${MID + C} V ${H} H 0 Z`;
  }
  if (role === "verb") {
    // 両辺ともソケット(内側へへこむ)
    return `M 0 0 H ${w} V ${MID - C} A ${R} ${R} 0 1 0 ${w} ${MID + C} V ${H} H 0 V ${MID + C} A ${R} ${R} 0 1 0 0 ${MID - C} Z`;
  }
  // object: 左辺に外向きタブ・右辺フラット
  return `M 0 0 H ${w} V ${H} H 0 V ${MID + C} A ${R} ${R} 0 1 1 0 ${MID - C} Z`;
}

const ROLE_COLORS: Record<Role, { fill: string; stroke: string; text: string }> = {
  subject: { fill: "#bbdefb", stroke: "#1e88e5", text: "#0d47a1" },
  verb: { fill: "#ffccbc", stroke: "#f4511e", text: "#bf360c" },
  object: { fill: "#c8e6c9", stroke: "#43a047", text: "#1b5e20" },
};

type PieceShapeProps = {
  role: Role;
  label: string;
  /** true のときは点線のゴースト輪郭(スロット用) */
  ghost?: boolean;
  className?: string;
};

/**
 * ピース/ゴーストの中身(SVG)だけを描く。
 * ラッパー要素(button / div)は呼び出し側で用意する。
 */
export default function PuzzlePiece({ role, label, ghost = false, className }: PieceShapeProps) {
  const w = pieceWidth(label);
  const path = piecePath(role, w);
  const colors = ROLE_COLORS[role];
  const viewBox = `${-MARGIN} 0 ${w + MARGIN * 2} ${H}`;

  return (
    <svg
      className={className}
      width={w + MARGIN * 2}
      height={H}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", pointerEvents: "none" }}
    >
      <path
        d={path}
        fill={ghost ? "none" : colors.fill}
        stroke={ghost ? "#b0bec5" : colors.stroke}
        strokeWidth={ghost ? 3 : 3}
        strokeDasharray={ghost ? "7 6" : undefined}
        strokeLinejoin="round"
      />
      <text
        x={w / 2}
        y={MID}
        fill={ghost ? "#90a4ae" : colors.text}
        fontSize="20"
        fontWeight="900"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Nunito', system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

export { H as PIECE_HEIGHT, MARGIN as PIECE_MARGIN };
