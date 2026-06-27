"use client";

export type DadosCupomItem = {
  quantidade: string;
  subtotal: string;
  observacoes?: string | null;
  product: { nome: string; categoria: string };
};

export type DadosCupom = {
  mesa: number;
  items: DadosCupomItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos: Array<{ forma: string; valor: number }>;
  atendente: string;
  fechadoEm: Date;
};

const FORMA_LABEL: Record<string, string> = {
  DINHEIRO: "DINHEIRO",
  CREDITO: "CARTAO CREDITO",
  DEBITO: "CARTAO DEBITO",
  PIX: "PIX",
  VOUCHER: "VOUCHER VR/VA",
};

function moedaR(v: number): string {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function formatData(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatHora(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Row({ label, valor, negrito }: { label: string; valor: string; negrito?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", fontWeight: negrito ? "bold" : "normal" }}>
      <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {label}
      </span>
      <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{valor}</span>
    </div>
  );
}

function Sep({ duplo }: { duplo?: boolean }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: duplo ? "2px solid #000" : "1px dashed #000",
        margin: "5px 0",
      }}
    />
  );
}

export default function CupomImpressao({ dados }: { dados: DadosCupom }) {
  const pagsValidos = dados.pagamentos.filter((p) => p.valor > 0);

  return (
    <div
      className="print-area hidden"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "10pt",
        lineHeight: "1.4",
        color: "#000",
        background: "#fff",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ fontWeight: "bold", fontSize: "11pt" }}>VILLA MILL TAMBORÉ</div>
      <div>BARUERI - SP</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt" }}>
        <span>CNPJ: 34.668.474/0001-28</span>
      </div>

      <Sep />

      {/* Metadados */}
      <Row label={`MESA: ${String(dados.mesa).padStart(2, "0")}`} valor={`DATA: ${formatData(dados.fechadoEm)}`} />
      <Row
        label={`HORA: ${formatHora(dados.fechadoEm)}`}
        valor={`ATEND: ${dados.atendente.toUpperCase().slice(0, 10)}`}
      />

      <Sep />

      {/* Cabeçalho de colunas */}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
        <span>QTD ITEM</span>
        <span>VALOR</span>
      </div>

      <Sep />

      {/* Itens */}
      {dados.items.map((item, i) => (
        <div key={i} style={{ marginBottom: "2px" }}>
          <Row
            label={`${Math.round(Number(item.quantidade))}x ${item.product.nome.toUpperCase()}`}
            valor={Number(item.subtotal).toFixed(2).replace(".", ",")}
          />
          {item.observacoes && (
            <div style={{ paddingLeft: "14px", fontSize: "9pt" }}>
              {"-> " + item.observacoes.toUpperCase()}
            </div>
          )}
        </div>
      ))}

      <Sep />

      {/* Totais */}
      <Row label="SUB-TOTAL:" valor={moedaR(dados.subtotal)} />
      {dados.desconto > 0 && <Row label="DESCONTO:" valor={moedaR(dados.desconto)} />}

      <Sep duplo />

      <Row label="TOTAL:" valor={moedaR(dados.total)} negrito />

      <Sep duplo />

      {/* Pagamentos */}
      {pagsValidos.length > 0 && (
        <>
          {pagsValidos.map((pag, i) => (
            <Row key={i} label={`${FORMA_LABEL[pag.forma] ?? pag.forma}:`} valor={moedaR(pag.valor)} />
          ))}
          <Sep />
        </>
      )}

      {/* Rodapé */}
      <div style={{ textAlign: "center", margin: "6px 0 4px" }}>
        <div style={{ fontWeight: "bold" }}>OBRIGADO PELA PREFERENCIA!</div>
        <div style={{ fontSize: "9pt", marginTop: "3px" }}>Guarde este cupom como</div>
        <div style={{ fontSize: "9pt" }}>comprovante do seu pedido.</div>
      </div>

      <Sep />
    </div>
  );
}
