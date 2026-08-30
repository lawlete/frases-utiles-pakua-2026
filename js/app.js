/**
 * ============================================================================
 * PROYECTO: Encuentro Mundial Pa-Kua 2026 (50.º Aniversario) - San Pedro, Arg.
 * MÓDULO:   Motor Frontend Dinámico de Guías de Idiomas (app.js)
 * AUTOR:    Alfredo (Escuela Pakua Lincoln) & VAE AI Consulting
 * ============================================================================
 * 
 * DESCRIPCIÓN:
 * Este script actúa como el motor cliente principal para las guías interactivas
 * de conversación (Portugués, Inglés y Alemán). Incluye:
 * 
 * 1. Carga Asíncrona (AJAX/Fetch) y Soporte 100% Offline / file://.
 * 2. Buscador en Tiempo Real por palabras clave en idioma destino, fonética y español.
 * 3. Categorización Visual Interactiva por Secciones (Chips/Pestañas).
 * 4. Control de Velocidad de Audio (1.0x Normal / 0.75x Lento) para TTS y audios.
 * 5. Botón de Copiado Rápido al Portapapeles con feedback visual y Toast.
 * 6. Modo Oscuro / Modo Claro (Dark/Light Theme) con persistencia en LocalStorage.
 * 7. Registro de Service Worker para capacidades PWA e instalación en móviles.
 * 8. Renderizado de Banderas HD universales para Windows/Mac/Android/iOS.
 * ============================================================================
 */

