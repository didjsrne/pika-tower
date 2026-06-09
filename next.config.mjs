import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 상위 폴더의 lockfile 때문에 워크스페이스 루트를 오인하는 경고 방지.
  outputFileTracingRoot: __dirname,
  images: {
    // PokeAPI 스프라이트를 next/image 없이 일반 <img>로 쓰므로 별도 설정 불필요.
    unoptimized: true,
  },
  // ESLint 패키지를 별도 의존성으로 두지 않으므로 빌드 시 린트는 건너뛴다.
  // (타입 검사는 그대로 수행됨)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
