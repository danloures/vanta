
/* eslint-disable no-console */
// scripts/healthcheck.mjs
// VANTA Supabase Healthcheck (real tests)
// Run: node scripts/healthcheck.mjs
//
// Optional env for authenticated tests:
//   HC_TEST_EMAIL=...
//   HC_TEST_PASSWORD=...
//
// Required env (must be loaded from .env or environment):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY

import process from "node:process";

const REQUIRED_TABLES = [
  "profiles",
  "events",
  "event_rsvps",
  "member_applications",
  // "event_staff", // DEPRECATED: Substituído por community_staff e JSONB em events
  "user_tickets",       // Core: Carteira e QR Codes
  "community_staff",    // Core: Gestão de Equipe por Unidade
  "vanta_audit_logs",   // Core: Auditoria e Rastreabilidade
  "incidence_reports",  // Core: Tribunal de Ética
  "vanta_indica",       // Core: Curadoria de Destaques
  "notifications",      // Core: Sistema de Inbox
  "ticket_transfers"    // Core: Gift Protocol
];

const DEFAULT_BUCKET = "selfies";

// ---------- helpers ----------
const now = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ok(msg) { console.log(`✅ ${msg}`); }
function warn(msg) { console.log(`🟡 ${msg}`); }
function fail(msg) { console.log(`❌ ${msg}`); }

function section(title) {
  console.log(`\n==================== ${title} ====================`);
}

function getEnv(name) {
  const v = process.env[name];
  return (v && String(v).trim().length) ? String(v).trim() : null;
}

function parsePostgrestError(err) {
  if (!err) return null;
  // supabase-js returns { message, details, hint, code }
  return {
    message: err.message ?? String(err),
    details: err.details ?? null,
    hint: err.hint ?? null,
    code: err.code ?? null,
  };
}

function classifyDbError(errObj) {
  const e = parsePostgrestError(errObj);
  if (!e) return { kind: "none", e: null };

  const msg = (e.message || "").toLowerCase();
  const details = (e.details || "").toLowerCase();
  const code = e.code || "";

  // Common PostgREST/supabase patterns
  if (msg.includes("jwt")) return { kind: "auth_jwt", e };
  if (msg.includes("relation") && msg.includes("does not exist")) return { kind: "table_missing", e };
  if (msg.includes("permission denied")) return { kind: "permission_denied", e };
  if (msg.includes("new row violates row-level security policy")) return { kind: "rls_block", e };
  if (msg.includes("violates not-null constraint")) return { kind: "not_null", e };
  if (msg.includes("violates foreign key constraint")) return { kind: "fk", e };
  if (code === "42501") return { kind: "permission_denied", e };
  if (code === "42P01") return { kind: "table_missing", e };

  // Storage errors sometimes come as message strings:
  if (msg.includes("bucket") && msg.includes("not found")) return { kind: "bucket_missing", e };
  if (msg.includes("not authorized") || msg.includes("unauthorized")) return { kind: "unauthorized", e };

  // fallback
  return { kind: "unknown", e };
}

