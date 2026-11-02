import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, Globe, Menu, RotateCcw, UtensilsCrossed } from 'lucide-react'
import { negocio } from '../config/negocio'
import { ahoraMin, capital, diaMes, fechaLarga, hora, hoyClave, pct, pesos, sumarDias } from '../lib/formato'
import { abiertoAhora, alternarAgotado, cambiarPrecio, estados, moverPedido, pagos, precio, reiniciar, total, useDatos, type EstadoPedido, type Pedido } from '../lib/datos'
import { Barras } from './Barras'

const menu = [
  { a: '/admin', texto: 'Comandas', icono: ClipboardList, fin: true },
  { a: '/admin/carta', texto: 'Carta y precios', icono: UtensilsCrossed },
  { a: '/admin/ventas', texto: 'Ventas', icono: BarChart3 },
]

export function Layout() {
  const e = useDatos()
  const [abierto, setAbierto] = useState(false)
  const lugar = useLocation()
  useEffect(() => {
    document.title = `Panel · ${negocio.nombre}`
    setAbierto(false)
  }, [lugar.pathname])
  const nuevos = e.pedidos.filter((p) => p.dia === hoyClave() && p.estado === 'nuevo').length
  return (
    <div className="admin">
      <aside className={`lateral ${abierto ? 'lateral-abierta' : ''}`}>
        <div className="producto">
          <span className="producto-marca" aria-hidden="true">Ñ</span>
          <span>
            <strong>{negocio.nombre}</strong>
            <small>{negocio.barrio}, {negocio.ciudad}</small>
          </span>
        </div>
        <nav className="menu">
          {menu.map(({ a, texto, icono: I, fin }) => (
            <NavLink key={a} to={a} end={fin}>
              <I size={17} strokeWidth={1.8} aria-hidden="true" />
              {texto}
              {a === '/admin' && nuevos > 0 && <span className="insignia">{nuevos}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="lateral-pie">
          <NavLink to="/" className="menu-secundario"><Globe size={16} strokeWidth={1.8} aria-hidden="true" /> Ver la carta online</NavLink>
          <button className="menu-secundario" onClick={reiniciar}><RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" /> Reiniciar demo</button>
          <p className="hecho-con">Hecho con Comanda · demo</p>
        </div>
      </aside>
      <header className="superior">
        <button className="btn-icono solo-telefono" onClick={() => setAbierto(!abierto)} aria-label="Menú"><Menu size={20} /></button>
        <p className="superior-texto">{capital(fechaLarga(hoyClave()))} · {abiertoAhora() ? 'abierto' : 'cerrado'}</p>
        <Link to="/" className="boton boton-chico">Pedir como cliente</Link>
      </header>
      <main className="hoja-admin">
        <Outlet />
      </main>
    </div>
  )
}

// ——— Comandas ———

const columnas: { estado: EstadoPedido; siguiente?: EstadoPedido; accion?: string }[] = [
  { estado: 'nuevo', siguiente: 'cocina', accion: 'Aceptar' },
  { estado: 'cocina', siguiente: 'listo', accion: 'Está listo' },
  { estado: 'listo', siguiente: 'camino', accion: 'Salió' },
  { estado: 'camino', siguiente: 'entregado', accion: 'Entregado' },
]

function useMinuto() {
  const [, set] = useState(0)
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), 30000)
    return () => clearInterval(t)
  }, [])
  return ahoraMin()
}

function Tarjeta({ p, accion, siguiente }: { p: Pedido; accion?: string; siguiente?: EstadoPedido }) {
  const e = useDatos()
  const ahora = useMinuto()
  const espera = (ahora - p.hora + 1440) % 1440
  return (
    <article className={`comanda-tarjeta ${p.estado === 'nuevo' ? 'nueva' : ''}`}>
      <div className="comanda-arriba">
        <strong>N° {p.numero} · {p.cliente}</strong>
        <span className={`comanda-reloj ${espera > 40 && p.estado !== 'camino' ? 'tarde' : ''}`}>{espera} min</span>
      </div>
      <ul className="comanda-items">
        {p.lineas.map((l) => (
          <li key={l.productoId}><b>{l.cant}×</b> {negocio.carta.find((x) => x.id === l.productoId)!.nombre}</li>
        ))}
      </ul>
      {p.nota && <p className="comanda-nota">{p.nota}</p>}
      <div className="comanda-pie">
        <span>{p.entrega === 'delivery' ? `${p.direccion}, ${p.barrio}` : 'Retira en el local'}</span>
      </div>
      <div className="comanda-pie">
        <span>{pesos(total(e, p))} · {pagos[p.pago]} {p.origen === 'web' && <span className="etiqueta etiqueta-web">Web</span>}</span>
        {siguiente && <button className={`boton boton-chico ${p.estado === 'nuevo' ? 'boton-primario' : ''}`} onClick={() => moverPedido(p.id, siguiente)}>{accion}</button>}
      </div>
    </article>
  )
}

