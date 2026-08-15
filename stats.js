/**
 * Pakua 2026 - Módulo de Estadísticas Silenciosas de Uso
 * Sistema híbrido: LocalStorage + JSONBin.io (Tiempo Real)
 */

const PakuaStats = (function () {
    const CONFIG = {
        binId: '6a7c90c5da38895dfedb3b89',
        masterKeyEnc: 'JDJhJDEwJEdmRkNJbU5BYjdNUEYvbGtPcG9ZdHVtVThZdEc5MnFzMDVPS2VjOVpHSWFIQVdmNVk5dFAu',
        adminPassHash: '3fcea91fecaf485b0b02fc76e00d4c100c275a805ba35421f1adffd1733d4d8e',
        endpoint: 'https://api.jsonbin.io/v3/b/6a7c90c5da38895dfedb3b89',
        storageKey: 'pakua_stats_v1',
        sessionKey: 'pakua_session_active'
    };

    function getMasterKey() {
        try {
            return atob(CONFIG.masterKeyEnc);
        } catch (e) {
            return '';
        }
    }

    async function hashText(text) {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let sessionStartTime = Date.now();
    let currentModule = 'index.html';
    let geoData = { ip: 'Desconocido', country: 'Desconocido', countryCode: 'XX', flag: '🌐' };

    // Estructura por defecto
    function getInitialStats() {
        return {
            summary: {
                totalVisits: 0,
                uniqueVisitors: 0,
                totalActiveTimeSeconds: 0,
                languages: { portugues: 0, ingles: 0, aleman: 0 },
                topPhrases: {},
                countries: {},
                devices: { Android: 0, iOS: 0, Desktop: 0, Otro: 0 },
                interactionTypes: { audioNative: 0, audioSpanish: 0, googleTranslate: 0 },
                hourlyActivity: Array(24).fill(0)
            },
            logs: []
        };
    }

    // Cargar estadísticas locales
    function getLocalStats() {
        try {
            const raw = localStorage.getItem(CONFIG.storageKey);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('[PakuaStats] Error al leer LocalStorage', e);
        }
        return getInitialStats();
    }

    // Guardar estadísticas locales
    function saveLocalStats(stats) {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(stats));
        } catch (e) {
            console.warn('[PakuaStats] Error al guardar en LocalStorage', e);
        }
    }

    // Obtener IP y País silenciosamente
    async function fetchGeoLocation() {
        try {
            const res = await fetch('https://api.country.is', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                geoData.ip = data.ip || 'Anónima';
                geoData.countryCode = data.country || 'XX';
                geoData.country = getCountryName(data.country);
                geoData.flag = getCountryFlag(data.country);
                return;
            }
        } catch (e) { }

        // Respaldo secundario si api.country.is falla
        try {
            const res2 = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
            if (res2.ok) {
                const data2 = await res2.json();
                geoData.ip = data2.ip || 'Anónima';
                geoData.countryCode = data2.country_code || 'XX';
                geoData.country = data2.country_name || getCountryName(data2.country_code);
                geoData.flag = getCountryFlag(data2.country_code);
            }
        } catch (e) { }
    }

    // Mapeo de Nombres de Países en Español
    function getCountryName(code) {
        const names = {
            AR: 'Argentina', BR: 'Brasil', US: 'Estados Unidos', DE: 'Alemania',
            UY: 'Uruguay', CL: 'Chile', PY: 'Paraguay', CO: 'Colombia', MX: 'México',
            ES: 'España', IT: 'Italia', FR: 'Francia', PT: 'Portugal', CA: 'Canadá',
            AT: 'Austria', CH: 'Suiza', BE: 'Bélgica', NL: 'Países Bajos', GB: 'Reino Unido'
        };
        return names[code] || code || 'Desconocido';
    }

    // Mapeo de Banderas Emojis por Código ISO
    function getCountryFlag(code) {
        if (!code || code.length !== 2) return '🌐';
        const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    }

    // Detección de Dispositivo
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'Android';
        if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
        if (/windows|macintosh|linux/i.test(ua)) return 'Desktop';
        return 'Otro';
    }

    // Conexión con JSONBin.io (Sincronización remota)
    async function fetchRemoteStats() {
        try {
            const res = await fetch(CONFIG.endpoint, {
                headers: { 'X-Master-Key': getMasterKey() }
            });
            if (res.ok) {
                const json = await res.json();
                return json.record || getInitialStats();
            }
        } catch (e) {
            console.warn('[PakuaStats] No se pudo obtener stats remotas', e);
        }
        return getLocalStats();
    }

    async function pushRemoteStats(stats) {
        try {
            await fetch(CONFIG.endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': getMasterKey()
                },
                body: JSON.stringify(stats)
            });
        } catch (e) {
            console.warn('[PakuaStats] Error al actualizar JSONBin', e);
        }
    }

    // Registro Silencioso Inicial de Sesión
    async function initSession(moduleName) {
        currentModule = moduleName || 'index.html';
        await fetchGeoLocation();

        const isNewVisitor = !sessionStorage.getItem(CONFIG.sessionKey);
        sessionStorage.setItem(CONFIG.sessionKey, 'true');

        const localStats = getLocalStats();
        const currentHour = new Date().getHours();
        const devType = getDeviceType();

        localStats.summary.totalVisits += 1;
        if (isNewVisitor) {
            localStats.summary.uniqueVisitors += 1;
        }

        if (moduleName && moduleName !== 'index.html') {
            const langKey = moduleName.replace('.html', '');
            if (localStats.summary.languages[langKey] !== undefined) {
                localStats.summary.languages[langKey] += 1;
            }
        }

        const countryLabel = `${geoData.flag} ${geoData.country}`;
        localStats.summary.countries[countryLabel] = (localStats.summary.countries[countryLabel] || 0) + 1;
        localStats.summary.devices[devType] = (localStats.summary.devices[devType] || 0) + 1;
        localStats.summary.hourlyActivity[currentHour] = (localStats.summary.hourlyActivity[currentHour] || 0) + 1;

        // Registrar log individual
        const newLog = {
            id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            timestamp: new Date().toISOString(),
            ip: geoData.ip,
            country: geoData.country,
            countryCode: geoData.countryCode,
            flag: geoData.flag,
            browserLang: navigator.language || 'desconocido',
            device: devType,
            module: currentModule,
            durationSeconds: 0,
            audioClicks: 0
        };

        localStats.logs.unshift(newLog);
        if (localStats.logs.length > 200) localStats.logs.pop(); // Limite de 200 logs

        saveLocalStats(localStats);

        // Sincronizar en segundo plano con JSONBin
        setTimeout(async () => {
            const remote = await fetchRemoteStats();
            const merged = mergeStats(remote, localStats);
            saveLocalStats(merged);
            await pushRemoteStats(merged);
        }, 1500);

        // Tracker de tiempo
        window.addEventListener('beforeunload', () => {
            const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
            updateDuration(elapsed);
        });
    }

    function updateDuration(seconds) {
        if (seconds <= 0) return;
        const stats = getLocalStats();
        stats.summary.totalActiveTimeSeconds += seconds;
        if (stats.logs.length > 0) {
            stats.logs[0].durationSeconds += seconds;
        }
        saveLocalStats(stats);
        pushRemoteStats(stats);
    }

    // Combinar datos locales con remotos sin duplicar de forma inteligente
    function mergeStats(remote, local) {
        if (!remote || !remote.summary) return local;

        const merged = getInitialStats();
        merged.summary.totalVisits = Math.max(remote.summary.totalVisits || 0, local.summary.totalVisits || 0);
        merged.summary.uniqueVisitors = Math.max(remote.summary.uniqueVisitors || 0, local.summary.uniqueVisitors || 0);
        merged.summary.totalActiveTimeSeconds = Math.max(remote.summary.totalActiveTimeSeconds || 0, local.summary.totalActiveTimeSeconds || 0);

        // Unir objetos contadores
        ['languages', 'countries', 'devices', 'interactionTypes', 'topPhrases'].forEach(key => {
            const objR = remote.summary[key] || {};
            const objL = local.summary[key] || {};
            const keys = new Set([...Object.keys(objR), ...Object.keys(objL)]);
            merged.summary[key] = {};
            keys.forEach(k => {
                merged.summary[key][k] = Math.max(objR[k] || 0, objL[k] || 0);
            });
        });

        // Unir actividad horaria
        for (let i = 0; i < 24; i++) {
            merged.summary.hourlyActivity[i] = Math.max(
                (remote.summary.hourlyActivity && remote.summary.hourlyActivity[i]) || 0,
                (local.summary.hourlyActivity && local.summary.hourlyActivity[i]) || 0
            );
        }

        // Unir logs por ID único
        const logMap = new Map();
        (remote.logs || []).forEach(l => logMap.set(l.id, l));
        (local.logs || []).forEach(l => logMap.set(l.id, l));

        merged.logs = Array.from(logMap.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 200);

        return merged;
    }

    // Registrar reproducción de audio
    function trackAudio(text, lang) {
        const stats = getLocalStats();
        const isSpanish = lang === 'es-AR';
        const typeKey = isSpanish ? 'audioSpanish' : 'audioNative';

        stats.summary.interactionTypes[typeKey] = (stats.summary.interactionTypes[typeKey] || 0) + 1;

        if (text) {
            const phraseKey = `[${lang.split('-')[0].toUpperCase()}] ${text}`;
            stats.summary.topPhrases[phraseKey] = (stats.summary.topPhrases[phraseKey] || 0) + 1;
        }

        if (stats.logs.length > 0) {
            stats.logs[0].audioClicks = (stats.logs[0].audioClicks || 0) + 1;
        }

        saveLocalStats(stats);
        pushRemoteStats(stats);
    }

    // Registrar clic en traductor web
    function trackTranslate(href) {
        const stats = getLocalStats();
        stats.summary.interactionTypes.googleTranslate = (stats.summary.interactionTypes.googleTranslate || 0) + 1;
        saveLocalStats(stats);
        pushRemoteStats(stats);
    }

    // -------------------------------------------------------------
    // INTERFAZ DE ADMINISTRACIÓN Y DASHBOARD
    // -------------------------------------------------------------

    function openAdminPrompt() {
        let modal = document.getElementById('pakua-admin-auth-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'pakua-admin-auth-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px);
            z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
        `;

        modal.innerHTML = `
            <div style="background: #ffffff; border-radius: 16px; max-width: 400px; width: 100%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-size: 3rem; margin-bottom: 8px;">🔐</div>
                <h3 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Panel de Estadísticas Pa-Kua</h3>
                <p style="font-size: 0.92rem; color: #64748b; margin-bottom: 20px;">Ingresa la contraseña de superadministrador para acceder.</p>
                <input type="password" id="pakua-pass-input" placeholder="Contraseña..." style="width: 100%; padding: 12px 16px; font-size: 1rem; border-radius: 10px; border: 2px solid #cbd5e1; outline: none; margin-bottom: 16px; text-align: center;">
                <div id="pakua-auth-error" style="color: #ef4444; font-size: 0.85rem; display: none; margin-bottom: 12px; font-weight: 600;">⚠️ Contraseña incorrecta. Reintenta.</div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="document.getElementById('pakua-admin-auth-modal').remove()" style="flex: 1; padding: 12px; border-radius: 10px; background: #f1f5f9; color: #475569; font-weight: 600; border: none; cursor: pointer;">Cancelar</button>
                    <button id="pakua-btn-submit-pass" style="flex: 1; padding: 12px; border-radius: 10px; background: #1e3a8a; color: white; font-weight: 700; border: none; cursor: pointer;">Ingresar ➔</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const passInput = document.getElementById('pakua-pass-input');
        const btnSubmit = document.getElementById('pakua-btn-submit-pass');
        const authError = document.getElementById('pakua-auth-error');

        passInput.focus();

        const verify = async () => {
            const enteredHash = await hashText(passInput.value || '');
            if (enteredHash === CONFIG.adminPassHash) {
                modal.remove();
                showDashboardModal();
            } else {
                authError.style.display = 'block';
                passInput.value = '';
                passInput.focus();
            }
        };

        btnSubmit.addEventListener('click', verify);
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') verify();
        });
    }

    // Cargar Chart.js dinámicamente si no está presente
    function loadChartJs(callback) {
        if (window.Chart) {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    async function showDashboardModal() {
        let modal = document.getElementById('pakua-dashboard-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'pakua-dashboard-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
            z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
        `;

        modal.innerHTML = `
            <div style="background: #f8fafc; border-radius: 20px; max-width: 1050px; width: 100%; height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                
                <!-- HEADER DASHBOARD -->
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%); color: white; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div>
                        <h2 style="font-size: 1.4rem; font-weight: 700; margin: 0;">📊 Panel de Estadísticas Pa-Kua 2026</h2>
                        <p style="font-size: 0.85rem; opacity: 0.9; margin: 2px 0 0 0;">Métricas silenciosas de uso global en tiempo real</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button id="pakua-btn-refresh" title="Actualizar datos" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">🔄 Actualizar</button>
                        <button id="pakua-btn-export" title="Exportar JSON" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">📥 Exportar JSON</button>
                        <button onclick="document.getElementById('pakua-dashboard-modal').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; cursor: pointer;">✕</button>
                    </div>
                </div>

                <!-- BODY SCROLLABLE -->
                <div id="pakua-dash-body" style="padding: 24px; overflow-y: auto; flex-grow: 1;">
                    <div style="text-align: center; padding: 40px; font-size: 1.2rem; color: #475569;">
                        ⏳ Cargando métricas consolidadas desde la nube...
                    </div>
                </div>

                <!-- FOOTER DASHBOARD -->
                <div style="padding: 14px 24px; background: #e2e8f0; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; flex-shrink: 0; font-size: 0.85rem; color: #475569;">
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <button id="pakua-btn-scroll-top" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s;" title="Volver a la parte superior de esta pantalla">⬆️ Volver al inicio de esta pantalla</button>
                        <button id="pakua-btn-main-menu" style="background: #0f766e; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s;" title="Ir al Menú Principal (index.html)">🏠 Menú Principal</button>
                    </div>
                    <button id="pakua-btn-reset" style="background: #dc2626; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.82rem; transition: opacity 0.2s;">🗑️ Reiniciar estadísticas a cero</button>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('pakua-btn-refresh').onclick = renderDashboardContent;
        document.getElementById('pakua-btn-export').onclick = exportJson;
        document.getElementById('pakua-btn-reset').onclick = resetStats;
        document.getElementById('pakua-btn-scroll-top').onclick = () => {
            const body = document.getElementById('pakua-dash-body');
            if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
        };
        document.getElementById('pakua-btn-main-menu').onclick = () => {
            window.location.href = 'index.html';
        };

        await renderDashboardContent();
    }

    async function renderDashboardContent() {
        const body = document.getElementById('pakua-dash-body');
        if (!body) return;

        body.innerHTML = `<div style="text-align: center; padding: 40px; font-size: 1.1rem; color: #475569;">⏳ Sincronizando datos remotos...</div>`;

        const remote = await fetchRemoteStats();
        const local = getLocalStats();
        const stats = mergeStats(remote, local);
        saveLocalStats(stats);

        const sum = stats.summary;
        const totalMinutes = Math.round((sum.totalActiveTimeSeconds || 0) / 60);

        // Encontrar frase más escuchada
        let topPhraseText = 'Ninguna aún';
        let topPhraseCount = 0;
        Object.entries(sum.topPhrases || {}).forEach(([phrase, count]) => {
            if (count > topPhraseCount) {
                topPhraseCount = count;
                topPhraseText = phrase;
            }
        });

        let topPhraseSubtext = '';
        if (topPhraseText !== 'Ninguna aún') {
            const isSpanish = topPhraseText.startsWith('[ES]');
            const rawText = topPhraseText.replace(/^\[(DE|EN|PT|ES)\]\s*/, '').trim();
            const translation = !isSpanish ? SPANISH_TRANSLATIONS[rawText] : null;
            if (translation) {
                topPhraseSubtext = `<div style="font-size: 0.78rem; color: #059669; font-weight: 600; margin-top: 2px;">(🇦🇷 ${translation})</div>`;
            }
        }

        // Encontrar país principal
        let topCountryText = 'Desconocido';
        let topCountryCount = 0;
        Object.entries(sum.countries || {}).forEach(([country, count]) => {
            if (count > topCountryCount) {
                topCountryCount = count;
                topCountryText = country;
            }
        });

        body.innerHTML = `
            <!-- TARJETAS KPIS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div style="background: white; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Visitas Totales</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #1e3a8a; margin-top: 4px;">${sum.totalVisits}</div>
                    <div style="font-size: 0.78rem; color: #10b981; margin-top: 2px;">👥 Únicos: ${sum.uniqueVisitors}</div>
                </div>

                <div style="background: white; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Tiempo de Permanencia</div>
                    <div style="font-size: 1.8rem; font-weight: 800; color: #0f766e; margin-top: 4px;">${totalMinutes} <span style="font-size: 1rem;">min</span></div>
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">⏱️ Duración activa</div>
                </div>

                <div style="background: white; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; text-transform: uppercase;">País Principal</div>
                    <div style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${topCountryText}</div>
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">📍 ${topCountryCount} ingresos</div>
                </div>

                <div style="background: white; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.82rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Frase Más Escuchada</div>
                    <div style="font-size: 0.95rem; font-weight: 700; color: #991b1b; margin-top: 6px; line-height: 1.2;" title="${topPhraseText}">${topPhraseText}</div>
                    ${topPhraseSubtext}
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">🔊 ${topPhraseCount} reproducciones</div>
                </div>
            </div>

            <!-- SECCIÓN DE GRÁFICOS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;">
                
                <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">🌐 Países de Origen (por IP)</h4>
                    <div style="position: relative; height: 220px;">
                        <canvas id="chart-countries"></canvas>
                    </div>
                </div>

                <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">🇧🇷 🇺🇸 🇩🇪 Uso por Módulo de Idioma</h4>
                    <div style="position: relative; height: 220px;">
                        <canvas id="chart-languages"></canvas>
                    </div>
                </div>

                <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">⏰ Franjas Horarias (Horas Pico del Evento)</h4>
                    <div style="position: relative; height: 220px;">
                        <canvas id="chart-hours"></canvas>
                    </div>
                </div>

                <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">🔊 Tipo de Interacción (Audio vs Traductor)</h4>
                    <div style="position: relative; height: 220px;">
                        <canvas id="chart-interactions"></canvas>
                    </div>
                </div>

                <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">📱 Tipo de Dispositivo (Android / iOS / PC)</h4>
                    <div style="position: relative; height: 220px;">
                        <canvas id="chart-devices"></canvas>
                    </div>
                </div>

            </div>

            <!-- RANKING TOP 10 FRASES -->
            <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04); margin-bottom: 24px;">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">🏆 Top 10 Frases Más Consultadas por los Alumnos</h4>
                <div id="top-phrases-list">
                    ${renderTopPhrasesList(sum.topPhrases)}
                </div>
            </div>

            <!-- TABLA DE HISTORIAL DE ACCESOS -->
            <div style="background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.04); margin-bottom: 24px;">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px;">📋 Historial Reciente de Sesiones (${stats.logs.length})</h4>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                        <thead>
                            <tr style="background: #f1f5f9; color: #475569; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px;">Fecha / Hora</th>
                                <th style="padding: 10px;">País / IP</th>
                                <th style="padding: 10px;">Dispositivo</th>
                                <th style="padding: 10px;">Módulo</th>
                                <th style="padding: 10px;">Permanencia</th>
                                <th style="padding: 10px;">Audios</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.logs.map(log => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px; color: #334155;">${formatDate(log.timestamp)}</td>
                                    <td style="padding: 10px; font-weight: 600; color: #0f172a;">${log.flag || '🌐'} ${log.country} <span style="font-size: 0.75rem; color: #94a3b8; font-weight: normal;">(${log.ip})</span></td>
                                    <td style="padding: 10px; color: #475569;">${log.device}</td>
                                    <td style="padding: 10px;"><span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-weight: 600;">${log.module}</span></td>
                                    <td style="padding: 10px; color: #475569;">${log.durationSeconds}s</td>
                                    <td style="padding: 10px; font-weight: 700; color: #0f766e;">🔊 ${log.audioClicks || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- BOTONES DE NAVEGACIÓN EN EL CUERPO INFERIOR -->
            <div style="display: flex; justify-content: center; gap: 14px; padding: 18px 0 10px 0; border-top: 1px solid #cbd5e1; flex-wrap: wrap;">
                <button onclick="document.getElementById('pakua-dash-body').scrollTo({ top: 0, behavior: 'smooth' });" style="background: #2563eb; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.92rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ⬆️ Volver al inicio de esta pantalla
                </button>
                <button onclick="window.location.href='index.html';" style="background: #0f766e; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.92rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    🏠 Menú Principal
                </button>
            </div>
        `;

        // Renderizar gráficos con Chart.js
        loadChartJs(() => {
            renderCharts(sum);
        });
    }

    const SPANISH_TRANSLATIONS = {
        // Alemán (DE)
        "Hallo! Wie geht es dir? Mein Name ist Alfredo.": "¡Hola! ¿Cómo estás? Mi nombre es Alfredo.",
        "Schön, dich kennenzulernen!": "¡Mucho gusto en conocerte!",
        "Ich bin Pa-Kua Schüler in Argentinien.": "Soy alumno de la escuela de Pa-Kua en Argentina.",
        "Aus welcher Schule oder Stadt kommst du?": "¿De qué escuela o ciudad sos?",
        "Sprichst du Spanisch? Ich habe Basis-Deutschkenntnisse.": "¿Hablás español? ¡Tengo conocimientos básicos de alemán!",
        "Sprichst du Spanisch? Ich habe Basis-Englischkenntnisse.": "¿Hablás español? ¡Tengo conocimientos básicos de alemán!",
        "Ich übe Kosmo, Bogenschießen und Kampfkunst.": "Practico Cosmodinámica (Tai-Chi), Arquería y Arte Marcial.",
        "Ich mag auch sehr Rhythmus, Pa-Kua Chi und Massagen.": "También me gusta mucho Ritmo, Pa-Kua Chi y Masajes.",
        "Wie lange trainierst du schon Pa-Kua?": "¿Hace cuánto tiempo entrenás Pa-Kua?",
        "Welche Masterabschlüsse praktizieren Sie in Pa-Kua am längsten?": "¿Cuáles son las maestrías que llevas practicando más tiempo en Pa-Kua?",
        "Hab ein gutes Training! / Gute Übung!": "¡Buen entrenamiento! / ¡Buena práctica!",
        "Können wir im nächsten Block zusammen trainieren?": "¿Podemos entrenar juntos en el próximo bloque?",
        "Mir hat diese Technik sehr gefallen, kannst du sie mir nochmal zeigen?": "Me gustó mucho esta técnica, ¿me la podés mostrar de nuevo?",
        "Danke für die Tipps, das war sehr hilfreich!": "¡Gracias por los consejos, fue muy útil!",
        "Was ist dein Instagram oder WhatsApp?": "¿Cuál es tu Instagram o WhatsApp?",
        "Sollen wir ein Foto zusammen machen?": "¿Hacemos una foto juntos?",
        "Wo trifft sich die Gruppe später?": "¿Dónde se junta el grupo más tarde?",
        "Die Veranstaltung ist großartig, die Energie ist fantastisch!": "El evento es grandioso, ¡la energía es fantástica!",
        "Gehst du zum Gruppen-Dinner?": "¿Vas a la cena del grupo?",
        "Prost! Ein Toast auf alle!": "¡Salud! ¡Un brindis por todos!",
        "Es war eine große Freude, mit dir zu üben.": "Fue un gran placer entrenar contigo.",
        "Bis zum nächsten Mal! Gute Heimreise.": "¡Hasta la próxima! Buen regreso a casa.",
        "Wo befinden sich der Pool und das Fitnessstudio?": "¿Dónde quedan la piscina y el gimnasio del hotel?",
        "Um wie viel Uhr gibt es Frühstück und Abendessen?": "¿A qué hora hay desayuno y cena?",
        "Wo ist das Hotelrestaurant?": "¿Dónde está el restaurante del hotel?",
        "Um wie viel Uhr gibt es die Nachmittagsjause?": "¿A qué hora sirven la merienda?",
        "Möchte jemand zum Pool gehen, um sich zu entspannen?": "¿Alguien quiere ir a la piscina a relajarse?",
        "Möchtest du später ins Fitnessstudio gehen, um zu trainieren?": "¿Querés ir más tarde al gimnasio a entrenar?",
        "Sollen wir heute einen Spaziergang durch die Stadt machen?": "¿Hacemos un paseo por la ciudad hoy?",
        "Kennst du schöne Orte in der Nähe, die man besuchen kann?": "¿Conocés lugares lindos cerca que se puedan visitar?",
        "Was ist das WLAN-Passwort des Hotels?": "¿Cuál es la clave del Wi-Fi del hotel?",
        "Wo kann ich ein Handtuch für den Pool bekommen?": "¿Dónde puedo conseguir una toalla para la piscina?",

        // Inglés (EN)
        "Hi! How are you? My name is Alfredo.": "¡Hola! ¿Cómo estás? Mi nombre es Alfredo.",
        "Nice to meet you.": "Mucho gusto en conocerte.",
        "I am a student at the Pa-Kua school in Argentina.": "Soy alumno de la escuela de Pa-Kua en Argentina.",
        "Which school or city are you from?": "¿De qué escuela o ciudad sos?",
        "Do you speak Spanish? My English is basic!": "¿Hablás español? ¡Mi inglés es básico!",
        "I practice Cosmodynamics, Archery, and Martial Arts.": "Practico Cosmodinámica (Tai-Chi), Arquería y Arte Marcial.",
        "I also really like Rhythm, Pa-Kua Chi, and Massage.": "También me gusta mucho Ritmo, Pa-Kua Chi y Masajes.",
        "How long have you been training Pa-Kua?": "¿Hace cuánto tiempo entrenás Pa-Kua?",
        "What are the master's degrees that you have been practicing the longest in Pa-Kua?": "¿Cuáles son las maestrías que llevas practicando más tiempo en Pa-Kua?",
        "Have a good training session! Great practice!": "¡Buen entrenamiento! ¡Buena práctica!",
        "Have a good training session! / Great practice!": "¡Buen entrenamiento! / ¡Buena práctica!",
        "Can we train together in the next block?": "¿Podemos entrenar juntos en el próximo bloque?",
        "I really liked that technique, can you show me again?": "Me gustó mucho esa técnica, ¿me la podés mostrar de nuevo?",
        "Thank you for the tips, that was very helpful!": "¡Gracias por los consejos, sirvió mucho!",
        "What is your Instagram or WhatsApp?": "¿Cuál es tu Instagram o WhatsApp?",
        "Shall we take a picture together?": "¿Sacamos una foto juntos?",
        "Where is everyone meeting later?": "¿Dónde se junta el grupo más tarde?",
        "The event is amazing, the energy is great!": "El evento está increíble, ¡la energía está buenísima!",
        "Are you going to the group dinner?": "¿Vas a participar de la cena de confraternización?",
        "Cheers! A toast to everyone!": "¡Salud! ¡Un brindis por todos!",
        "It was a great pleasure training with you.": "Fue un placer enorme entrenar contigo.",
        "See you next time! Have a safe trip home.": "¡Hasta la próxima! Buen regreso a casa.",
        "Where is the pool and the gym located?": "¿Dónde queda la piscina y el gimnasio del hotel?",
        "What time is breakfast and dinner served?": "¿Cuál es el horario del desayuno y de la cena?",
        "Where is the hotel restaurant?": "¿Dónde queda el comedor o restaurante del hotel?",
        "What time is the afternoon snack served?": "¿A qué hora sirven la merienda?",
        "Does anyone want to go to the pool to relax?": "¿Alguien quiere ir a la piscina a relajarse un poco?",
        "Would you like to go to the gym to workout later?": "¿Querés ir al gimnasio a entrenar más tarde?",
        "Shall we go for a walk in the city today?": "¿Hacemos un paseo por la ciudad hoy?",
        "Do you know any nice places to visit near here?": "¿Conocés algún lugar lindo para pasear cerca de aquí?",
        "What is the Wi-Fi password for the hotel?": "¿Cuál es la clave del Wi-Fi del hotel?",
        "Where can I get a towel for the pool?": "¿Dónde puedo pedir una toalla para la piscina?",

        // Portugués (PT)
        "Oi! Tudo bem? Meu nome é Alfredo.": "¡Hola! ¿Todo bien? Mi nombre es Alfredo.",
        "Muito prazer em te conhecer.": "Mucho gusto en conocerte.",
        "Sou aluno da escola de Pa-Kua na Argentina.": "Soy alumno de la escuela de Pa-Kua en Argentina.",
        "De qual recinto ou cidade você é?": "¿De qué recinto o ciudad sos?",
        "Você fala espanhol? Meu português ainda é básico!": "¿Hablas español? ¡Mi portugués todavía es básico!",
        "Eu pratico Cosmodinâmica, Arqueria e Arte Marcial.": "Practico Cosmodinámica, Arquería y Arte Marcial.",
        "Também gosto muito de Ritmo, Pa-Kua Chi e Massagem.": "También me gusta mucho Ritmo, Pa-Kua Chi y Masajes.",
        "Há quanto tempo você treina Pa-Kua?": "¿Hace cuánto tiempo entrenás Pa-Kua?",
        "Quais são os mestrados que você pratica há mais tempo em Pa-Kua?": "¿Cuáles son las maestrías que llevas practicando más tiempo en Pa-Kua?",
        "Bom treino! / Boa prática!": "¡Buen entrenamiento! / ¡Buena práctica!",
        "Podemos treinar juntos no próximo bloco?": "¿Podemos entrenar juntos en el próximo bloque?",
        "Gostei muito dessa técnica, pode me mostrar de novo?": "Me gustó mucho esta técnica, ¿me la podés mostrar de nuevo?",
        "Obrigado pelas dicas, ajudou muito!": "¡Gracias por los consejos, sirvió mucho!",
        "Qual é o seu Instagram ou WhatsApp?": "¿Cuál es tu Instagram ou WhatsApp?",
        "Vamos tirar uma foto juntos?": "¿Sacamos una foto juntos?",
        "Onde o grupo vai se reunir mais tarde?": "¿Dónde se junta el grupo más tarde?",
        "O evento está incrível, a energia está demais!": "El evento está increíble, ¡la energía está buenísima!",
        "Você vai no jantar do grupo?": "¿Vas a participar de la cena de confraternización?",
        "Saúde! Um brinde a todos!": "¡Salud! ¡Un brindis por todos!",
        "Foi um grande prazer treinar com você.": "Fue un placer enorme entrenar contigo.",
        "Até a próxima! Boa viagem de volta.": "¡Hasta la próxima! Buen regreso a casa.",
        "Onde fica a piscina e a academia do hotel?": "¿Dónde queda la piscina y el gimnasio del hotel?",
        "Qual é o horário do café da manhã e do jantar?": "¿Cuál es el horário del desayuno y de la cena?",
        "Onde fica o restaurante do hotel?": "¿Dónde queda el restaurante del hotel?",
        "Que horas é servido o café da tarde?": "¿A qué hora sirven la merienda?",
        "Alguém quer ir para a piscina relaxar um pouco?": "¿Alguien quiere ir a la piscina a relajarse un poco?",
        "Quer ir à academia treinar mais tarde?": "¿Querés ir al gimnasio a entrenar más tarde?",
        "Vamos dar um passeio pela cidade hoje?": "¿Hacemos un paseo por la ciudad hoy?",
        "Conhece algum lugar legal para passear por perto?": "¿Conocés algún lugar lindo para pasear cerca de aquí?",
        "Qual é a senha do Wi-Fi do hotel?": "¿Cuál es la clave del Wi-Fi del hotel?",
        "Onde posso conseguir uma toalha para a piscina?": "¿Dónde puedo pedir una toalla para la piscina?"
    };

    function renderTopPhrasesList(topPhrases) {
        const sorted = Object.entries(topPhrases || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sorted.length === 0) {
            return `<div style="color: #94a3b8; font-size: 0.9rem;">Aún no se han registrado reproducciones de frases.</div>`;
        }

        return sorted.map(([phraseKey, count], idx) => {
            const isSpanish = phraseKey.startsWith('[ES]');
            const rawText = phraseKey.replace(/^\[(DE|EN|PT|ES)\]\s*/, '').trim();
            const translation = !isSpanish ? SPANISH_TRANSLATIONS[rawText] : null;

            return `
                <div style="display: flex; align-items: flex-start; justify-content: space-between; padding: 12px 14px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1; padding-right: 12px;">
                        <span style="font-weight: 800; color: #2563eb; font-size: 1.1rem; min-width: 28px; margin-top: 2px;">#${idx + 1}</span>
                        <div>
                            <div style="font-weight: 600; color: #1e293b; font-size: 0.95rem; line-height: 1.3;">${phraseKey}</div>
                            ${translation ? `<div style="font-size: 0.85rem; color: #059669; font-weight: 600; margin-top: 3px;">(🇦🇷 ${translation})</div>` : ''}
                        </div>
                    </div>
                    <span style="background: #dbeafe; color: #1e40af; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; white-space: nowrap; flex-shrink: 0;">${count} clics</span>
                </div>
            `;
        }).join('');
    }

    function formatDate(isoStr) {
        try {
            const d = new Date(isoStr);
            return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return isoStr;
        }
    }

    function renderCharts(sum) {
        // Chart 1: Países
        const ctxCountries = document.getElementById('chart-countries');
        if (ctxCountries) {
            const labels = Object.keys(sum.countries || {});
            const data = Object.values(sum.countries || {});
            new Chart(ctxCountries, {
                type: 'doughnut',
                data: {
                    labels: labels.length ? labels : ['Sin datos'],
                    datasets: [{
                        data: data.length ? data : [1],
                        backgroundColor: ['#2563eb', '#0d9488', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Chart 2: Idiomas
        const ctxLangs = document.getElementById('chart-languages');
        if (ctxLangs) {
            new Chart(ctxLangs, {
                type: 'bar',
                data: {
                    labels: ['Portugués 🇧🇷', 'Inglés 🇺🇸', 'Alemán 🇩🇪'],
                    datasets: [{
                        label: 'Visitas por Módulo',
                        data: [sum.languages.portugues || 0, sum.languages.ingles || 0, sum.languages.aleman || 0],
                        backgroundColor: ['#2563eb', '#0d9488', '#dc2626']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Chart 3: Franjas Horarias
        const ctxHours = document.getElementById('chart-hours');
        if (ctxHours) {
            const hoursLabels = Array.from({ length: 24 }, (_, i) => `${i}hs`);
            new Chart(ctxHours, {
                type: 'line',
                data: {
                    labels: hoursLabels,
                    datasets: [{
                        label: 'Actividad por Hora',
                        data: sum.hourlyActivity || Array(24).fill(0),
                        borderColor: '#0f766e',
                        backgroundColor: 'rgba(15, 118, 110, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Chart 4: Tipo de Interacción
        const ctxInteractions = document.getElementById('chart-interactions');
        if (ctxInteractions) {
            new Chart(ctxInteractions, {
                type: 'pie',
                data: {
                    labels: ['Audio Nativo', 'Audio Español', 'Google Traductor'],
                    datasets: [{
                        data: [
                            sum.interactionTypes.audioNative || 0,
                            sum.interactionTypes.audioSpanish || 0,
                            sum.interactionTypes.googleTranslate || 0
                        ],
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Chart 5: Tipo de Dispositivo
        const ctxDevices = document.getElementById('chart-devices');
        if (ctxDevices) {
            const devData = sum.devices || { Android: 0, iOS: 0, Desktop: 0, Otro: 0 };
            new Chart(ctxDevices, {
                type: 'pie',
                data: {
                    labels: ['Android 📱', 'iOS (iPhone/iPad) 🍏', 'Desktop (PC/Mac) 💻', 'Otro ❓'],
                    datasets: [{
                        data: [
                            devData.Android || 0,
                            devData.iOS || 0,
                            devData.Desktop || 0,
                            devData.Otro || 0
                        ],
                        backgroundColor: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    function exportJson() {
        const stats = getLocalStats();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `pakua_stats_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    async function resetStats() {
        let modal = document.getElementById('pakua-reset-auth-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'pakua-reset-auth-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
            z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px;
        `;

        modal.innerHTML = `
            <div style="background: #ffffff; border-radius: 16px; max-width: 420px; width: 100%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-size: 3rem; margin-bottom: 8px;">⚠️</div>
                <h3 style="font-size: 1.3rem; font-weight: 700; color: #dc2626; margin-bottom: 8px;">Reiniciar Estadísticas a Cero</h3>
                <p style="font-size: 0.92rem; color: #475569; margin-bottom: 16px; line-height: 1.4;">
                    Esta acción eliminará todas las métricas acumuladas local y remotamente.<br>
                    Ingresa la palabra <strong>"confirmar"</strong> para proceder:
                </p>
                <input type="password" id="pakua-reset-pass-input" placeholder="Escribe confirmar..." style="width: 100%; padding: 12px 16px; font-size: 1rem; border-radius: 10px; border: 2px solid #cbd5e1; outline: none; margin-bottom: 16px; text-align: center;">
                <div id="pakua-reset-auth-error" style="color: #ef4444; font-size: 0.85rem; display: none; margin-bottom: 12px; font-weight: 600;">⚠️ Clave incorrecta. Acción cancelada.</div>
                <div style="display: flex; gap: 10px;">
                    <button id="pakua-btn-cancel-reset" style="flex: 1; padding: 12px; border-radius: 10px; background: #f1f5f9; color: #475569; font-weight: 600; border: none; cursor: pointer;">Cancelar</button>
                    <button id="pakua-btn-confirm-reset" style="flex: 1; padding: 12px; border-radius: 10px; background: #dc2626; color: white; font-weight: 700; border: none; cursor: pointer;">Reiniciar ➔</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const passInput = document.getElementById('pakua-reset-pass-input');
        const btnConfirm = document.getElementById('pakua-btn-confirm-reset');
        const btnCancel = document.getElementById('pakua-btn-cancel-reset');
        const authError = document.getElementById('pakua-reset-auth-error');

        passInput.focus();

        btnCancel.onclick = () => {
            modal.remove();
            alert('Acción cancelada. No se han modificado las estadísticas.');
        };

        const executeReset = async () => {
            const hashOfConfirm = '2828ec2c3aeaa5becf212f58be99c958a662147a2df77442d2c798334421d2a0';
            const enteredHash = await hashText(passInput.value || '');
            if (enteredHash === hashOfConfirm) {
                modal.remove();
                const initial = getInitialStats();
                saveLocalStats(initial);
                await pushRemoteStats(initial);
                alert('Estadísticas reiniciadas con éxito');
                renderDashboardContent();
            } else {
                authError.style.display = 'block';
                setTimeout(() => {
                    modal.remove();
                    alert('Acción cancelada. La clave ingresada es incorrecta.');
                }, 1000);
            }
        };

        btnConfirm.addEventListener('click', executeReset);
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeReset();
        });
    }

    return {
        initSession,
        trackAudio,
        trackTranslate,
        openAdminPrompt
    };
})();