async function main() {
  section("VANTA HEALTHCHECK");

  // ---------- ENV ----------
  section("ENV");
  const url = getEnv("VITE_SUPABASE_URL");
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");

  if (!url) {
    fail("VITE_SUPABASE_URL não está definido no ambiente (ex.: .env.local).");
    // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
    process['exitCode'] = 1;
    return;
  }
  if (!anonKey) {
    fail("VITE_SUPABASE_ANON_KEY não está definido no ambiente (ex.: .env.local).");
    // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
    process['exitCode'] = 1;
    return;
  }

  try {
    // basic URL sanity
    new URL(url);
    ok("VITE_SUPABASE_URL OK");
  } catch {
    fail("VITE_SUPABASE_URL não é uma URL válida.");
    // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
    process['exitCode'] = 1;
    return;
  }
  ok("VITE_SUPABASE_ANON_KEY OK");

  // ---------- SUPABASE CLIENT ----------
  section("CLIENT");
  let supabase;
  try {
    const mod = await import("@supabase/supabase-js");
    const { createClient } = mod;
    supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
    ok("createClient OK");
  } catch (e) {
    fail(`Falha ao importar @supabase/supabase-js. Você instalou as dependências? Erro: ${String(e)}`);
    // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
    process['exitCode'] = 1;
    return;
  }

  // ---------- ANON AUTH PING ----------
  section("AUTH (ANON)");
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      const c = classifyDbError(error);
      fail(`auth.getSession falhou: ${c.e?.message || String(error)}`);
      // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
      process['exitCode'] = 1;
    } else {
      ok(`auth.getSession OK (session=${data?.session ? "present" : "null"})`);
    }
  } catch (e) {
    fail(`auth.getSession throw: ${String(e)}`);
    // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
    process['exitCode'] = 1;
  }

  // ---------- DB: table reachability via SELECT ----------
  section("DB (SELECT)");
  for (const table of REQUIRED_TABLES) {
    try {
      const { data, error, status } = await supabase.from(table).select("*").limit(1);
      if (error) {
        const c = classifyDbError(error);
        if (c.kind === "table_missing") {
          fail(`${table}: TABELA NÃO EXISTE (relation missing)`);
        } else if (c.kind === "permission_denied" || c.kind === "rls_block") {
          warn(`${table}: bloqueado por RLS/policy para ANON (isso pode ser OK). Detalhe: ${c.e?.message}`);
        } else {
          warn(`${table}: erro no SELECT (status ${status}). Detalhe: ${c.e?.message}`);
        }
      } else {
        ok(`${table}: SELECT OK (rows_sample=${Array.isArray(data) ? data.length : 0})`);
      }
    } catch (e) {
      fail(`${table}: SELECT throw: ${String(e)}`);
      // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
      process['exitCode'] = 1;
    }
  }

  // ---------- AUTHENTICATED TESTS (optional) ----------
  const testEmail = getEnv("HC_TEST_EMAIL");
  const testPassword = getEnv("HC_TEST_PASSWORD");

  if (!testEmail || !testPassword) {
    section("AUTHENTICATED TESTS");
    warn("HC_TEST_EMAIL/HC_TEST_PASSWORD não definidos → pulando testes autenticados (RLS real + Storage upload).");
  } else {
    section("AUTH (LOGIN TEST USER)");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError || !signInData?.session) {
      const c = classifyDbError(signInError);
      fail(`Login do usuário de teste falhou: ${c.e?.message || String(signInError)}`);
      // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
      process['exitCode'] = 1;
    } else {
      ok("Login do usuário de teste OK");

      // Ensure profile exists / reachable
      section("DB (AUTH SELECT/UPSERT profiles)");
      const userId = signInData.user?.id;

      if (!userId) {
        fail("Não consegui obter user.id após login.");
        // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
        process['exitCode'] = 1;
      } else {
        // 1) SELECT own profile
        const { data: p, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (pErr) {
          const c = classifyDbError(pErr);
          fail(`profiles SELECT do próprio id falhou: ${c.e?.message}`);
          // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
          process['exitCode'] = 1;
        } else {
          ok(`profiles SELECT do próprio id OK (exists=${p ? "yes" : "no"})`);
        }

        // 2) UPSERT minimal to detect RLS/permissions
        const payload = { id: userId, updated_at: now() };
        const { error: upErr } = await supabase
          .from("profiles")
          .upsert(payload, { onConflict: "id" });

        if (upErr) {
          const c = classifyDbError(upErr);
          if (c.kind === "rls_block" || c.kind === "permission_denied") {
            fail(`profiles UPSERT bloqueado (RLS/policy). Detalhe: ${c.e?.message}`);
          } else {
            fail(`profiles UPSERT falhou. Detalhe: ${c.e?.message}`);
          }
          // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
          process['exitCode'] = 1;
        } else {
          ok("profiles UPSERT minimal OK");
        }
      }

      // ---------- Storage upload test ----------
      section("STORAGE (AUTH UPLOAD)");
      try {
        // Small text blob upload to test policies/bucket existence
        const path = `healthcheck/${Date.now()}-${Math.random().toString(16).slice(2)}.txt`;
        const fileBody = new Blob([`vanta-healthcheck ${now()}`], { type: "text/plain" });

        const { data: upData, error: upError } = await supabase
          .storage
          .from(DEFAULT_BUCKET)
          .upload(path, fileBody, { upsert: false });

        if (upError) {
          const c = classifyDbError(upError);
          if (c.kind === "bucket_missing") {
            fail(`Bucket '${DEFAULT_BUCKET}' não existe (ou nome diferente).`);
          } else if (c.kind === "unauthorized" || c.kind === "permission_denied" || c.kind === "rls_block") {
            fail(`Upload no bucket '${DEFAULT_BUCKET}' bloqueado por policy. Detalhe: ${c.e?.message}`);
          } else {
            fail(`Upload no bucket '${DEFAULT_BUCKET}' falhou: ${c.e?.message}`);
          }
          // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
          process['exitCode'] = 1;
        } else {
          ok(`Upload no bucket '${DEFAULT_BUCKET}' OK (path=${upData?.path || path})`);
        }
      } catch (e) {
        fail(`Storage upload throw: ${String(e)}`);
        // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
        process['exitCode'] = 1;
      }

      // ---------- Realtime sanity ----------
      section("REALTIME (AUTH)");
      try {
        // subscribe to a dummy channel to ensure websocket works
        const channel = supabase.channel("healthcheck-channel");
        let subscribed = false;

        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") subscribed = true;
        });

        await sleep(2500);

        if (subscribed) ok("Realtime websocket SUBSCRIBED OK");
        else warn("Realtime não confirmou SUBSCRIBED (pode ser rede/firewall).");

        await channel.unsubscribe();
      } catch (e) {
        warn(`Realtime test throw: ${String(e)}`);
      }

      // logout
      await supabase.auth.signOut();
      ok("Logout do usuário de teste OK");
    }
  }

  // ---------- summary ----------
  section("SUMMARY");
  // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
  if (process['exitCode'] && process['exitCode'] !== 0) {
    fail("Healthcheck terminou com ERROS. Use as linhas acima para corrigir exatamente o que faltou.");
  } else {
    ok("Healthcheck terminou OK (ou com avisos esperados para ANON).");
  }
}

main().catch((e) => {
  fail(`Healthcheck crashed: ${String(e)}`);
  // Fix: Using bracket notation to bypass "Property 'exitCode' does not exist" error
  process['exitCode'] = 1;
});
