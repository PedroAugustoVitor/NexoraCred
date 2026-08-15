/**
 * Acesso às taxas do simulador.
 *
 * As taxas moraram hardcoded em App.vue até a migração para o backend; agora
 * vêm da API e são mantidas em cache no localStorage. O cache existe para que o
 * simulador continue utilizável se a API estiver fora do ar — nesse caso o
 * chamador recebe `stale: true` e a interface avisa o usuário.
 */

const CACHE_KEY = 'nexoracred:rates'
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const REQUEST_TIMEOUT_MS = 8000

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const cached = JSON.parse(raw)
    if (!Array.isArray(cached?.groups) || cached.groups.length === 0) return null

    return cached
  } catch {
    // localStorage indisponível (modo privado, cota cheia) ou JSON corrompido:
    // seguir sem cache é preferível a quebrar o simulador.
    return null
  }
}

function writeCache(payload) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...payload, cachedAt: new Date().toISOString() })
    )
  } catch {
    // Falha ao gravar cache não impede o uso das taxas recém-baixadas.
  }
}

/** Rejeita payloads que não sirvam para simular, para não cachear lixo. */
function isUsable(payload) {
  return (
    payload &&
    Array.isArray(payload.groups) &&
    payload.groups.length > 0 &&
    payload.groups.every(
      (group) =>
        typeof group.slug === 'string' &&
        typeof group.name === 'string' &&
        Array.isArray(group.rates) &&
        group.rates.length > 0 &&
        group.rates.every(
          (rate) =>
            Number.isInteger(rate.installments) &&
            rate.installments >= 1 &&
            Number.isFinite(rate.coefficient) &&
            Number.isFinite(rate.limitFactor)
        )
    )
  )
}

/**
 * Carrega as taxas.
 * @returns {Promise<{groups: Array, updatedAt: string|null, cachedAt: string|null, stale: boolean, error: string|null}>}
 *   `stale: true` indica que os dados vieram do cache porque a API falhou.
 */
export async function fetchRates() {
  if (!API_URL) {
    const cached = readCache()
    const message = 'VITE_API_URL não configurada. Copie .env.example para .env.'
    return cached
      ? { ...cached, stale: true, error: message }
      : { groups: [], updatedAt: null, cachedAt: null, stale: false, error: message }
  }

  try {
    // Sem AbortSignal a página ficaria em "carregando" indefinidamente se a API
    // aceitasse a conexão e não respondesse.
    const response = await fetch(`${API_URL}/api/v1/rates`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })

    if (!response.ok) throw new Error(`A API respondeu ${response.status}`)

    const payload = await response.json()
    if (!isUsable(payload)) throw new Error('A API devolveu taxas em formato inesperado')

    writeCache(payload)
    return {
      groups: payload.groups,
      updatedAt: payload.updatedAt ?? null,
      cachedAt: null,
      stale: false,
      error: null
    }
  } catch (error) {
    const cached = readCache()
    const message = error.name === 'TimeoutError' ? 'tempo de resposta esgotado' : error.message

    if (cached) {
      return { ...cached, stale: true, error: message }
    }
    return { groups: [], updatedAt: null, cachedAt: null, stale: false, error: message }
  }
}
