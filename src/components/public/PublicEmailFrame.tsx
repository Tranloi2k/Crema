"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Renders an exported email document in a sandboxed iframe and auto-sizes its
// height to the content, mirroring the editor's PreviewModal measurement.
export function PublicEmailFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(480);

  const syncHeight = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const measure = () => {
      const body = doc.body;
      if (!body) return;
      const next = Math.ceil(body.getBoundingClientRect().height);
      if (next > 0) setHeight(next);
    };
    measure();
    requestAnimationFrame(measure);
    window.setTimeout(measure, 100);
    doc.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true });
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(syncHeight, 0);
    return () => window.clearTimeout(timer);
  }, [html, syncHeight]);

  return (
    <iframe
      ref={iframeRef}
      title="Email preview"
      srcDoc={html}
      sandbox="allow-same-origin"
      scrolling="no"
      onLoad={syncHeight}
      className="block w-full border-0"
      style={{ height }}
    />
  );
}
