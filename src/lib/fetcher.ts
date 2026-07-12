export async function fetcher(url: string) {
  const r = await fetch(url)

  if (r.status === 403) {
    const body = await r.json().catch(() => null)
    if (body?.outOfHours) {
      window.location.href = "/bloqueio-horario"
      return new Promise(() => {}) // navegação assume o controle, nunca resolve
    }
  }

  if (!r.ok) throw new Error("Erro ao buscar dados")
  return r.json()
}
