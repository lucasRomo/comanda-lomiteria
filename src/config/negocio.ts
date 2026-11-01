// Todos los datos del local viven acá. "Ñaupa Lomitos" es un nombre inventado para la demo.

export type Categoria = 'Lomitos' | 'Hamburguesas' | 'Pizzas' | 'Empanadas' | 'Para acompañar'
export type Producto = { id: string; nombre: string; desc: string; categoria: Categoria; precio: number; foto?: string }
export type Zona = { barrio: string; envio: number; minutos: string }

export const negocio = {
  nombre: 'Ñaupa Lomitos',
  bajada: 'Lomitería de barrio',
  barrio: 'Alberdi',
  ciudad: 'Córdoba',
  direccion: 'Santa Rosa 2150',
  whatsapp: '351 555-0187',
  instagram: 'naupalomitos',
  /** Franjas de atención, iguales todos los días */
  horario: [
    [690, 930],
    [1170, 1470],
  ] as [number, number][],

  categorias: ['Lomitos', 'Hamburguesas', 'Pizzas', 'Empanadas', 'Para acompañar'] as Categoria[],

  carta: [
    { id: 'lomo-clasico', nombre: 'Lomito clásico', desc: 'Lomo, lechuga, tomate y mayonesa casera en pan de lomo.', categoria: 'Lomitos', precio: 16500, foto: 'lomito' },
    { id: 'lomo-completo', nombre: 'Lomito completo', desc: 'Lomo, jamón, queso, huevo, lechuga y tomate. Con papas.', categoria: 'Lomitos', precio: 21000, foto: 'lomito' },
    { id: 'lomo-naupa', nombre: 'Lomito Ñaupa', desc: 'El completo con panceta, morrón asado y salsa criolla.', categoria: 'Lomitos', precio: 24500, foto: 'lomito' },
    { id: 'lomo-pizza', nombre: 'Lomopizza para 2', desc: 'Lomo completo sobre masa de pizza, cortado en ocho.', categoria: 'Lomitos', precio: 32000, foto: 'pizza' },
    { id: 'burger-simple', nombre: 'Hamburguesa simple', desc: 'Medallón de 160 g, cheddar, cebolla y pepinos.', categoria: 'Hamburguesas', precio: 12500, foto: 'hamburguesa' },
    { id: 'burger-completa', nombre: 'Hamburguesa completa', desc: 'Con jamón, queso, huevo, lechuga, tomate y morrón.', categoria: 'Hamburguesas', precio: 15500, foto: 'hamburguesa' },
    { id: 'burger-doble', nombre: 'Doble cheddar', desc: 'Dos medallones, doble cheddar y panceta. Con papas.', categoria: 'Hamburguesas', precio: 18000, foto: 'hamburguesa' },
    { id: 'pizza-muzza', nombre: 'Muzzarella', desc: 'Grande, ocho porciones, con aceitunas.', categoria: 'Pizzas', precio: 13000, foto: 'pizza' },
    { id: 'pizza-especial', nombre: 'Especial', desc: 'Muzza, jamón, morrones y huevo duro.', categoria: 'Pizzas', precio: 16000, foto: 'pizza' },
    { id: 'pizza-fugazzeta', nombre: 'Fugazzeta rellena', desc: 'Doble masa rellena de muzza, mucha cebolla arriba.', categoria: 'Pizzas', precio: 17500, foto: 'pizza' },
    { id: 'emp-carne', nombre: 'Empanada de carne', desc: 'Cortada a cuchillo, al horno. Por unidad.', categoria: 'Empanadas', precio: 1800, foto: 'empanadas' },
    { id: 'emp-docena', nombre: 'Docena surtida', desc: 'Carne, pollo, jamón y queso, humita.', categoria: 'Empanadas', precio: 19500, foto: 'empanadas' },
    { id: 'papas', nombre: 'Papas fritas', desc: 'Porción grande, cortadas a mano.', categoria: 'Para acompañar', precio: 7000, foto: 'papas' },
    { id: 'papas-chedar', nombre: 'Papas con cheddar y panceta', desc: 'Para compartir entre dos.', categoria: 'Para acompañar', precio: 10500, foto: 'papas' },
    { id: 'gaseosa', nombre: 'Gaseosa 1,5 L', desc: 'Cola, lima limón o naranja.', categoria: 'Para acompañar', precio: 4500 },
    { id: 'cerveza', nombre: 'Cerveza 1 L', desc: 'Retornable, bien fría.', categoria: 'Para acompañar', precio: 6000 },
  ] as Producto[],

  zonas: [
    { barrio: 'Alberdi', envio: 1500, minutos: '25 a 35' },
    { barrio: 'Alto Alberdi', envio: 2000, minutos: '30 a 40' },
    { barrio: 'Centro', envio: 2500, minutos: '30 a 40' },
    { barrio: 'Observatorio', envio: 2500, minutos: '30 a 45' },
    { barrio: 'Güemes', envio: 2500, minutos: '35 a 45' },
    { barrio: 'Nueva Córdoba', envio: 3000, minutos: '35 a 50' },
    { barrio: 'Villa Páez', envio: 3000, minutos: '35 a 50' },
  ] as Zona[],
}
