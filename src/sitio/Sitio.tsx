import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Minus, Plus, ShoppingBag } from "lucide-react";
import { negocio, type Producto } from "../config/negocio";
import { hora, pesos } from "../lib/formato";
import {
  abiertoAhora,
  cargarPedido,
  pagos,
  precio,
  subtotal,
  useDatos,
  type Linea,
  type Pago,
  type Pedido,
} from "../lib/datos";
import { Dialogo } from "../lib/ui";

const PRODUCTO = "Comanda";
const franjas = negocio.horario
  .map(([a, b]) => `${hora(a)} a ${hora(b)}`)
  .join(" y ");
const envioDesde = Math.min(...negocio.zonas.map((z) => z.envio));

type Cesta = Record<string, number>;

function Cabecera() {
  const abierto = abiertoAhora();
  return (
    <header className="cabecera">
      <a href="#inicio" className="marca">
        <span className="marca-n" aria-hidden="true">
          Ñ
        </span>
        {negocio.nombre}
      </a>
      <p className={`abre ${abierto ? "abre-si" : ""}`}>
        {abierto ? "Abierto ahora" : "Cerrado ahora"}
      </p>
    </header>
  );
}

function Portada() {
  const abierto = abiertoAhora();
  return (
    <section className="portada" id="inicio">
      <img
        src="img/lomito.jpg"
        alt="Lomito completo cortado al medio, con huevo, jamón y queso"
        width={1920}
        height={1106}
        fetchPriority="high"
      />
      <div className="portada-texto">
        <p className="portada-sello">{negocio.barrio}, {negocio.ciudad}</p>
        <h1>{negocio.nombre}</h1>
        <p className="portada-bajada">
          Lomitos, hamburguesas y pizzas como en el carrito de siempre. Pedís
          acá, sin apps en el medio, y te lo llevamos.
        </p>
        <ul className="datos-rapidos">
          <li>
            <Clock size={16} aria-hidden="true" /> Delivery{" "}
            {negocio.zonas[0].minutos} min
          </li>
          <li>
            <ShoppingBag size={16} aria-hidden="true" /> Envío desde{" "}
            {pesos(envioDesde)}
          </li>
          <li>
            <MapPin size={16} aria-hidden="true" /> {negocio.direccion}
          </li>
        </ul>
        <a className="btn btn-mostaza" href="#carta">
          Ver la carta y pedir
        </a>
        {!abierto && (
          <p className="aviso-cerrado">
            Ahora está cerrado. Podés dejar el pedido y sale apenas abre la
            cocina ({franjas}).
          </p>
        )}
      </div>
    </section>
  );
}

const destacados = [
  "lomo-completo",
  "burger-doble",
  "pizza-especial",
  "emp-docena",
];

