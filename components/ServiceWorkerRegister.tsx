"use client";

import { useEffect } from "react";

// PWA 설치 가능 조건을 위해 서비스워커를 등록한다. (UI 렌더링 없음)
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      return; // SW는 HTTPS 또는 localhost에서만 동작
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 등록 실패는 치명적이지 않으므로 조용히 무시
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
