# Comanda · demo para lomiterías y pizzerías

Demo visual de una carta online con pedidos sin comisión. **Ñaupa Lomitos** es un local inventado para la demo.
Es todo frontend: los pedidos de prueba se generan solos y se guardan en el navegador.

- **Web pública** (`#/`): la carta como en una app de pedidos: fotos, botón + en cada plato, categorías, y el pedido en
  una barra fija abajo que abre el formulario (envío o retiro, barrio, pago) con el mensaje de WhatsApp que saldría.
- **Panel del local** (`#/admin`): tablero de comandas (nuevos, en cocina, listos, en camino; en el celular una columna
  por vez), carta con precios y productos agotados, y ventas con lo que se ahorró en comisiones de apps.

Un pedido hecho en la web aparece en el tablero de comandas. **Reiniciar demo** vuelve todo a cero.

## Correrlo

```bash
npm install
npm run dev
```

## Publicarlo en GitHub Pages

Subir a la rama `main` de un repo y activar **Settings → Pages → Source: GitHub Actions**.

## Adaptarlo a un local real

Todo está en [`src/config/negocio.ts`](src/config/negocio.ts): nombre, dirección, horarios, carta con precios,
zonas de envío. Las fotos van en `public/img/` (hoy son fotos libres de Wikimedia Commons con crédito en el pie).
Para que el pedido salga de verdad por WhatsApp, el botón tiene que abrir `https://wa.me/<número>?text=<mensaje>`
con el mensaje que ya arma la comanda.
