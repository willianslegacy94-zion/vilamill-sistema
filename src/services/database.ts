export interface DatabaseConfig {
  url: string;
  provider: "postgresql" | "mysql" | "sqlite";
}

export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL ?? "",
  provider: "postgresql",
};

export function validateDatabaseConfig() {
  if (!databaseConfig.url) {
    throw new Error("DATABASE_URL nao configurada.");
  }
}
