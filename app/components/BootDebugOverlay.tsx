"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { runFeatureCheck, type BootStep, type FeatureCheckResult } from "@/utils/bootDiagnostics";

type BootDebugOverlayProps = {
  enabled: boolean;
  step: BootStep;
  storageError?: string | null;
};

const panelStyle: CSSProperties = {
  position: "fixed",
  right: 8,
  bottom: 8,
  zIndex: 9999,
  width: 340,
  maxWidth: "calc(100vw - 16px)",
  background: "rgba(0,0,0,0.85)",
  color: "#e8f5e9",
  border: "1px solid #66bb6a",
  borderRadius: 8,
  padding: 10,
  fontSize: 12,
  lineHeight: 1.4,
  fontFamily: "monospace",
};

function bool(v: boolean): string {
  return v ? "OK" : "NG";
}

export default function BootDebugOverlay({ enabled, step, storageError }: BootDebugOverlayProps) {
  const [ua, setUa] = useState("unknown");
  const [viewport, setViewport] = useState("unknown");
  const [features, setFeatures] = useState<FeatureCheckResult | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      setUa(window.navigator.userAgent);
      setViewport(`${window.innerWidth}x${window.innerHeight}`);
      setFeatures(runFeatureCheck());
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside style={panelStyle}>
      <div><strong>BOOT DEBUG</strong></div>
      <div>step: {step}</div>
      <div>viewport: {viewport}</div>
      <div>bootFlag: {features ? bool(features.bootFlag) : "..."}</div>
      <div>Promise: {features ? bool(features.Promise) : "..."}</div>
      <div>fetch: {features ? bool(features.fetch) : "..."}</div>
      <div>URLSearchParams: {features ? bool(features.URLSearchParams) : "..."}</div>
      <div>localStorage: {features ? bool(features.localStorage) : "..."}</div>
      <div>speechSynthesis: {features ? bool(features.speechSynthesis) : "..."}</div>
      <div>AudioContext: {features ? bool(features.AudioContext) : "..."}</div>
      {storageError ? <div>storage_error: {storageError}</div> : null}
      <div style={{ marginTop: 6, wordBreak: "break-word" }}>ua: {ua}</div>
    </aside>
  );
}
