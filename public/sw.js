// 피카타워 PWA 서비스워커.
// 오프라인 캐싱은 하지 않는다. PWA "설치 가능(installable)" 조건을 만족시키기 위한
// 최소 패스스루 fetch 핸들러만 둔다. (네트워크로 그대로 전달)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // 네트워크 기본 동작에 위임 (no-op). 핸들러 존재 자체가 설치 조건을 만족시킨다.
});
