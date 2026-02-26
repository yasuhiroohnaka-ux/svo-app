export type BootStep = "boot" | "auth" | "fetch" | "ready" | "error";

export type FeatureCheckResult = {
  Promise: boolean;
  fetch: boolean;
  URLSearchParams: boolean;
  localStorage: boolean;
  speechSynthesis: boolean;
  AudioContext: boolean;
  bootFlag: boolean;
};

function hasLocalStorageAccess(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "__boot_debug__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function runFeatureCheck(): FeatureCheckResult {
  if (typeof window === "undefined") {
    return {
      Promise: false,
      fetch: false,
      URLSearchParams: false,
      localStorage: false,
      speechSynthesis: false,
      AudioContext: false,
      bootFlag: false,
    };
  }

  const w = window as Window & { webkitAudioContext?: unknown };
  return {
    Promise: typeof Promise !== "undefined",
    fetch: typeof w.fetch === "function",
    URLSearchParams: typeof URLSearchParams !== "undefined",
    localStorage: hasLocalStorageAccess(),
    speechSynthesis: typeof w.speechSynthesis !== "undefined",
    AudioContext: typeof w.AudioContext === "function" || typeof w.webkitAudioContext === "function",
    bootFlag: w.__BOOT_OK__ === true,
  };
}

export function hasFatalFeatureGap(result: FeatureCheckResult): boolean {
  return !(result.Promise && result.fetch && result.URLSearchParams);
}
