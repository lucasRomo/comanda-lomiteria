import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sitio from './sitio/Sitio'
import { Carta, Comandas, Layout, Ventas } from './admin/Panel'
import './sitio/sitio.css'
import './admin/admin.css'

// HashRouter: así funciona en GitHub Pages sin configurar el servidor.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Sitio />} />
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Comandas />} />
          <Route path="carta" element={<Carta />} />
          <Route path="ventas" element={<Ventas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
