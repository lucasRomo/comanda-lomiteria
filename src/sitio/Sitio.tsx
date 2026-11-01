import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { negocio, type Categoria } from '../config/negocio'
import { hora, pesos } from '../lib/formato'
import { abiertoAhora, cargarPedido, pagos, precio, subtotal, useDatos, type Linea, type Pago, type Pedido } from '../lib/datos'
import { useRevelar } from '../lib/ui'

const PRODUCTO = 'Comanda'

function Pan({ className = '' }: { className?: string }) {
  return <span className={`pan ${className}`} aria-hidden="true" />
}

function Portada() {
  const abierto = abiertoAhora()
  const franjas = negocio.horario.map(([a, b]) => `${hora(a)} a ${hora(b)}`).join(' y ')
  return (
    <header className="portada" id="inicio">
      <div className="portada-pan" aria-hidden="true">
        <img src="img/lomito.jpg" alt="" width={1600} height={922} />
      </div>
      <div className="portada-texto">
        <h1>Lomitos de barrio</h1>
        <p>
          {negocio.nombre}, en {negocio.direccion}, {negocio.barrio}. Armá tu pedido acá, te llega por WhatsApp a la cocina y lo
          llevamos a tu casa.
        </p>
        <div className="portada-acciones">
          <a className="btn btn-acento" href="#carta">Ver la carta y pedir</a>
          <p className={`estado-local ${abierto ? 'abierto' : ''}`}>
            <Pan className="pan-chico" /> {abierto ? 'Abierto ahora' : 'Cerrado ahora: podés dejar el pedido programado'} · {franjas}
          </p>
        </div>
      </div>
    </header>
  )
}

type Cesta = Record<string, number>

