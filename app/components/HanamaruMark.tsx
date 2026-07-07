import styles from "./HanamaruMark.module.css";

const HanamaruMark = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 520 260" aria-hidden="true" focusable="false">
        <path
            className={styles.hanamaruLine}
            d="M260 37 C302 -8 372 12 372 70 C432 58 480 106 438 151 C462 206 385 229 338 195 C313 250 224 240 202 195 C145 224 82 181 116 129 C62 88 119 37 178 61 C190 8 242 -4 260 37 Z"
        />
        <path
            className={styles.hanamaruInnerLine}
            d="M301 86 C233 64 181 118 206 171 C233 228 344 196 344 125 C344 74 255 66 231 127 C213 173 274 192 308 154 C335 124 306 103 273 115"
        />
        <path className={styles.hanamaruAccentLine} d="M118 92 C136 81 153 75 174 72" />
        <path className={styles.hanamaruAccentLine} d="M382 78 C406 80 425 89 440 105" />
    </svg>
);

export default HanamaruMark;
