// Banco local de produtos (IndexedDB com fallback em memória).
// Guarda o catálogo no dispositivo: sobrevive ao reload e funciona offline.
// Quando o backend existir, vira cache local da sincronização.
export interface AdaptadorChaveValor {
  ler<T>(chave: string): Promise<T | null>
  gravar<T>(chave: string, valor: T): Promise<void>
}

function criarAdaptadorMemoria(): AdaptadorChaveValor {
  const mapa = new Map<string, unknown>()
  return {
    ler: async <T>(chave: string) => (mapa.has(chave) ? (mapa.get(chave) as T) : null),
    gravar: async <T>(chave: string, valor: T) => {
      mapa.set(chave, valor)
    },
  }
}

function criarAdaptadorIndexedDB(): AdaptadorChaveValor | null {
  try {
    if (typeof indexedDB === 'undefined') return null
    const abrir = (): Promise<IDBDatabase> =>
      new Promise((resolve, reject) => {
        const pedido = indexedDB.open('point-steak-house', 1)
        pedido.onupgradeneeded = () => {
          if (!pedido.result.objectStoreNames.contains('kv')) pedido.result.createObjectStore('kv')
        }
        pedido.onsuccess = () => resolve(pedido.result)
        pedido.onerror = () => reject(pedido.error)
      })
    let base: Promise<IDBDatabase> | null = null
    const banco = (): Promise<IDBDatabase> => (base ??= abrir())
    async function comLoja<T>(
      modo: IDBTransactionMode,
      fn: (loja: IDBObjectStore) => IDBRequest<T>,
    ): Promise<T> {
      const db = await banco()
      return new Promise((resolve, reject) => {
        const tx = db.transaction('kv', modo)
        const pedido = fn(tx.objectStore('kv'))
        pedido.onsuccess = () => resolve(pedido.result)
        pedido.onerror = () => reject(pedido.error)
      })
    }
    return {
      ler: async <T>(chave: string) => {
        try {
          const valor = await comLoja('readonly', (loja) => loja.get(chave))
          return (valor ?? null) as T | null
        } catch {
          return null
        }
      },
      gravar: async <T>(chave: string, valor: T) => {
        await comLoja('readwrite', (loja) => loja.put(valor, chave))
      },
    }
  } catch {
    return null
  }
}

/** Adaptador padrão: IndexedDB no navegador, memória onde não há (testes/SSR). */
export function criarBancoLocal(): AdaptadorChaveValor {
  return criarAdaptadorIndexedDB() ?? criarAdaptadorMemoria()
}
