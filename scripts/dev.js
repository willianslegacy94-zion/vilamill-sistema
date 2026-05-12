#!/usr/bin/env node
/**
 * Orquestrador de ambiente de desenvolvimento.
 * Fluxo: .env → DB (Docker ou existente) → migrate → generate → next dev
 */
const { execSync, spawnSync, spawn } = require("node:child_process");
const net  = require("node:net");
const fs   = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const GREEN = "\x1b[32m";
const CYAN  = "\x1b[36m";
const RED   = "\x1b[31m";
const RESET = "\x1b[0m";

function log(msg)  { console.log(`${CYAN}[villa:dev]${RESET} ${msg}`); }
function ok(msg)   { console.log(`${GREEN}[villa:dev]${RESET} ${msg}`); }
function fail(msg) { console.error(`${RED}[villa:dev]${RESET} ${msg}`); }

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

/** Testa se a porta já está aceitando conexões (timeout curto). */
function isPortOpen(host, port, timeoutMs = 1_500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.on("connect", () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on("error",   () => { clearTimeout(timer); resolve(false); });
  });
}

/** Aguarda a porta ficar disponível, com polling. */
function waitForPort(host, port, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function attempt() {
      const socket = net.connect(port, host);
      socket.on("connect", () => { socket.destroy(); resolve(); });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout: ${host}:${port} não respondeu em ${timeoutMs / 1000}s`));
        } else {
          setTimeout(attempt, 500);
        }
      });
    }
    attempt();
  });
}

async function main() {
  // 1. Garante que .env existe
  const envPath     = path.join(ROOT, ".env");
  const examplePath = path.join(ROOT, ".env.example");
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      ok(".env criado a partir de .env.example — revise as variáveis se necessário.");
    } else {
      fail(".env não encontrado. Crie um arquivo .env na raiz do projeto.");
      process.exit(1);
    }
  }

  // 2. Sobe o banco só se a porta 5432 ainda não estiver em uso
  const DB_PORT = 5432;
  const dbJaRodando = await isPortOpen("localhost", DB_PORT);
  if (dbJaRodando) {
    ok(`PostgreSQL já está rodando na porta ${DB_PORT} — pulando Docker ✓`);
  } else {
    log("Iniciando PostgreSQL (Docker)...");
    const result = spawnSync("docker", ["compose", "up", "-d"], {
      stdio: "inherit",
      cwd: ROOT,
      shell: true,
    });
    if (result.status !== 0) {
      fail("Falha ao iniciar Docker. Certifique-se de que o Docker Desktop está aberto.");
      process.exit(1);
    }

    // 3. Aguarda o banco aceitar conexões
    log(`Aguardando PostgreSQL na porta ${DB_PORT}...`);
    try {
      await waitForPort("localhost", DB_PORT);
    } catch (e) {
      fail(e.message);
      process.exit(1);
    }
    ok("PostgreSQL pronto ✓");
  }

  // 4. Aplica migrações pendentes (sem prompts interativos)
  log("Aplicando migrações Prisma...");
  run("yarn prisma migrate deploy");
  ok("Migrações aplicadas ✓");

  // 5. Gera o Prisma Client
  run("yarn prisma generate");

  // 6. Inicia o Next.js
  ok("Iniciando Next.js → http://localhost:3000\n");
  const next = spawn("yarn", ["next", "dev"], {
    stdio: "inherit",
    cwd: ROOT,
    shell: true,
  });

  function shutdown() { next.kill(); process.exit(0); }
  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => { fail(e.message); process.exit(1); });
