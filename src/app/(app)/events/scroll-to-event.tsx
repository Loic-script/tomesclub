"use client";

import { useEffect } from "react";

// Venu du calendrier (/events?event=<id>) : on fait défiler jusqu à cet événement.
export function ScrollToEvent({ id }: { id: string }) {
  useEffect(() => {
    document
      .getElementById(`event-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [id]);
  return null;
}
