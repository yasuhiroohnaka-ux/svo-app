"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { makeDiagnosticId } from "@/utils/diagnostics";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const diagnosticId = useMemo(() => makeDiagnosticId("E_GLOBAL"), []);

  useEffect(() => {
    console.error(`[${diagnosticId}] global-error`, error);
  }, [diagnosticId, error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center", background: "#ffebee" }}>
          <div style={{ maxWidth: 560, width: "100%", background: "#fff", border: "1px solid #ef9a9a", borderRadius: 12, padding: 20 }}>
            <h1 style={{ marginTop: 0 }}>Application error</h1>
            <p>診断ID: <strong>{diagnosticId}</strong></p>
            <p style={{ color: "#666" }}>予期しないエラーが発生しました。再試行してください。</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => reset()} style={{ padding: "10px 14px" }}>再試行</button>
              <button onClick={() => window.location.reload()} style={{ padding: "10px 14px" }}>再読み込み</button>
              <Link href="/" style={{ padding: "10px 14px", border: "1px solid #999", borderRadius: 4, textDecoration: "none" }}>
                ホームへ
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
