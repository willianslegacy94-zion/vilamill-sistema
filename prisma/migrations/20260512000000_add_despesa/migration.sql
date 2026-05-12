CREATE TABLE "Despesa" (
    "id"            TEXT NOT NULL,
    "descricao"     TEXT NOT NULL,
    "valor"         DECIMAL(10,2) NOT NULL,
    "categoria"     TEXT NOT NULL,
    "data"          TIMESTAMP(3) NOT NULL,
    "registradoPor" TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);