/** Lo que más sale, con foto grande: es lo primero que se mira en una carta. */
function Destacados({
  cesta,
  sumar,
}: {
  cesta: Cesta;
  sumar: (id: string, n: number) => void;
}) {
  const e = useDatos();
  return (
    <section className="destacados" aria-labelledby="destacados-titulo">
      <h2 id="destacados-titulo">Lo más pedido</h2>
      <ul>
        {destacados.map((id, i) => {
          const p = negocio.carta.find((x) => x.id === id)!;
          const cant = cesta[id] ?? 0;
          const agotado = e.agotados.includes(id);
          return (
            <li key={id} className={`destacado ${agotado ? "agotado" : ""}`}>
              <img
                src={`img/${p.foto}.jpg`}
                alt={p.desc}
                width={480}
                height={360}
                loading="lazy"
              />
              <span className="destacado-numero" aria-hidden="true">
                {i + 1}
              </span>
              <div className="destacado-texto">
                <h3>{p.nombre}</h3>
                <p>{agotado ? "Agotado por hoy" : pesos(precio(e, id))}</p>
              </div>
              {cant > 0 ? (
                <div
                  className="contador"
                  aria-label={`${cant} ${p.nombre} en el pedido`}
                >
                  <button
                    onClick={() => sumar(id, -1)}
                    aria-label={`Quitar un ${p.nombre}`}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span aria-live="polite">{cant}</span>
                  <button
                    onClick={() => sumar(id, 1)}
                    aria-label={`Agregar otro ${p.nombre}`}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  className="agregar"
                  disabled={agotado}
                  onClick={() => sumar(id, 1)}
                  aria-label={`Agregar ${p.nombre}`}
                >
                  <Plus size={20} aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Plato({
  p,
  cant,
  sumar,
}: {
  p: Producto;
  cant: number;
  sumar: (n: number) => void;
}) {
  const e = useDatos();
  const agotado = e.agotados.includes(p.id);
  return (
    <li className={`plato ${agotado ? "agotado" : ""}`}>
      <div className="plato-texto">
        <h3>{p.nombre}</h3>
        <p className="plato-desc">{p.desc}</p>
        <p className="plato-precio">
          {agotado ? "Agotado por hoy" : pesos(precio(e, p.id))}
        </p>
      </div>
      <div className="plato-lado">
        {p.foto && (
          <img
            src={`img/${p.foto}.jpg`}
            alt=""
            width={240}
            height={240}
            loading="lazy"
          />
        )}
        {cant > 0 ? (
          <div
            className="contador"
            aria-label={`${cant} ${p.nombre} en el pedido`}
          >
            <button
              onClick={() => sumar(-1)}
              aria-label={`Quitar un ${p.nombre}`}
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <span aria-live="polite">{cant}</span>
            <button
              onClick={() => sumar(1)}
              aria-label={`Agregar otro ${p.nombre}`}
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            className="agregar"
            disabled={agotado}
            onClick={() => sumar(1)}
            aria-label={`Agregar ${p.nombre}`}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
}

function Carta({
  cesta,
  sumar,
}: {
  cesta: Cesta;
  sumar: (id: string, n: number) => void;
}) {
  return (
    <section id="carta" className="carta" aria-label="La carta">
      <nav className="categorias" aria-label="Categorías">
        {negocio.categorias.map((c) => (
          <a key={c} href={`#cat-${c.replace(/\s/g, "-")}`}>
            {c}
          </a>
        ))}
      </nav>
      {negocio.categorias.map((c) => (
        <div key={c} id={`cat-${c.replace(/\s/g, "-")}`} className="grupo">
          <h2>{c}</h2>
          <ul className="platos">
            {negocio.carta
              .filter((p) => p.categoria === c)
              .map((p) => (
                <Plato
                  key={p.id}
                  p={p}
                  cant={cesta[p.id] ?? 0}
                  sumar={(n) => sumar(p.id, n)}
                />
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** El pedido: qué lleva, cómo se entrega y cómo se paga. De acá sale el mensaje de WhatsApp. */
function Pedir({
  cesta,
  sumar,
  alEnviar,
}: {
  cesta: Cesta;
  sumar: (id: string, n: number) => void;
  alEnviar: (p: Pedido) => void;
}) {
  const e = useDatos();
  const [entrega, setEntrega] = useState<"delivery" | "retiro">("delivery");
  const [barrio, setBarrio] = useState(negocio.zonas[0].barrio);
  const [direccion, setDireccion] = useState("");
  const [nombre, setNombre] = useState("");
  const [pago, setPago] = useState<Pago>("efectivo");
  const lineas: Linea[] = Object.entries(cesta).map(([productoId, cant]) => ({
    productoId,
    cant,
  }));
  const zona = negocio.zonas.find((z) => z.barrio === barrio)!;
  const envio = entrega === "delivery" ? zona.envio : 0;
  const sub = subtotal(e, lineas);
  const mensaje = useMemo(() => {
    const filas = lineas.map(
      (l) =>
        `${l.cant} x ${negocio.carta.find((p) => p.id === l.productoId)!.nombre}`,
    );
    return [
      `Hola ${negocio.nombre}! Soy ${nombre || "…"}`,
      ...filas,
      entrega === "delivery"
        ? `Envío a ${direccion || "…"}, ${barrio}`
        : "Retiro en el local",
      `Pago: ${pagos[pago]}`,
      `Total: ${pesos(sub + envio)}`,
    ].join("\n");
  }, [lineas, nombre, entrega, direccion, barrio, pago, sub, envio]);

  if (!lineas.length)
    return (
      <p className="pedido-vacio">Tocá + en un plato para empezar el pedido.</p>
    );

  return (
    <form
      className="pedido"
      onSubmit={(ev) => {
        ev.preventDefault();
        alEnviar(
          cargarPedido({
            cliente: nombre,
            telefono: "—",
            lineas,
            entrega,
            barrio: entrega === "delivery" ? barrio : undefined,
            direccion: entrega === "delivery" ? direccion : undefined,
            envio,
            pago,
            origen: "web",
          }),
        );
      }}
    >
      <ul className="pedido-lineas">
        {lineas.map((l) => {
          const p = negocio.carta.find((x) => x.id === l.productoId)!;
          return (
            <li key={l.productoId}>
              <div className="contador contador-chico">
                <button
                  type="button"
                  onClick={() => sumar(p.id, -1)}
                  aria-label={`Quitar un ${p.nombre}`}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span>{l.cant}</span>
                <button
                  type="button"
                  onClick={() => sumar(p.id, 1)}
                  aria-label={`Agregar otro ${p.nombre}`}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
              <span className="pedido-nombre">{p.nombre}</span>
              <span className="pedido-precio">
                {pesos(precio(e, p.id) * l.cant)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="segmento" role="radiogroup" aria-label="Entrega">
        <button
          type="button"
          role="radio"
          aria-checked={entrega === "delivery"}
          className={entrega === "delivery" ? "activo" : ""}
          onClick={() => setEntrega("delivery")}
        >
          Envío a domicilio
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={entrega === "retiro"}
          className={entrega === "retiro" ? "activo" : ""}
          onClick={() => setEntrega("retiro")}
        >
          Retiro en el local
        </button>
      </div>

      <label>
        Tu nombre
        <input
          required
          name="nombre"
          autoComplete="given-name"
          value={nombre}
          onChange={(ev) => setNombre(ev.target.value)}
        />
      </label>
      {entrega === "delivery" ? (
        <>
          <label>
            Barrio
            <select
              value={barrio}
              onChange={(ev) => setBarrio(ev.target.value)}
            >
              {negocio.zonas.map((z) => (
                <option key={z.barrio} value={z.barrio}>
                  {z.barrio}, envío {pesos(z.envio)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Calle y número
            <input
              required
              name="direccion"
              autoComplete="street-address"
              value={direccion}
              onChange={(ev) => setDireccion(ev.target.value)}
              placeholder="Santa Rosa 2150…"
            />
          </label>
        </>
      ) : (
        <p className="pedido-nota">
          Lo retirás en {negocio.direccion}, {negocio.barrio}. Te avisamos
          cuando esté listo.
        </p>
      )}
      <label>
        Forma de pago
        <select
          value={pago}
          onChange={(ev) => setPago(ev.target.value as Pago)}
        >
          {Object.entries(pagos).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <dl className="pedido-total">
        <div>
          <dt>Productos</dt>
          <dd>{pesos(sub)}</dd>
        </div>
        <div>
          <dt>Envío</dt>
          <dd>{envio ? pesos(envio) : "Sin cargo"}</dd>
        </div>
        <div className="grande">
          <dt>Total</dt>
          <dd>{pesos(sub + envio)}</dd>
        </div>
      </dl>
      <details className="pedido-mensaje">
        <summary>Ver el mensaje que le llega al local</summary>
        <pre>{mensaje}</pre>
      </details>
      <button className="btn btn-primario">Enviar pedido por WhatsApp</button>
      <p className="pedido-nota">
        Es una demo: el pedido no se manda de verdad, aparece en el panel del
        local.
      </p>
    </form>
  );
}

function Enviado({ p, nuevo }: { p: Pedido; nuevo: () => void }) {
  const zona = negocio.zonas.find((z) => z.barrio === p.barrio);
  return (
    <div className="enviado" aria-live="polite">
      <p className="enviado-sello">Pedido N° {p.numero}</p>
      <h3>Ya está en la cocina</h3>
      <p>
        Te escribimos por WhatsApp cuando sale
        {p.entrega === "delivery" && zona
          ? `. Llega en ${zona.minutos} minutos`
          : " para que lo pases a buscar"}
        .
      </p>
      <Link className="btn btn-primario" to="/admin">
        Ver cómo le llega al local
      </Link>
      <button className="btn btn-secundario" onClick={nuevo}>
        Hacer otro pedido
      </button>
    </div>
  );
}

function Info() {
  return (
    <section className="info" aria-labelledby="info-titulo">
      <div className="info-ancho">
        <h2 id="info-titulo">Envíos y horarios</h2>
        <div className="info-grilla">
          <table className="zonas">
            <thead>
              <tr>
                <th>Barrio</th>
                <th>Demora</th>
                <th className="num">Envío</th>
              </tr>
            </thead>
            <tbody>
              {negocio.zonas.map((z) => (
                <tr key={z.barrio}>
                  <td>{z.barrio}</td>
                  <td>{z.minutos} min</td>
                  <td className="num">{pesos(z.envio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="info-local">
            <img
              src="img/empanadas.jpg"
              alt="Empanadas de carne al horno con papas fritas"
              width={1920}
              height={1440}
              loading="lazy"
            />
            <p>
              <strong>Todos los días</strong> de {franjas}.
            </p>
            <p>
              Retiro sin cargo en {negocio.direccion}, {negocio.barrio}. ¿Tu
              barrio no está?{" "}
              <a
                href={`https://wa.me/54${negocio.whatsapp.replace(/\D/g, "")}`}
              >
                Escribinos
              </a>{" "}
              y vemos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pie() {
  return (
    <footer className="pie">
      <div className="info-ancho">
        <p className="pie-marca">{negocio.nombre}</p>
        <p>
          {negocio.direccion}, {negocio.barrio}, {negocio.ciudad}. WhatsApp{" "}
          {negocio.whatsapp}.
        </p>
        <p>
          <a href={`https://instagram.com/${negocio.instagram}`}>Instagram</a>
          {"  "}
          <Link to="/admin">Panel del local</Link>
        </p>
        <p className="creditos">
          Fotos de Horacio Cambeiro en Wikimedia Commons (CC BY 3.0, CC BY-SA
          3.0 y 4.0):{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Lomito_Mendocino.jpg">
            lomito
          </a>
          ,{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Hamburguesa_argentina_casera.jpg">
            hamburguesa
          </a>
          ,{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Pizza_de_muzzarella_y_huevos.jpg">
            pizza
          </a>
          ,{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Empanadas_de_carne_con_papas_fritas_(Argentina).jpg">
            empanadas
          </a>
          ,{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Papas_fritas_caseras.jpg">
            papas
          </a>
          . No son fotos del local; el nombre es inventado para la demo.
        </p>
      </div>
    </footer>
  );
}

export default function Sitio() {
  const e = useDatos();
  const [cesta, setCesta] = useState<Cesta>({});
  const [abierto, setAbierto] = useState(false);
  const [enviado, setEnviado] = useState<Pedido | null>(null);
  useEffect(() => {
    document.title = `${negocio.nombre}, pedí online en ${negocio.barrio}`;
  }, []);
  const sumar = (id: string, n: number) =>
    setCesta((antes) => {
      const v = Math.max(0, (antes[id] ?? 0) + n);
      const c = { ...antes, [id]: v };
      if (!v) delete c[id];
      return c;
    });
  const cantidad = Object.values(cesta).reduce((s, n) => s + n, 0);
  const sub = subtotal(
    e,
    Object.entries(cesta).map(([productoId, cant]) => ({ productoId, cant })),
  );
  const nuevo = () => {
    setEnviado(null);
    setCesta({});
    setAbierto(false);
  };
  const contenido = enviado ? (
    <Enviado p={enviado} nuevo={nuevo} />
  ) : (
    <Pedir cesta={cesta} sumar={sumar} alEnviar={setEnviado} />
  );

  return (
    <div className="sitio">
      <div className="barra-demo">
        <p>
          Demo de {PRODUCTO} para lomiterías y pizzerías. El local es inventado
          y los pedidos son de prueba.
        </p>
        <Link to="/admin">Ver el panel del local</Link>
      </div>
      <Cabecera />
      <Portada />
      <div className="pagina">
        <main>
          <Destacados cesta={cesta} sumar={sumar} />
          <Carta cesta={cesta} sumar={sumar} />
        </main>
        <aside className="costado" aria-label="Tu pedido">
          <h2>Tu pedido</h2>
          {contenido}
        </aside>
      </div>
      <Info />
      <Pie />

      {(cantidad > 0 || enviado) && (
        <div className="barra-pedido">
          <button className="btn btn-primario" onClick={() => setAbierto(true)}>
            <span className="barra-cant">{enviado ? "✓" : cantidad}</span>
            <span>
              {enviado ? `Pedido N° ${enviado.numero} enviado` : "Ver pedido"}
            </span>
            <span>{enviado ? "" : pesos(sub)}</span>
          </button>
        </div>
      )}
      <Dialogo
        abierto={abierto}
        cerrar={() => setAbierto(false)}
        titulo="Tu pedido"
        ancho={520}
      >
        {contenido}
      </Dialogo>
    </div>
  );
}
