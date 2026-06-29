"use client";

import { useEffect } from "react";

export default function SupportPage() {
  useEffect(() => {
    window.location.replace("/#support");
  }, []);

  return null;
}
