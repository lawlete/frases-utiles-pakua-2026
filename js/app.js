/**
 * ============================================================================
 * PROYECTO: Encuentro Mundial Pa-Kua 2026 (50.º Aniversario) - San Pedro, Arg.
 * MÓDULO:   Motor Frontend Dinámico de Guías de Idiomas (app.js)
 * AUTOR:    Alfredo (Escuela Pakua Lincoln) & VAE AI Consulting
 * ============================================================================
 * 
 * DESCRIPCIÓN:
 * Este script actúa como el motor cliente principal para las guías interactivas
 * de conversación (Portugués, Inglés y Alemán). Se encarga de:
 * 
 * 1. Carga Asíncrona (AJAX/Fetch):
 *    Consume los archivos JSON estáticos desde /data/ (phrases_pt.json, etc.)
 *    garantizando un funcionamiento 100% offline y de ultra-baja latencia.
 * 
 * 2. Renderizado Dinámico de Tarjetas:
 *    Inyecta dinámicamente las tarjetas de frases, fonética figurada, traducciones
 *    y renumeración automática de ítems en el contenedor #phrases-container.
 * 
 * 3. Renderizado de Banderas HD (Compatibilidad Universal Windows/Desktop):
 *    Convierte banderas emoji (🇧🇷, 🇺🇸, 🇩🇪, 🇦🇷) en imágenes SVG HD para que
 *    se vean perfectamente en Windows Desktop donde el sistema no las soporta nativamente.
 * 
 * 4. Reproducción Inteligente de Audios con Fallback:
 *    Intenta reproducir primero el archivo de audio local MP3 (/assets/audio/{lang}/).
 *    Si el archivo no existe o falla la carga, conmuta automáticamente a la voz
 *    nativa del dispositivo mediante SpeechSynthesis (Web Speech API).
 * 
 * 5. Integración de Métricas:
 *    Registra las interacciones de reproducción y uso de Google Traductor
 *    en el módulo PakuaStats.
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

    // Convierte emojis de bandera en imágenes HD universales para Windows/Mac/Linux/Android/iOS
    window.parseFlag = function (flagStr) {
        if (!flagStr) return '';
        if (FLAG_SVG_MAP[flagStr]) {
            return `<img src="${FLAG_SVG_MAP[flagStr]}" alt="${flagStr}" title="${flagStr}" style="height: 1.1em; width: auto; vertical-align: -0.15em; border-radius: 2px; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">`;
        }
        return flagStr;
    };

    // Reproducción TTS fallback mediante Web Speech API
    window.speak = function (text, lang) {
        if (!('speechSynthesis' in window)) {
            alert('Tu navegador no soporta síntesis de voz nativa.');
            return;
        }

        // Cancelar sintetizador anterior si está reproduciendo
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'pt-BR';
        utterance.rate = 0.9; // Velocidad pausada para mayor claridad

        window.speechSynthesis.speak(utterance);

        // Registrar métrica de audio si el módulo de estadísticas está activo
        if (typeof PakuaStats !== 'undefined' && PakuaStats.trackAudio) {
            PakuaStats.trackAudio(text, lang);
        }
    };

    // Reproducción de archivo MP3 local con fallback automático a SpeechSynthesis
    window.playAudio = function (audioUrl, text, lang) {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().then(() => {
                if (typeof PakuaStats !== 'undefined' && PakuaStats.trackAudio) {
                    PakuaStats.trackAudio(text, lang);
                }
            }).catch(() => {
                // Fallback automático a TTS si el archivo mp3 aún no fue grabado o falla
                window.speak(text, lang);
            });
        } else {
            window.speak(text, lang);
        }
    };

    // Rastreo de clic en enlace de Google Traductor
    window.trackTranslateClick = function (phraseText) {
        if (typeof PakuaStats !== 'undefined' && PakuaStats.trackTranslate) {
            PakuaStats.trackTranslate(phraseText);
        }
    };

    // Inicialización y carga dinámica del archivo JSON del idioma
    window.initPhrasesApp = function (jsonFile) {
        const container = document.getElementById('phrases-container');
        if (!container) return;

        fetch(jsonFile)
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar ' + jsonFile);
                return response.json();
            })
            .then(data => {
                renderPhrases(data, container);
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px; font-weight: 700;">
                    ❌ Error al cargar las frases (${err.message})
                </div>`;
            });
    };

    // Generador dinámico del DOM de tarjetas de frases
    function renderPhrases(data, container) {
        let html = '';
        let globalCounter = 1;
        const targetFlagHtml = window.parseFlag(data.flag || '');
        const esFlagHtml = window.parseFlag('🇦🇷');

        data.sections.forEach(sec => {
            html += `<div class="section-title">${sec.title}</div>`;

            sec.phrases.forEach(p => {
                const targetTextEsc = (p.targetText || '').replace(/'/g, "\\'");
                const ttsTextEsc = (p.tts && p.tts.text ? p.tts.text : p.targetText || '').replace(/'/g, "\\'");
                const ttsLang = (p.tts && p.tts.lang ? p.tts.lang : data.language || 'pt-BR');
                
                const esTextEsc = (p.ttsEs && p.ttsEs.text ? p.ttsEs.text : '').replace(/'/g, "\\'");

                html += `
                <div class="card">
                    <div class="phrase-pt">${globalCounter}. ${p.targetText}</div>
                    <div class="phonetic">${p.phonetic}</div>
                    <div class="phrase-es">${esFlagHtml} Español: ${p.translation.replace(/^🇦🇷\s*Español:\s*/, '')}</div>
                    <div class="btn-group">
                        <button class="btn-play" onclick="playAudio('${p.audio}', '${ttsTextEsc}', '${ttsLang}')">🔊 Audio ${targetFlagHtml}</button>
                        <button class="btn-play btn-play-es" onclick="speak('${esTextEsc}', 'es-AR')">🔊 Audio ${esFlagHtml}</button>
                        <a class="btn-web" href="${p.googleTranslateUrl}" target="_blank" onclick="trackTranslateClick('${targetTextEsc}')">🌐 Traductor</a>
                    </div>
                </div>`;

                globalCounter++;
            });
        });

        container.innerHTML = html;
    }

})();
