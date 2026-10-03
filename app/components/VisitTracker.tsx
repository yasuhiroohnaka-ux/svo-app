"use client";

import { useEffect } from "react";

import type { AppId } from "@/app/lib/apps";
import { lastVisitStore } from "@/app/lib/visits";

/** 各アプリの layout に置き、開いた部屋を「つづきから」用に記録する */
export default function VisitTracker({ appId }: { appId: AppId }) {
  useEffect(() => {
    lastVisitStore.set(appId);
  }, [appId]);
  return null;
}