export function Comandas() {
  const e = useDatos()
  const hoy = hoyClave()
  const ahora = useMinuto()
  const deHoy = e.pedidos.filter((p) => p.dia === hoy)
  const entregados = deHoy.filter((p) => p.estado === 'entregado')
  const vendido = entregados.reduce((s, p) => s + total(e, p), 0)
  const activos = deHoy.filter((p) => !['entregado', 'cancelado'].includes(p.estado))
  const demora = activos.length ? Math.round(activos.reduce((s, p) => s + ((ahora - p.hora + 1440) % 1440), 0) / activos.length) : 0
  const web = deHoy.filter((p) => p.origen === 'web').length
  const [vista, setVista] = useState<EstadoPedido>('nuevo')

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Comandas</h1>
          <p>{activos.length} pedidos en marcha. Tocá el botón de cada comanda para pasarla a la columna siguiente.</p>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Vendido hoy</span><strong>{pesos(vendido)}</strong><small>{entregados.length} pedidos entregados</small></div>
        <div className="kpi"><span>En marcha</span><strong>{activos.length}</strong><small>{pesos(activos.reduce((s, p) => s + total(e, p), 0))} por cobrar</small></div>
        <div className="kpi"><span>Espera promedio</span><strong className={demora > 35 ? 'mal' : ''}>{demora} min</strong><small>de los pedidos en marcha</small></div>
        <div className="kpi"><span>Pedidos por la carta online</span><strong>{web} de {deHoy.length}</strong><small>sin comisión de apps</small></div>
      </div>
      <div className="columnas-pestanas" role="tablist" aria-label="Columna">
        {columnas.map((c) => (
          <button key={c.estado} role="tab" aria-selected={vista === c.estado} className={vista === c.estado ? 'activa' : ''} onClick={() => setVista(c.estado)}>
            {estados[c.estado]} <span>{deHoy.filter((p) => p.estado === c.estado).length}</span>
          </button>
        ))}
      </div>
      <div className="tablero-comandas">
        {columnas.map((c) => {
          const lista = deHoy.filter((p) => p.estado === c.estado).sort((a, b) => a.hora - b.hora)
          return (
            <section key={c.estado} className={`columna-comandas ${vista === c.estado ? 'a-la-vista' : ''}`}>
              <div className="columna-cabeza"><h2>{estados[c.estado]}</h2><span>{lista.length}</span></div>
              {lista.length === 0 && <p className="vacio">Nada por acá.</p>}
              {lista.map((p) => <Tarjeta key={p.id} p={p} accion={c.accion} siguiente={c.siguiente} />)}
            </section>
          )
        })}
      </div>
      <section className="tarjeta">
        <div className="tarjeta-cabeza"><h2>Entregados hoy</h2></div>
        <table className="tabla tabla-entregados">
          <thead><tr><th className="num">N°</th><th>Cliente</th><th>Entrega</th><th>Pago</th><th className="num">Hora</th><th className="num">Total</th></tr></thead>
          <tbody>
            {entregados.sort((a, b) => b.hora - a.hora).slice(0, 8).map((p) => (
              <tr key={p.id}>
                <td className="num">{p.numero}</td>
                <td>{p.cliente}</td>
                <td>{p.entrega === 'delivery' ? p.barrio : 'Retiro'}</td>
                <td>{pagos[p.pago]}</td>
                <td className="num">{hora(p.hora)}</td>
                <td className="num">{pesos(total(e, p))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// ——— Carta y precios ———

export function Carta() {
  const e = useDatos()
  return (
    <div className="pantalla pantalla-angosta">
      <div className="titulo-fila">
        <div>
          <h1>Carta y precios</h1>
          <p>Lo que cambies acá se ve al instante en la carta online. {e.agotados.length} productos agotados.</p>
        </div>
      </div>
      {negocio.categorias.map((c) => (
        <section key={c}>
          <h2 className="subtitulo">{c}</h2>
          <ul className="lista carta-admin">
            {negocio.carta.filter((p) => p.categoria === c).map((p) => (
              <li key={p.id}>
                {p.foto ? <img src={`img/${p.foto}.jpg`} alt="" width={64} height={36} /> : <span className="sin-foto" />}
                <span><strong>{p.nombre}</strong><small className="tenue" style={{ display: 'block' }}>{p.desc}</small></span>
                <input
                  className="precio-input"
                  inputMode="numeric"
                  defaultValue={precio(e, p.id)}
                  onBlur={(ev) => { const n = Number(ev.target.value.replace(/\D/g, '')); if (n) cambiarPrecio(p.id, n) }}
                  aria-label={`Precio de ${p.nombre}`}
                />
                <label className="interruptor">
                  <input type="checkbox" checked={!e.agotados.includes(p.id)} onChange={() => alternarAgotado(p.id)} />
                  <span>{e.agotados.includes(p.id) ? 'Agotado' : 'Disponible'}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ——— Ventas ———

export function Ventas() {
  const e = useDatos()
  const hoy = hoyClave()
  const desde = sumarDias(hoy, -28)
  const r = useMemo(() => {
    const periodo = e.pedidos.filter((p) => p.dia >= desde && p.dia < hoy && p.estado === 'entregado')
    const porDia = Array.from({ length: 28 }, (_, i) => {
      const d = sumarDias(desde, i)
      const suyos = periodo.filter((p) => p.dia === d)
      return { etiqueta: diaMes(d), valor: suyos.reduce((s, p) => s + total(e, p), 0), detalle: `${diaMes(d)} · ${suyos.length} pedidos`, dow: new Date(d + 'T12:00').getDay() }
    })
    const facturado = porDia.reduce((s, d) => s + d.valor, 0)
    const items: Record<string, { n: number; total: number }> = {}
    for (const p of periodo) for (const l of p.lineas) {
      items[l.productoId] ??= { n: 0, total: 0 }
      items[l.productoId].n += l.cant
      items[l.productoId].total += precio(e, l.productoId) * l.cant
    }
    const top = Object.entries(items).sort((a, b) => b[1].total - a[1].total).slice(0, 6)
    const porHora = Array.from({ length: 24 }, (_, h) => periodo.filter((p) => Math.floor(p.hora / 60) % 24 === h).length)
    const web = periodo.filter((p) => p.origen === 'web')
    const ahorro = web.reduce((s, p) => s + total(e, p), 0) * 0.25
    return { periodo, porDia, facturado, top, porHora, web, ahorro }
  }, [e, desde, hoy])
  const maxTop = Math.max(...r.top.map(([, v]) => v.total))
  const horas = [11, 12, 13, 14, 15, 19, 20, 21, 22, 23, 0]
  const maxHora = Math.max(...horas.map((h) => r.porHora[h]))

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Ventas</h1>
          <p>Últimas 4 semanas, sin contar hoy</p>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Facturado</span><strong>{pesos(r.facturado)}</strong><small>{r.periodo.length} pedidos entregados</small></div>
        <div className="kpi"><span>Ticket promedio</span><strong>{pesos(Math.round(r.facturado / Math.max(1, r.periodo.length)))}</strong><small>por pedido, con envío</small></div>
        <div className="kpi"><span>Por la carta online</span><strong>{pct(r.web.length / Math.max(1, r.periodo.length))}</strong><small>{r.web.length} pedidos sin intermediarios</small></div>
        <div className="kpi"><span>Comisión que no pagaste</span><strong className="bien">{pesos(Math.round(r.ahorro))}</strong><small>si esos pedidos iban por una app al 25%</small></div>
      </div>
      <section className="tarjeta">
        <div className="tarjeta-cabeza">
          <h2>Facturación por día</h2>
          <p className="ayuda"><span className="muestra muestra-ahora muestra-ancha" /> Viernes y sábados</p>
        </div>
        <Barras datos={r.porDia} alto={220} resaltar={(i) => r.porDia[i].dow === 5 || r.porDia[i].dow === 6} />
      </section>
      <div className="grilla-2">
        <section className="tarjeta">
          <div className="tarjeta-cabeza"><h2>Lo que más se vende</h2></div>
          <ul className="ranking">
            {r.top.map(([id, v]) => (
              <li key={id}>
                <span className="ranking-nombre">{negocio.carta.find((p) => p.id === id)!.nombre}<small>{v.n} unidades</small></span>
                <span className="ranking-barra"><span style={{ width: `${(v.total / maxTop) * 100}%` }} /></span>
                <span className="ranking-valor">{pesos(v.total)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="tarjeta">
          <div className="tarjeta-cabeza"><h2>Pedidos por hora</h2><p className="ayuda">Para saber cuándo reforzar la cocina</p></div>
          <Barras
            datos={horas.map((h) => ({ etiqueta: `${h}h`, valor: r.porHora[h], detalle: `${String(h).padStart(2, '0')}:00 a ${String((h + 1) % 24).padStart(2, '0')}:00` }))}
            alto={180}
            formato={(n) => `${n} pedidos`}
            resaltar={(i) => r.porHora[horas[i]] === maxHora}
          />
        </section>
      </div>
    </div>
  )
}