function Carta({ cesta, setCesta }: { cesta: Cesta; setCesta: (c: Cesta) => void }) {
  const e = useDatos()
  const ref = useRevelar<HTMLElement>()
  const [cat, setCat] = useState<Categoria>('Lomitos')
  const sumar = (id: string, n: number) => {
    const v = Math.max(0, (cesta[id] ?? 0) + n)
    const c = { ...cesta, [id]: v }
    if (!v) delete c[id]
    setCesta(c)
  }
  return (
    <section id="carta" className="carta" ref={ref}>
      <div className="carta-cabeza revela">
        <h2>La carta</h2>
        <nav className="carta-cats" aria-label="Categorías">
          {negocio.categorias.map((c) => (
            <button key={c} className={c === cat ? 'activa' : ''} onClick={() => { setCat(c); document.getElementById(`cat-${c}`)?.scrollIntoView({ block: 'start' }) }}>
              {c}
            </button>
          ))}
        </nav>
      </div>
      <div className="carta-cuerpo">
        <div className="carta-lista">
          {negocio.categorias.map((c) => {
            const items = negocio.carta.filter((p) => p.categoria === c)
            return (
              <div key={c} id={`cat-${c}`} className="carta-grupo">
                <div className="carta-grupo-cabeza">
                  <h3>{c}</h3>
                  <span>{items.length} opciones</span>
                </div>
                <ul>
                  {items.map((p) => {
                    const agotado = e.agotados.includes(p.id)
                    const n = cesta[p.id] ?? 0
                    return (
                      <li key={p.id} className={agotado ? 'agotado' : ''}>
                        {p.foto ? <img src={`img/${p.foto}.jpg`} alt="" width={96} height={56} loading="lazy" /> : <Pan className="pan-foto" />}
                        <div className="item-texto">
                          <p className="item-nombre">
                            <strong>{p.nombre}</strong>
                            <span>{pesos(precio(e, p.id))}</span>
                          </p>
                          <p className="item-desc">{p.desc}</p>
                          {agotado && <p className="item-nota">Agotado por hoy</p>}
                        </div>
                        <div className="item-cant">
                          {n > 0 && (
                            <>
                              <button onClick={() => sumar(p.id, -1)} aria-label={`Quitar un ${p.nombre}`}>−</button>
                              <span aria-live="polite">{n}</span>
                            </>
                          )}
                          <button onClick={() => sumar(p.id, 1)} disabled={agotado} aria-label={`Agregar ${p.nombre}`} className="sumar">+</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
        <Comanda cesta={cesta} setCesta={setCesta} />
      </div>
    </section>
  )
}

/** El pedido se arma como la comanda que llega a la cocina, y el mensaje de WhatsApp sale de acá. */
function Comanda({ cesta, setCesta }: { cesta: Cesta; setCesta: (c: Cesta) => void }) {
  const e = useDatos()
  const [entrega, setEntrega] = useState<'delivery' | 'retiro'>('delivery')
  const [barrio, setBarrio] = useState(negocio.zonas[0].barrio)
  const [direccion, setDireccion] = useState('')
  const [nombre, setNombre] = useState('')
  const [pago, setPago] = useState<Pago>('efectivo')
  const [enviado, setEnviado] = useState<Pedido | null>(null)
  const lineas: Linea[] = Object.entries(cesta).map(([productoId, cant]) => ({ productoId, cant }))
  const zona = negocio.zonas.find((z) => z.barrio === barrio)!
  const envio = entrega === 'delivery' ? zona.envio : 0
  const sub = subtotal(e, lineas)
  const mensaje = useMemo(() => {
    const filas = lineas.map((l) => `${l.cant} x ${negocio.carta.find((p) => p.id === l.productoId)!.nombre}`)
    return [
      `Hola ${negocio.nombre}! Soy ${nombre || '…'}`,
      ...filas,
      entrega === 'delivery' ? `Envío a ${direccion || '…'}, ${barrio}` : 'Retiro en el local',
      `Pago: ${pagos[pago]}`,
      `Total: ${pesos(sub + envio)}`,
    ].join('\n')
  }, [lineas, nombre, entrega, direccion, barrio, pago, sub, envio])

  if (enviado) {
    return (
      <aside className="comanda comanda-lista">
        <h3>Pedido N° {enviado.numero} enviado</h3>
        <p>Ya está en la cocina. Te escribimos por WhatsApp cuando salga {enviado.entrega === 'delivery' ? `(${zona.minutos} min)` : 'para que lo pases a buscar'}.</p>
        <div className="comanda-acciones">
          <Link className="btn btn-acento" to="/admin">Ver cómo le llega al local</Link>
          <button className="enlace" onClick={() => { setEnviado(null); setCesta({}) }}>Hacer otro pedido</button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="comanda" aria-label="Tu pedido">
      <h3>Tu pedido</h3>
      {lineas.length === 0 ? (
        <p className="comanda-vacia">Tocá + en la carta para sumar cosas. El pedido se arma acá.</p>
      ) : (
        <ul className="comanda-lineas">
          {lineas.map((l) => (
            <li key={l.productoId}>
              <span>{l.cant} × {negocio.carta.find((p) => p.id === l.productoId)!.nombre}</span>
              <span>{pesos(precio(e, l.productoId) * l.cant)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="comanda-opciones">
        <div className="segmento" role="radiogroup" aria-label="Entrega">
          <button role="radio" aria-checked={entrega === 'delivery'} className={entrega === 'delivery' ? 'activa' : ''} onClick={() => setEntrega('delivery')}>Envío</button>
          <button role="radio" aria-checked={entrega === 'retiro'} className={entrega === 'retiro' ? 'activa' : ''} onClick={() => setEntrega('retiro')}>Retiro</button>
        </div>
        <label><span className="oculto">Tu nombre</span><input placeholder="Tu nombre" value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></label>
        {entrega === 'delivery' && (
          <>
            <label>
              <span className="oculto">Barrio</span>
              <select value={barrio} onChange={(ev) => setBarrio(ev.target.value)}>
                {negocio.zonas.map((z) => <option key={z.barrio} value={z.barrio}>{z.barrio} · envío {pesos(z.envio)}</option>)}
              </select>
            </label>
            <label><span className="oculto">Dirección</span><input placeholder="Calle y número" value={direccion} onChange={(ev) => setDireccion(ev.target.value)} /></label>
          </>
        )}
        <label>
          <span className="oculto">Forma de pago</span>
          <select value={pago} onChange={(ev) => setPago(ev.target.value as Pago)}>
            {Object.entries(pagos).map(([k, v]) => <option key={k} value={k}>Pago con {v.toLowerCase()}</option>)}
          </select>
        </label>
      </div>
      <dl className="comanda-total">
        <div><dt>Productos</dt><dd>{pesos(sub)}</dd></div>
        <div><dt>Envío</dt><dd>{envio ? pesos(envio) : 'Sin cargo'}</dd></div>
        <div className="grande"><dt>Total</dt><dd>{pesos(sub + envio)}</dd></div>
      </dl>
      <details className="comanda-mensaje">
        <summary>Ver el mensaje que se manda</summary>
        <pre>{mensaje}</pre>
      </details>
      <button
        className="btn btn-acento btn-ancho"
        disabled={!lineas.length || !nombre || (entrega === 'delivery' && !direccion)}
        onClick={() => {
          setEnviado(cargarPedido({ cliente: nombre, telefono: '—', lineas, entrega, barrio: entrega === 'delivery' ? barrio : undefined, direccion: entrega === 'delivery' ? direccion : undefined, envio, pago, origen: 'web' }))
        }}
      >
        Enviar pedido por WhatsApp
      </button>
      <p className="comanda-aviso">Demo: el pedido no se manda de verdad, aparece en el panel del local.</p>
    </aside>
  )
}

function Estrella({ sumar }: { sumar: (id: string) => void }) {
  const ref = useRevelar<HTMLElement>()
  const opciones = negocio.carta.filter((p) => p.categoria === 'Lomitos').slice(0, 3)
  const [sel, setSel] = useState(opciones[1].id)
  const p = opciones.find((x) => x.id === sel)!
  const e = useDatos()
  return (
    <section className="estrella" ref={ref}>
      <div className="estrella-foto revela">
        <img src="img/carne.jpg" alt="Fetas de lomo vacuno crudo, listas para la plancha" width={1600} height={1246} loading="lazy" />
      </div>
      <div className="estrella-texto">
        <div className="revela">
          <h2>El lomito, cortado en el día</h2>
          <div className="estrella-tabs" role="tablist" aria-label="Lomitos">
            {opciones.map((o) => (
              <button key={o.id} role="tab" aria-selected={o.id === sel} className={o.id === sel ? 'activa' : ''} onClick={() => setSel(o.id)}>
                {o.nombre.replace('Lomito ', '')}
              </button>
            ))}
          </div>
        </div>
        <div className="revela" key={sel}>
          <p className="estrella-nombre">{p.nombre} · {pesos(precio(e, p.id))}</p>
          <p>{p.desc} El lomo se corta fino a mano cada mañana y se hace a la plancha al momento: por eso no tenemos lomito "listo".</p>
        </div>
        <div className="estrella-acciones revela">
          <button className="celda celda-acento" onClick={() => sumar(p.id)}>Sumar al pedido</button>
          <a className="celda celda-tono" href="#carta">Ver toda la carta</a>
        </div>
      </div>
    </section>
  )
}

function Camino() {
  const ref = useRevelar<HTMLElement>()
  // Muchos mensajes sueltos se ordenan en una comanda: dibujado con la forma del pan
  const panes = useMemo(() => {
    const lista: { x: number; y: number; t: number }[] = []
    let s = 7
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 42; i++) lista.push({ x: 20 + r() * 300, y: 30 + r() * 220, t: 0 })
    for (let i = 0; i < 30; i++) lista.push({ x: 370 + (i % 10) * 26, y: 118 + Math.floor(i / 10) * 16, t: 1 })
    for (let i = 0; i < 36; i++) lista.push({ x: 680 + (i % 6) * 44, y: 40 + Math.floor(i / 6) * 34, t: 2 })
    return lista
  }, [])
  return (
    <section className="camino" ref={ref}>
      <div className="camino-cabeza revela">
        <h2>Sin apps en el medio</h2>
        <p>Los pedidos de WhatsApp llegan sueltos y se pierden. Desde la carta llegan armados, con dirección y forma de pago, y la cocina los ve en orden.</p>
      </div>
      <svg className="camino-dibujo revela" viewBox="0 0 960 290" role="img" aria-label="Pedidos sueltos que se ordenan en una sola comanda">
        {panes.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.t === 1 ? 22 : 34} height={p.t === 1 ? 10 : 14} rx={7} className={`pan-svg pan-${p.t}`} style={{ ['--i' as string]: i }} />
        ))}
      </svg>
      <div className="camino-pasos">
        <div className="revela"><h3>Elegís</h3><p>Mirás la carta con precios al día y armás el pedido sin llamar.</p></div>
        <div className="revela"><h3>Mandás</h3><p>Sale un solo WhatsApp con todo: qué, dónde y cómo pagás.</p></div>
        <div className="revela"><h3>Llega</h3><p>La cocina lo ve en orden y te avisa cuando sale el delivery.</p></div>
      </div>
    </section>
  )
}

function Horno() {
  const ref = useRevelar<HTMLElement>()
  const fotos = [
    { src: 'hamburguesa', alt: 'Hamburguesa casera completa con huevo, morrón y papas', texto: 'Hamburguesas de 160 g, a la plancha' },
    { src: 'pizza', alt: 'Pizza de muzzarella con huevo, recién salida del horno', texto: 'Pizzas a la piedra, masa de un día para el otro' },
    { src: 'papas', alt: 'Papas fritas caseras cortadas en bastones gruesos', texto: 'Papas cortadas a mano todos los días' },
  ]
  return (
    <section className="horno" ref={ref} aria-labelledby="horno-titulo">
      <h2 id="horno-titulo" className="revela">De la plancha y del horno</h2>
      <div className="horno-fotos">
        {fotos.map((f) => (
          <figure key={f.src} className="revela">
            <img src={`img/${f.src}.jpg`} alt={f.alt} width={1400} height={900} loading="lazy" />
            <figcaption>{f.texto}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Zonas() {
  const ref = useRevelar<HTMLElement>()
  return (
    <section className="zonas" ref={ref}>
      <div className="zonas-foto revela">
        <img src="img/empanadas.jpg" alt="Empanadas de carne al horno con papas fritas" width={1400} height={1050} loading="lazy" />
      </div>
      <div className="zonas-texto revela">
        <h2>Hasta dónde llegamos</h2>
        <ul>
          {negocio.zonas.map((z) => (
            <li key={z.barrio}>
              <Pan className="pan-chico" />
              <span>{z.barrio}</span>
              <span className="tenue">{z.minutos} min</span>
              <strong>{pesos(z.envio)}</strong>
            </li>
          ))}
        </ul>
        <p className="tenue">¿Tu barrio no está? Escribinos y vemos. Retiro en {negocio.direccion} sin cargo.</p>
      </div>
    </section>
  )
}

function Pie() {
  return (
    <footer className="pie">
      <div className="pie-marca" aria-hidden="true">
        {negocio.nombre.split('').map((l, i) =>
          l === ' ' ? <span key={i} className="pie-espacio" /> : <span key={i} className="pie-letra" style={{ ['--h' as string]: `${[100, 82, 92, 70, 88, 0, 96, 76, 100, 86, 72, 90, 80][i] ?? 90}%` }}>{l}</span>,
        )}
      </div>
      <div className="pie-filas">
        <div>
          <a href="#carta">La carta</a>
          <a href={`https://instagram.com/${negocio.instagram}`}>Instagram</a>
          <Link to="/admin">Panel del local</Link>
        </div>
        <div>
          <p>{negocio.direccion}, {negocio.barrio}, {negocio.ciudad}</p>
          <p>WhatsApp {negocio.whatsapp}</p>
        </div>
      </div>
      <p className="creditos">
        Fotos de Horacio Cambeiro vía Wikimedia Commons (CC BY 3.0, CC BY-SA 3.0 y 4.0):{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Lomito_Mendocino.jpg">lomito</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Hamburguesa_argentina_casera.jpg">hamburguesa</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Pizza_de_muzzarella_y_huevos.jpg">pizza</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Empanadas_de_carne_con_papas_fritas_(Argentina).jpg">empanadas</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Papas_fritas_caseras.jpg">papas</a>,{' '}
        <a href="https://commons.wikimedia.org/wiki/File:Carne_cruda_vacuna_cortada_en_fetas_utilizada_en_la_preparaci%C3%B3n_de_s%C3%A1ndwiches_de_lomito_argentino.jpg">lomo</a>.
        No son fotos del local. © {new Date().getFullYear()} {negocio.nombre}, nombre inventado para la demo.
      </p>
    </footer>
  )
}

export default function Sitio() {
  const [cesta, setCesta] = useState<Cesta>({})
  useEffect(() => {
    document.title = `${negocio.nombre} · Pedí online en ${negocio.barrio}`
  }, [])
  return (
    <div className="sitio">
      <div className="barra-demo">
        <p>Demo de {PRODUCTO} para lomiterías y pizzerías. El local es inventado y los pedidos son de prueba.</p>
        <Link to="/admin">Ver el panel del local →</Link>
      </div>
      <nav className="nav">
        <a href="#inicio" className="nav-marca"><Pan className="pan-chico" /> {negocio.nombre}</a>
        <a href="#carta" className="btn btn-acento btn-chico">Pedir</a>
      </nav>
      <Portada />
      <main>
        <Carta cesta={cesta} setCesta={setCesta} />
        <Estrella sumar={(id) => { setCesta({ ...cesta, [id]: (cesta[id] ?? 0) + 1 }); document.getElementById('carta')?.scrollIntoView() }} />
        <Horno />
        <Camino />
        <Zonas />
      </main>
      <Pie />
    </div>
  )
}
