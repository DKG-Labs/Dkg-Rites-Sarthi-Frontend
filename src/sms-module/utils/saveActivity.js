/*
 * Counts rail-mill save requests (POST / PUT / DELETE through apiCall) that are still running,
 * so submit buttons can show a spinner and block a second click until the save finishes.
 */
import { useSyncExternalStore } from "react";

let pending = 0;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

export const saveStarted = () => {
  pending += 1;
  notify();
};

export const saveFinished = () => {
  pending = Math.max(0, pending - 1);
  notify();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** true while any save request is running */
export const useSaving = () => useSyncExternalStore(subscribe, () => pending > 0);
