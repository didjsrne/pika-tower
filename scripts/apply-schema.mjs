// schema.sql 을 Supabase Postgres 에 직접 적용하는 1회용 스크립트.
// pg 는 런타임 의존성이 아니므로 실행 전 임시 설치가 필요하다.
//   npm i pg --no-save
//   node --env-file=.env.local scripts/apply-schema.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

let conn =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!conn) {
  console.error("POSTGRES_URL_NON_POOLING / POSTGRES_URL 가 없습니다.");
  process.exit(1);
}
// sslmode 쿼리 파라미터를 제거해 ssl 옵션(rejectUnauthorized:false)이 적용되게 한다.
conn = conn.replace(/[?&]sslmode=[^&]*/i, "");

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    "select count(*)::int as n from public.leaderboard",
  );
  console.log("OK: leaderboard 테이블 준비 완료. 현재 행 수 =", rows[0].n);
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
