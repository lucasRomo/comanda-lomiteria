// Pedidos de la demo: viven en el navegador (localStorage) y se regeneran cada día.
import { useSyncExternalStore } from 'react'
import { negocio } from '../config/negocio'
import { ahoraMin, hoyClave, sumarDias } from './formato'

export type Pago = 'efectivo' | 'transferencia' | 'mercadopago'
export const pagos: Record<Pago, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago' }

export type EstadoPedido = 'nuevo' | 'cocina' | 'listo' | 'camino' | 'entregado' | 'cancelado'
export const estados: Record<EstadoPedido, string> = {
  nuevo: 'Nuevos',
  cocina: 'En cocina',
  listo: 'Listos',
  camino: 'En camino',
  entregado: 'Entregados',
  cancelado: 'Cancelado',
}

export type Linea = { productoId: string; cant: number }
export type Pedido = {
  id: string
  numero: number
  dia: string
  hora: number // minutos desde medianoche, cuando entró
  cliente: string
  telefono: string
  lineas: Linea[]
  entrega: 'delivery' | 'retiro'
  barrio?: string
  direccion?: string
  envio: number
  pago: Pago
  nota?: string
  estado: EstadoPedido
  origen: 'web' | 'whatsapp' | 'mostrador'
}

export type Estado = { version: number; generado: string; pedidos: Pedido[]; agotados: string[]; precios: Record<string, number>; ultimo: number }

const VERSION = 1
const CLAVE = 'naupa-demo'

function azar(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const nombres = ['Matías', 'Lucas', 'Franco', 'Nico', 'Santi', 'Tomás', 'Joaco', 'Facu', 'Agus', 'Bruno', 'Cami', 'Sofi', 'Vale', 'Flor', 'Euge', 'Pau', 'Mica', 'Ramiro', 'Diego', 'Seba', 'Ceci', 'Romi', 'Gastón', 'Ale']
const apellidos = ['G.', 'F.', 'B.', 'L.', 'V.', 'S.', 'R.', 'D.', 'P.', 'M.', 'H.', 'Q.', 'C.', 'A.']
const calles = ['Santa Rosa', 'Colón', 'Rodríguez Peña', 'Duarte Quirós', 'Caseros', 'La Rioja', 'Jujuy', 'Mendoza', 'Sargento Cabral', 'Fragueiro']
const mezcla: [string, number][] = [
  ['lomo-completo', 22], ['lomo-clasico', 10], ['lomo-naupa', 9], ['lomo-pizza', 5], ['burger-completa', 9], ['burger-doble', 8],
  ['burger-simple', 5], ['pizza-muzza', 9], ['pizza-especial', 6], ['pizza-fugazzeta', 4], ['emp-docena', 6], ['emp-carne', 4],
  ['papas', 8], ['papas-chedar', 5], ['gaseosa', 14], ['cerveza', 10],
]

function generar(): Estado {
  const hoy = hoyClave()
  const ahora = ahoraMin()
  const r = azar(Number(hoy.replace(/-/g, '')) + 31)
  const elegir = () => {
    const total = mezcla.reduce((s, [, p]) => s + p, 0)
    let x = r() * total
    for (const [id, p] of mezcla) if ((x -= p) <= 0) return id
    return 'lomo-completo'
  }
  const pedidos: Pedido[] = []
  let numero = 2300

  const nuevo = (dia: string, hora: number, estado: EstadoPedido): Pedido => {
    const lineas: Linea[] = []
    const cuantos = 1 + Math.floor(r() * 3.2)
    for (let i = 0; i < cuantos; i++) {
      const id = elegir()
      const ya = lineas.find((l) => l.productoId === id)
      if (ya) ya.cant++
      else lineas.push({ productoId: id, cant: id === 'emp-carne' ? 3 + Math.floor(r() * 4) : 1 + (r() < 0.25 ? 1 : 0) })
    }
    const delivery = r() < 0.72
    const zona = negocio.zonas[Math.floor(r() * r() * negocio.zonas.length)]
    return {
      id: `p${++numero}`, numero, dia, hora, estado,
      cliente: `${nombres[Math.floor(r() * nombres.length)]} ${apellidos[Math.floor(r() * apellidos.length)]}`,
      telefono: `351 ${Math.floor(150 + r() * 650)}-${String(Math.floor(r() * 10000)).padStart(4, '0')}`,
      lineas,
      entrega: delivery ? 'delivery' : 'retiro',
      barrio: delivery ? zona.barrio : undefined,
      direccion: delivery ? `${calles[Math.floor(r() * calles.length)]} ${100 + Math.floor(r() * 2800)}` : undefined,
      envio: delivery ? zona.envio : 0,
      pago: (['efectivo', 'transferencia', 'mercadopago'] as Pago[])[Math.floor(r() * 3)],
      nota: r() < 0.15 ? ['Sin tomate', 'Timbre no anda, llamar', 'La mayonesa aparte', 'Bien cocido el lomo'][Math.floor(r() * 4)] : undefined,
      origen: r() < 0.58 ? 'web' : r() < 0.8 ? 'whatsapp' : 'mostrador',
    }
  }

  // Historia: 45 días de servicio de mediodía y noche
  for (let d = -45; d <= -1; d++) {
    const dia = sumarDias(hoy, d)
    const dow = new Date(dia + 'T12:00').getDay()
    const base = dow === 5 || dow === 6 ? 62 : dow === 0 ? 48 : 30
    const n = base + Math.floor(r() * 14)
    for (let i = 0; i < n; i++) {
      const noche = r() < 0.78
      const hora = noche ? 1170 + Math.floor(Math.pow(r(), 0.7) * 290) : 690 + Math.floor(r() * 230)
      pedidos.push(nuevo(dia, hora, r() < 0.03 ? 'cancelado' : 'entregado'))
    }
  }
  // Hoy: un servicio en marcha alrededor de la hora actual, para que el tablero tenga vida
  const reparto: [number, EstadoPedido][] = [
    [-95, 'entregado'], [-88, 'entregado'], [-80, 'entregado'], [-72, 'entregado'], [-65, 'entregado'], [-58, 'entregado'],
    [-52, 'entregado'], [-44, 'entregado'], [-38, 'camino'], [-31, 'camino'], [-26, 'listo'], [-19, 'cocina'],
    [-14, 'cocina'], [-9, 'cocina'], [-4, 'nuevo'], [-1, 'nuevo'],
  ]
  for (const [m, e] of reparto) pedidos.push(nuevo(hoy, ahora + m, e))

  return { version: VERSION, generado: hoy, pedidos, agotados: ['pizza-fugazzeta'], precios: {}, ultimo: numero }
}

function cargar(): Estado {
  try {
    const e = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Estado | null
    if (e && e.version === VERSION && e.generado === hoyClave()) return e
  } catch {
    /* sin almacenamiento */
  }
  return generar()
}

let estado = cargar()
const oyentes = new Set<() => void>()
function guardar(e: Estado) {
  estado = e
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e))
  } catch {
    /* modo privado */
  }
  oyentes.forEach((f) => f())
}
const suscribir = (f: () => void) => {
  oyentes.add(f)
  return () => {
    oyentes.delete(f)
  }
}
export const useDatos = () => useSyncExternalStore(suscribir, () => estado)

