**Contexto del Proyecto para Refactorización de Código (LLM Prompt)**

**Objetivo del Sitio Web**
Aplicación web interactiva y ligera, optimizada para smartphones, diseñada para los participantes del Encuentro Mundial de Pa-Kua 2026 (50.º Aniversario) en San Pedro, Argentina. Su propósito es eliminar las barreras idiomáticas mediante guías rápidas de comunicación en portugués e inglés para alumnos e instructores.

---

**Arquitectura de Archivos**

* **`index.html`**: Portal de bienvenida / menú principal para selección de idioma.
* **`portugues.html`**: Guía interactiva de 31 frases esenciales en portugués de Brasil.
* **`ingles.html`**: Guía interactiva de 31 frases esenciales en inglés (`en-US`).

---

**Funcionalidades y Características Actuales**

* **Contenido de las guías (31 frases por idioma):**
1. Presentación y Saludos.
2. Disciplinas y Práctica (Arte Marcial, Cosmodinámica/Tai-Chi, Arquería, Ritmo, Pa-Kua Chi, Masajes).
3. Socialización y Contacto.
4. Hotel, Instalaciones (piscina, gimnasio, comedor, merienda) y Paseos.


* **Estructura de cada tarjeta de frase:**
* Texto en idioma destino (Portugués / Inglés).
* Transcripción fonética figurada en español.
* Traducción al español.
* Botón primario: Reproducción de voz nativa mediante JavaScript (`window.speechSynthesis` con `pt-BR` / `en-US`).
* Botón secundario: Enlace externo de respaldo a Google Traductor.


* **Navegación:** Botones táctiles de retorno al menú principal (`index.html`) al inicio y final de cada guía.
* **Pie de página e Identidad:**
* Firma del autor (*Alfredo, alumno de la Escuela Pakua Lincoln, Bs.As., Argentina*).
* Branding institucional (*Desarrollado por: VAE AI Consulting* con logo incrustado en Base64 y enlace a `[www.vae-ai-consulting.com](https://www.vae-ai-consulting.com)`).



---

**Stack Técnico**

* **Frontend:** HTML5 semántico y CSS3 Vanilla (variables CSS, Flexbox, media queries para mobile-first).
* **JavaScript:** Vanilla JS nativo sin librerías externas.
* **Assets:** Logo embebido en Base64 (`data:image/png;base64,...`) para evitar dependencias de archivos de imagen externos.
* **Despliegue:** GitHub Pages (repositorio: `frases-utiles-pakua-2026`).

---

**Puntos Objetivo para Mejora de Código**

1. **UX/UI & Accesibilidad (a11y):** Optimización de contraste, compatibilidad con lectores de pantalla y retroalimentación visual al presionar botones de audio.
2. **JavaScript / TTS Performance:** Manejo de excepciones si la voz nativa del dispositivo no está instalada o falla, control de estado (reproduciendo/pausado) y limpieza de eventos.
3. **Mantenibilidad y Modularización:** Reducción de código duplicado entre `portugues.html` e `ingles.html` (ej. estructura de datos en JSON/JS e inyección dinámica en DOM).
4. **SEO & Performance:** Meta-tags OpenGraph para previsualización al compartir el link por WhatsApp.