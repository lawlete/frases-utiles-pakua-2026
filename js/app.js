/**
 * Pakua App Engine - Renderizador Dinámico de Frases y Reproductor de Audio
 */

(function () {
    'use strict';

    // Reproducción TTS fallback
    window.speak = function (text, lang) {
        if (!('speechSynthesis' in window)) {
            alert('Tu navegador no soporta síntesis de voz nativa.');
            return;
        }

        // Cancelar sintetizador anterior si está hablando
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang || 'pt-BR';
        utterance.rate = 0.9; // Velocidad ligeramente pausada para claridad

        window.speechSynthesis.speak(utterance);

        // Registrar métrica de audio si el módulo de estadísticas está cargado
        if (typeof PakuaStats !== 'undefined' && PakuaStats.trackAudio) {
            PakuaStats.trackAudio(text, lang);
        }
    };

    // Reproducción de archivo local con fallback a SpeechSynthesis
    window.playAudio = function (audioUrl, text, lang) {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
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

    // Rastreo de clic en Google Traductor
    window.trackTranslateClick = function (phraseText) {
        if (typeof PakuaStats !== 'undefined' && PakuaStats.trackTranslate) {
            PakuaStats.trackTranslate(phraseText);
        }
    };

    // Carga e inyección dinámica del JSON de idioma
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

    function renderPhrases(data, container) {
        let html = '';
        let globalCounter = 1;

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
                    <div class="phrase-es">${p.translation}</div>
                    <div class="btn-group">
                        <button class="btn-play" onclick="playAudio('${p.audio}', '${ttsTextEsc}', '${ttsLang}')">🔊 Audio ${data.flag}</button>
                        <button class="btn-play btn-play-es" onclick="speak('${esTextEsc}', 'es-AR')">🔊 Audio 🇦🇷</button>
                        <a class="btn-web" href="${p.googleTranslateUrl}" target="_blank" onclick="trackTranslateClick('${targetTextEsc}')">🌐 Traductor</a>
                    </div>
                </div>`;

                globalCounter++;
            });
        });

        container.innerHTML = html;
    }

})();
