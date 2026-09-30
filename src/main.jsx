import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { registrarNotificacionesSubscriber } from './patterns/notificacionesSubscriber.js'
import './styles.css'

// Se registra a nivel de módulo (fuera del árbol de React), por lo que
// StrictMode no lo duplica: main.jsx solo se ejecuta una vez por carga.
registrarNotificacionesSubscriber()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