// Otra pestaña (la web) puede cargar un pedido: el panel lo ve al instante
window.addEventListener('storage', (ev) => {
  if (ev.key === CLAVE && ev.newValue) {
    estado = JSON.parse(ev.newValue)
    oyentes.forEach((f) => f())
  }
})

export const reiniciar = () => guardar(generar())
export const precio = (e: Estado, id: string) => e.precios[id] ?? negocio.carta.find((p) => p.id === id)!.precio
export const subtotal = (e: Estado, lineas: Linea[]) => lineas.reduce((s, l) => s + precio(e, l.productoId) * l.cant, 0)
export const total = (e: Estado, p: Pedido) => subtotal(e, p.lineas) + p.envio

export function cargarPedido(p: Omit<Pedido, 'id' | 'numero' | 'dia' | 'hora' | 'estado'>) {
  const numero = estado.ultimo + 1
  const pedido: Pedido = { ...p, id: `p${numero}`, numero, dia: hoyClave(), hora: ahoraMin(), estado: 'nuevo' }
  guardar({ ...estado, pedidos: [...estado.pedidos, pedido], ultimo: numero })
  return pedido
}
export const moverPedido = (id: string, e: EstadoPedido) => guardar({ ...estado, pedidos: estado.pedidos.map((p) => (p.id === id ? { ...p, estado: e } : p)) })
export const alternarAgotado = (id: string) =>
  guardar({ ...estado, agotados: estado.agotados.includes(id) ? estado.agotados.filter((x) => x !== id) : [...estado.agotados, id] })
export const cambiarPrecio = (id: string, n: number) => guardar({ ...estado, precios: { ...estado.precios, [id]: n } })

export const abiertoAhora = () => {
  const m = ahoraMin()
  return negocio.horario.some(([a, b]) => (m >= a && m < b) || (b > 1440 && m < b - 1440))
}