(function () {
    'use strict';

    // Mapeo de banderas Emoji a SVG HD para compatibilidad total en Windows Desktop y navegadores
    const FLAG_SVG_MAP = {
        '🇧🇷': 'https://flagcdn.com/w40/br.png',
        '🇺🇸': 'https://flagcdn.com/w40/us.png',
        '🇩🇪': 'https://flagcdn.com/w40/de.png',
        '🇦🇷': 'https://flagcdn.com/w40/ar.png'
    };

    // Estado global de la aplicación de frases
    let currentData = null;
    let activeSectionId = 'all';
    let currentSearchQuery = '';

    // ==========================================
    // GESTIÓN DE TEMA (DARK / LIGHT MODE)
    // ==========================================
    window.initTheme = function () {
        const savedTheme = localStorage.getItem('pakua_theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        updateThemeButtonUI(isDark);
    };

    window.toggleTheme = function () {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('pakua_theme', isDark ? 'dark' : 'light');
        updateThemeButtonUI(isDark);
    };

    function updateThemeButtonUI(isDark) {
        const themeBtns = document.querySelectorAll('.btn-theme-toggle');
        themeBtns.forEach(btn => {
            btn.innerHTML = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
            btn.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        });
    }

    // ==========================================
    // CONTROL DE VELOCIDAD DE AUDIO (1x / 0.75x)
    // ==========================================
    window.getAudioSpeed = function () {
        return parseFloat(localStorage.getItem('pakua_audio_speed') || '1.0');
    };

    window.toggleAudioSpeed = function () {
        const currentSpeed = window.getAudioSpeed();
        const newSpeed = (currentSpeed === 1.0) ? 0.75 : 1.0;
        localStorage.setItem('pakua_audio_speed', newSpeed.toString());
        updateSpeedButtonUI(newSpeed);
        window.showToast(newSpeed === 0.75 ? '🐢 Velocidad lenta (0.75x) activada' : '⚡ Velocidad normal (1.0x) activada');
    };

    function updateSpeedButtonUI(speed) {
        const speedBtns = document.querySelectorAll('.btn-speed-toggle');
        speedBtns.forEach(btn => {
            btn.innerHTML = speed === 0.75 ? '🐢 0.75x (Lento)' : '⚡ 1.0x (Normal)';
            btn.setAttribute('title', 'Toca para cambiar la velocidad de pronunciación');
        });
    }

    // ==========================================
    // COPIADO RÁPIDO AL PORTAPAPELES
    // ==========================================
    window.copyPhrase = function (btnElement, targetText, translationText) {
        const cleanEs = (translationText || '').replace(/^🇦🇷\s*Español:\s*/, '').trim();
        const textToCopy = `${targetText}\n(${cleanEs})`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopyFeedback(btnElement);
            }).catch(() => {
                fallbackCopyText(textToCopy, btnElement);
            });
        } else {
            fallbackCopyText(textToCopy, btnElement);
        }
    };

    function fallbackCopyText(text, btnElement) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showCopyFeedback(btnElement);
        } catch (err) {
            console.error('Error al copiar:', err);
        }
        document.body.removeChild(textArea);
    }

    function showCopyFeedback(btnElement) {
        if (!btnElement) return;
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '✓ ¡Copiado!';
        btnElement.classList.add('copied');
        window.showToast('📋 Frase copiada al portapapeles');
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.classList.remove('copied');
        }, 2000);
    }

    // ==========================================
    // NOTIFICACIÓN TOAST FLOTANTE
    // ==========================================
    window.showToast = function (message) {
        let toast = document.getElementById('pakua-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'pakua-toast';
            toast.className = 'toast-notify';
            document.body.appendChild(toast);
        }
        toast.innerHTML = message;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    };

    // ==========================================
    // BANDERAS HD UNIVERSALES
    // ==========================================
    window.parseFlag = function (flagStr) {
        if (!flagStr) return '';
        if (FLAG_SVG_MAP[flagStr]) {
            return `<img src="${FLAG_SVG_MAP[flagStr]}" alt="${flagStr}" title="${flagStr}" style="height: 1.1em; width: auto; vertical-align: -0.15em; border-radius: 2px; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">`;
        }
        return flagStr;
    };

    // ==========================================
    // SÍNTESIS DE VOZ Y REPRODUCTOR DE AUDIO
    // ==========================================
    window.speak = function (text, lang) {
        if (!('speechSynthesis' in window)) {
            alert('Tu navegador no soporta síntesis de voz nativa.');
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'pt-BR';
        
        // Ajustar velocidad según preferencia del usuario
        const speed = window.getAudioSpeed();
        utterance.rate = (speed === 0.75) ? 0.72 : 0.90;

        window.speechSynthesis.speak(utterance);

        if (typeof PakuaStats !== 'undefined' && PakuaStats.trackAudio) {
            PakuaStats.trackAudio(text, lang);
        }
    };

    window.playAudio = function (audioUrl, text, lang) {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            const speed = window.getAudioSpeed();
            audio.playbackRate = speed;

            audio.play().then(() => {
                if (typeof PakuaStats !== 'undefined' && PakuaStats.trackAudio) {
                    PakuaStats.trackAudio(text, lang);
                }
            }).catch(() => {
                // Fallback automático a TTS si el archivo mp3 no existe o falla
                window.speak(text, lang);
            });
        } else {
            window.speak(text, lang);
        }
    };

    window.trackTranslateClick = function (phraseText) {
        if (typeof PakuaStats !== 'undefined' && PakuaStats.trackTranslate) {
            PakuaStats.trackTranslate(phraseText);
        }
    };

    // ==========================================
    // CARGA E INICIALIZACIÓN
    // ==========================================
    window.initPhrasesApp = function (jsonFile, fallbackData) {
        const container = document.getElementById('phrases-container');
        if (!container) return;

        // Inicializar tema y Service Worker
        window.initTheme();
        initServiceWorker();

        // 1. Detección de datos precargados para soporte 100% offline / protocolo local file://
        const localData = fallbackData ||
                          (jsonFile && jsonFile.includes('_de') && window.PAKUA_PHRASES_DE) ||
                          (jsonFile && jsonFile.includes('_en') && window.PAKUA_PHRASES_EN) ||
                          (jsonFile && jsonFile.includes('_pt') && window.PAKUA_PHRASES_PT) || null;

        if (localData) {
            setupAppData(localData, container);
            return;
        }

        // 2. Carga asíncrona estándar mediante Fetch para servidor HTTP/HTTPS
        fetch(jsonFile)
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar ' + jsonFile);
                return response.json();
            })
            .then(data => {
                setupAppData(data, container);
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px; font-weight: 700;">
                    ❌ Error al cargar las frases (${err.message})
                </div>`;
            });
    };

    function setupAppData(data, container) {
        currentData = data;
        renderToolbar(data, container);
        renderFilteredPhrases(container);
    }

    // ==========================================
    // RENDERIZADO DE BARRA DE HERRAMIENTAS
    // ==========================================
    function renderToolbar(data, container) {
        const parent = container.parentElement;
        if (!parent) return;

        let toolbar = document.getElementById('pakua-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'pakua-toolbar';
            toolbar.className = 'toolbar-container';
            parent.insertBefore(toolbar, container);
        }

        const currentSpeed = window.getAudioSpeed();
        const isDark = document.body.classList.contains('dark-mode');

        // Construir chips de categorías dinámicamente
        let chipsHtml = `<button class="filter-chip active" onclick="window.selectCategory('all', this)">🌐 Todas (${getTotalPhrasesCount(data)})</button>`;
        data.sections.forEach(sec => {
            const shortTitle = sec.title.replace(/^[^\s]+\s*\d+\.\s*/, '');
            const emoji = sec.title.match(/^[^\s]+/)?.[0] || '📌';
            chipsHtml += `<button class="filter-chip" onclick="window.selectCategory('${sec.id}', this)">${emoji} ${shortTitle} (${sec.phrases.length})</button>`;
        });

        toolbar.innerHTML = `
            <div class="toolbar-row">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="search-input" class="search-input" placeholder="Buscar frase, palabra o traducción..." oninput="window.handleSearchInput(this.value)" autocomplete="off">
                    <button id="search-clear" class="search-clear" onclick="window.clearSearch()">✕</button>
                </div>
                <div class="toolbar-controls">
                    <button class="btn-tool" onclick="window.installPWA()" title="Instalar en la pantalla de inicio">📲 Instalar App</button>
                    <button class="btn-tool btn-speed-toggle" onclick="window.toggleAudioSpeed()">${currentSpeed === 0.75 ? '🐢 0.75x (Lento)' : '⚡ 1.0x (Normal)'}</button>
                    <button class="btn-tool btn-theme-toggle" onclick="window.toggleTheme()">${isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</button>
                </div>
            </div>
            <div class="category-chips">
                ${chipsHtml}
            </div>
        `;
    }

    function getTotalPhrasesCount(data) {
        if (!data || !data.sections) return 0;
        return data.sections.reduce((acc, sec) => acc + (sec.phrases ? sec.phrases.length : 0), 0);
    }

    // ==========================================
    // INTERACCIÓN DE BÚSQUEDA Y FILTRADO
    // ==========================================
    window.handleSearchInput = function (query) {
        currentSearchQuery = (query || '').trim().toLowerCase();
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) {
            clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
        }
        const container = document.getElementById('phrases-container');
        if (container) {
            renderFilteredPhrases(container);
        }
    };

    window.clearSearch = function () {
        const input = document.getElementById('search-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        window.handleSearchInput('');
    };

    window.selectCategory = function (sectionId, chipElement) {
        activeSectionId = sectionId.toString();
        const chips = document.querySelectorAll('.filter-chip');
        chips.forEach(c => c.classList.remove('active'));
        if (chipElement) {
            chipElement.classList.add('active');
        }
        const container = document.getElementById('phrases-container');
        if (container) {
            renderFilteredPhrases(container);
        }
    };

    // ==========================================
    // RENDERIZADO DINÁMICO DE TARJETAS
    // ==========================================
    function renderFilteredPhrases(container) {
        if (!currentData || !currentData.sections) return;

        let html = '';
        let globalCounter = 1;
        let visibleCount = 0;
        const targetFlagHtml = window.parseFlag(currentData.flag || '');
        const esFlagHtml = window.parseFlag('🇦🇷');
        const query = currentSearchQuery;

        currentData.sections.forEach(sec => {
            // Filtrar por sección si está seleccionada
            if (activeSectionId !== 'all' && sec.id.toString() !== activeSectionId) {
                globalCounter += sec.phrases.length;
                return;
            }

            // Filtrar frases según búsqueda
            const matchingPhrases = sec.phrases.filter(p => {
                if (!query) return true;
                const targetMatch = (p.targetText || '').toLowerCase().includes(query);
                const phoneticMatch = (p.phonetic || '').toLowerCase().includes(query);
                const translationMatch = (p.translation || '').toLowerCase().includes(query);
                return targetMatch || phoneticMatch || translationMatch;
            });

            if (matchingPhrases.length > 0) {
                html += `<div class="section-title">${sec.title}</div>`;

                matchingPhrases.forEach(p => {
                    const targetTextEsc = (p.targetText || '').replace(/'/g, "\\'");
                    const ttsTextEsc = (p.tts && p.tts.text ? p.tts.text : p.targetText || '').replace(/'/g, "\\'");
                    const ttsLang = (p.tts && p.tts.lang ? p.tts.lang : currentData.language || 'pt-BR');
                    const esTextEsc = (p.ttsEs && p.ttsEs.text ? p.ttsEs.text : '').replace(/'/g, "\\'");
                    const cleanEs = (p.translation || '').replace(/^🇦🇷\s*Español:\s*/, '');
                    const cleanEsEsc = cleanEs.replace(/'/g, "\\'");

                    html += `
                    <div class="card">
                        <div class="card-top-row">
                            <div class="phrase-pt">${globalCounter}. ${p.targetText}</div>
                            <button class="btn-copy" onclick="copyPhrase(this, '${targetTextEsc}', '${cleanEsEsc}')" title="Copiar frase al portapapeles">📋 Copiar</button>
                        </div>
                        <div class="phonetic">${p.phonetic}</div>
                        <div class="phrase-es">${esFlagHtml} Español: ${cleanEs}</div>
                        <div class="btn-group">
                            <button class="btn-play" onclick="playAudio('${p.audio}', '${ttsTextEsc}', '${ttsLang}')">🔊 Audio ${targetFlagHtml}</button>
                            <button class="btn-play btn-play-es" onclick="speak('${esTextEsc}', 'es-AR')">🔊 Audio ${esFlagHtml}</button>
                            <a class="btn-web" href="${p.googleTranslateUrl}" target="_blank" onclick="trackTranslateClick('${targetTextEsc}')">🌐 Traductor</a>
                        </div>
                    </div>`;

                    globalCounter++;
                    visibleCount++;
                });
            } else {
                globalCounter += sec.phrases.length;
            }
        });

        if (visibleCount === 0) {
            html = `
            <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-dark); margin-bottom: 6px;">No se encontraron frases</div>
                <p style="font-size: 1rem;">Intenta buscar con otra palabra clave o selecciona otra categoría.</p>
                <button class="btn-tool" style="margin-top: 14px;" onclick="window.clearSearch()">Limpiar búsqueda</button>
            </div>`;
        }

        container.innerHTML = html;
    }

    // ==========================================
    // INSTALACIÓN PWA Y DIÁLOGO GUÍA
    // ==========================================
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    window.installPWA = function () {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    window.showToast('✅ ¡Aplicación instalada con éxito!');
                }
                deferredPrompt = null;
            });
        } else {
            showPwaInstructionsModal();
        }
    };

    function showPwaInstructionsModal() {
        let modal = document.getElementById('pwa-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'pwa-modal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.style.padding = '16px';
        modal.style.backdropFilter = 'blur(4px)';

        const isDark = document.body.classList.contains('dark-mode');
        const bg = isDark ? '#1e293b' : '#ffffff';
        const text = isDark ? '#f8fafc' : '#0f172a';
        const textMuted = isDark ? '#94a3b8' : '#475569';
        const cardBorder = isDark ? '#334155' : '#e2e8f0';

        modal.innerHTML = `
            <div style="background: ${bg}; color: ${text}; border-radius: 16px; max-width: 480px; width: 100%; padding: 24px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid ${cardBorder}; animation: fadeIn 0.2s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <div style="font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        📲 <span>Instalar App en tu Celular</span>
                    </div>
                    <button onclick="document.getElementById('pwa-modal').remove()" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: ${textMuted}; padding: 4px;">✕</button>
                </div>
                <p style="font-size: 0.95rem; color: ${textMuted}; margin-bottom: 16px; line-height: 1.5;">
                    Para tener la app de frases siempre a mano en tu pantalla de inicio y usarla <strong>100% offline</strong> durante el evento:
                </p>
                <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.95rem; line-height: 1.5;">
                    <div style="background: ${isDark ? '#0f172a' : '#f1f5f9'}; padding: 12px 14px; border-radius: 10px; border-left: 4px solid #2563eb;">
                        <strong>🍏 iPhone / iPad (Safari):</strong><br>
                        1. Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba ⎋ abajo en Safari).<br>
                        2. Elige <strong>"Agregar a Inicio"</strong> o <strong>"Añadir a pantalla de inicio (+)"</strong>.
                    </div>
                    <div style="background: ${isDark ? '#0f172a' : '#f1f5f9'}; padding: 12px 14px; border-radius: 10px; border-left: 4px solid #059669;">
                        <strong>🤖 Android (Chrome / Edge / Samsung):</strong><br>
                        1. Toca los <strong>tres puntos (⋮)</strong> arriba a la derecha.<br>
                        2. Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                    </div>
                    <div style="background: ${isDark ? '#0f172a' : '#f1f5f9'}; padding: 12px 14px; border-radius: 10px; border-left: 4px solid #991b1b;">
                        <strong>💻 Computadora (Chrome / Edge):</strong><br>
                        Toca el icono de instalación <strong>(🖥️ ⤓)</strong> en la barra de direcciones del navegador.
                    </div>
                </div>
                <button onclick="document.getElementById('pwa-modal').remove()" style="width: 100%; margin-top: 20px; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer;">
                    ¡Entendido!
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // ==========================================
    // REGISTRO DE PWA SERVICE WORKER
    // ==========================================
    function initServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        console.log('[PWA] Service Worker registrado con éxito:', reg.scope);
                    })
                    .catch(err => {
                        console.warn('[PWA] Error al registrar Service Worker:', err);
                    });
            });
        }
    }

})();
