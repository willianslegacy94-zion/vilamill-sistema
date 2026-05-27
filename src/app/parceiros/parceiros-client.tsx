"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Funcionario = {
  id: string;
  nome: string;
  empresa: string;
  saldo: number;
};

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ParceirosClient() {
  const { data: session } = useSession();
  const emailOperador = session?.user?.email ?? "sistema";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal novo funcionário
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaEmpresa, setNovaEmpresa] = useState("Lava-Rápido");
  const [salvando, setSalvando] = useState(false);

  // Modal caixinha
  const [showCaixinhaModal, setShowCaixinhaModal] = useState(false);
  const [caixinhaTipo, setCaixinhaTipo] = useState<"INDIVIDUAL" | "COLETIVO">("COLETIVO");
  const [caixinhaFuncionarioId, setCaixinhaFuncionarioId] = useState("");
  const [caixinhaValor, setCaixinhaValor] = useState("");
  const [caixinhaDescricao, setCaixinhaDescricao] = useState("");
  const [salvandoCaixinha, setSalvandoCaixinha] = useState(false);
  const [feedbackCaixinha, setFeedbackCaixinha] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/parceiros/funcionarios");
      const data = await res.json();
      setFuncionarios(data);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criarFuncionario() {
    if (!novoNome.trim() || !novaEmpresa.trim()) return;
    setSalvando(true);
    try {
      await fetch("/api/parceiros/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim(), empresa: novaEmpresa.trim() }),
      });
      setNovoNome("");
      setNovaEmpresa("Lava-Rápido");
      setShowNovoModal(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function registrarCaixinha() {
    if (!caixinhaValor || Number(caixinhaValor) <= 0) return;
    if (caixinhaTipo === "INDIVIDUAL" && !caixinhaFuncionarioId) return;
    setSalvandoCaixinha(true);
    setFeedbackCaixinha("");
    try {
      const body: Record<string, unknown> = {
        tipo: caixinhaTipo,
        valor: Number(caixinhaValor),
        descricao: caixinhaDescricao || null,
        registradoPor: emailOperador,
      };
      if (caixinhaTipo === "INDIVIDUAL") body.funcionarioId = caixinhaFuncionarioId;
      else body.empresa = "Lava-Rápido";

      const res = await fetch("/api/parceiros/credito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackCaixinha(data.error ?? "Erro ao registrar.");
        return;
      }
      setFeedbackCaixinha(
        caixinhaTipo === "COLETIVO"
          ? `Caixinha registrada para ${data.criados} funcionário(s).`
          : "Caixinha registrada."
      );
      setCaixinhaValor("");
      setCaixinhaDescricao("");
      setCaixinhaFuncionarioId("");
      carregar();
    } finally {
      setSalvandoCaixinha(false);
    }
  }

  const totalFuncionarios = funcionarios.length;
  const totalSaldo = funcionarios.reduce((s, f) => s + f.saldo, 0);

  return (
    <>
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Funcionários</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{totalFuncionarios}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo Total em Aberto</div>
          <div className={`mt-1 text-2xl font-bold ${totalSaldo < 0 ? "text-red-600" : "text-emerald-600"}`}>
            {moeda(totalSaldo)}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button onClick={() => setShowCaixinhaModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          + Registrar Caixinha
        </Button>
        <Button variant="outline" onClick={() => setShowNovoModal(true)}>
          + Novo Funcionário
        </Button>
      </div>

      {/* Lista */}
      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : funcionarios.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum funcionário cadastrado ainda.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Funcionário</th>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-right">Saldo em Aberto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funcionarios.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{f.nome}</td>
                  <td className="px-4 py-3 text-slate-500">{f.empresa}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${f.saldo < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {moeda(f.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal — Novo Funcionário */}
      {showNovoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Novo Funcionário</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nome</label>
                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome do funcionário"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Empresa</label>
                <input
                  value={novaEmpresa}
                  onChange={(e) => setNovaEmpresa(e.target.value)}
                  placeholder="Lava-Rápido"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowNovoModal(false)}
                className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <Button
                onClick={criarFuncionario}
                disabled={salvando || !novoNome.trim()}
                className="flex-1 py-3"
              >
                {salvando ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Registrar Caixinha */}
      {showCaixinhaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 sm:px-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Registrar Caixinha</h3>
              <div className="space-y-4">
                {/* Tipo */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCaixinhaTipo("COLETIVO")}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                      caixinhaTipo === "COLETIVO"
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Caixinha-Lava-Rápido
                  </button>
                  <button
                    onClick={() => setCaixinhaTipo("INDIVIDUAL")}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                      caixinhaTipo === "INDIVIDUAL"
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Individual
                  </button>
                </div>

                {/* Funcionário (só para individual) */}
                {caixinhaTipo === "INDIVIDUAL" && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Funcionário</label>
                    <select
                      value={caixinhaFuncionarioId}
                      onChange={(e) => setCaixinhaFuncionarioId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Selecionar funcionário</option>
                      {funcionarios.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Valor */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Valor por funcionário</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={caixinhaValor}
                      onChange={(e) => setCaixinhaValor(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Descrição (opcional)</label>
                  <input
                    value={caixinhaDescricao}
                    onChange={(e) => setCaixinhaDescricao(e.target.value)}
                    placeholder={`Caixinha ${new Date().toLocaleDateString("pt-BR")}`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                {/* Preview coletivo */}
                {caixinhaTipo === "COLETIVO" && Number(caixinhaValor) > 0 && (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Será creditado para <strong>{totalFuncionarios}</strong> funcionário(s) ·{" "}
                    Total: <strong>{moeda(Number(caixinhaValor) * totalFuncionarios)}</strong>
                  </div>
                )}

                {feedbackCaixinha && (
                  <p className={`text-sm font-medium ${feedbackCaixinha.includes("Erro") || feedbackCaixinha.includes("erro") ? "text-red-600" : "text-emerald-600"}`}>
                    {feedbackCaixinha}
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => { setShowCaixinhaModal(false); setFeedbackCaixinha(""); setCaixinhaValor(""); setCaixinhaDescricao(""); }}
                  className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <Button
                  onClick={registrarCaixinha}
                  disabled={salvandoCaixinha || !caixinhaValor || Number(caixinhaValor) <= 0 || (caixinhaTipo === "INDIVIDUAL" && !caixinhaFuncionarioId)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700"
                >
                  {salvandoCaixinha ? "Registrando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
