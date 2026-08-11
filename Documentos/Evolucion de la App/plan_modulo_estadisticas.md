# Plan de Implementación - Módulo de Estadísticas Silenciosas de Uso (Aprobado - Estrategia Híbrida con JSONBin.io)

Este documento contiene el plan técnico definitivo para integrar el **Módulo de Estadísticas Silenciosas de Uso** en la aplicación web del Encuentro Mundial Pa-Kua 2026.

---

## 🚀 Arquitectura Seleccionada: Estrategia Híbrida (JSONBin.io + LocalStorage)

1. **Almacenamiento Local (LocalStorage)**:
   - Registra de inmediato cada visita, tiempo de uso, idioma y reproducción de audio en el navegador local (`pakua_stats`).
   - Garantiza que la aplicación funcione 100% fluida incluso si la conexión a Internet en el evento es inestable.

2. **Sincronización Remota (JSONBin.io API REST)**:
   - Envía peticiones en segundo plano (`PUT` / `GET`) para consolidar las métricas de **todos** los participantes del mundo en un único JSON centralizado en tiempo real.

3. **Panel de Administración (`superadmin1234`)**:
   - Acceso seguro mediante botón en pie de página con clave `superadmin1234`.
   - Consulta el JSONBin remoto consolidado para mostrar métricas globales en tiempo real con gráficos y tablas.
   - Permite descargar/exportar `stats.json` o importar copias de respaldo.

---

## 📈 Resumen de Indicadores a Medir

| Categoría | Indicador | Descripción |
| :--- | :--- | :--- |
| **Audiencia y Origen** | 🌐 **País e IP** | Detección anónima de ubicación por IP con banderas. |
| | 🗣️ **Idioma Navegador** | Detecta el idioma del teléfono (`pt-BR`, `en-US`, `de-DE`, `es-AR`). |
| | 📱 **Dispositivo** | Móvil vs. Escritorio (iOS vs. Android). |
| **Navegación** | 🇧🇷 🇺🇸 🇩🇪 **Módulos Usados** | Conteo e ingresos a Portugués, Inglés y Alemán. |
| | ⏱️ **Tiempo Activo** | Duración de navegación activa en cada guía. |
| | 🔄 **Frecuencia** | Visitas únicas vs. usuarios recurrentes. |
| **Interacciones** | 🏆 **Top 5 Frases** | Las 5 frases más reproducidas por los participantes. |
| | 📚 **Categorías** | Interés por Saludos, Disciplinas, Socialización u Hotel. |
| | 🔊 vs 🌐 **Audio vs Traductor** | Voz nativa vs respaldo de Google Translate. |
| **Actividad Evento** | ⏰ **Horas Pico** | Franjas horarias de mayor necesidad de traducción. |

---

## 🛠️ Archivos a Crear y Modificar

#### 1. [NEW] [stats.js](file:///c:/Users/Alfredo/Desktop/Alfredo/Pakua/stats.js)
- Rastreos asíncronos y conexión con la API de JSONBin.io (`v3/b/<BIN_ID>`).
- Renderizado del Dashboard de Administración con librerías de gráficos.

#### 2. [MODIFY] [index.html](file:///c:/Users/Alfredo/Desktop/Alfredo/Pakua/index.html)
- Conexión de `stats.js`, botón discreto `📊 Estadísticas` en el footer y modal de login/dashboard admin.

#### 3. [MODIFY] [portugues.html](file:///c:/Users/Alfredo/Desktop/Alfredo/Pakua/portugues.html)
- Integración de rastreo de entrada, tiempo y clics de audio/traductor.

#### 4. [MODIFY] [ingles.html](file:///c:/Users/Alfredo/Desktop/Alfredo/Pakua/ingles.html)
- Integración de rastreo de entrada, tiempo y clics de audio/traductor.

#### 5. [MODIFY] [aleman.html](file:///c:/Users/Alfredo/Desktop/Alfredo/Pakua/aleman.html)
- Integración de rastreo de entrada, tiempo y clics de audio/traductor.

---

## 🧪 Plan de Verificación

1. **Prueba de Rastreo e Inserción**: Probar navegación en las 3 guías y reproducir audios. Confirmar actualización del Bin en JSONBin.io.
2. **Prueba Admin**: Probar clave `superadmin1234`, denegación por clave incorrecta y renderizado de gráficos y tablas.
3. **Prueba de Exportación**: Descargar `stats.json` desde el panel de control.
