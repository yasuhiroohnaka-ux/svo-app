import { createPersistentStore } from "./persistentStore";
import { getApp, type AppId } from "./apps";

/** さいごに あそんだ部屋(ポータルの「つづきから」用) */
export const lastVisitStore = createPersistentStore<AppId | null>({
  key: "kotoba.lastApp",
  fallback: null,
  parse: (value) => (typeof value === "string" && getApp(value) ? (value as AppId) : null),
});
