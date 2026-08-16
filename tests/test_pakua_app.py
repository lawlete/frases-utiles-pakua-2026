import os
import json
import pytest

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'data')
JS_DIR = os.path.join(BASE_DIR, 'js')

LANGUAGES = [
    ('phrases_pt.json', 'pt-BR', 'Portugués', '🇧🇷', 'pt'),
    ('phrases_en.json', 'en-US', 'Inglés', '🇺🇸', 'en'),
    ('phrases_de.json', 'de-DE', 'Alemán', '🇩🇪', 'de')
]

@pytest.mark.parametrize("json_filename, expected_lang, expected_title, expected_flag, lang_code", LANGUAGES)
def test_json_data_files_integrity(json_filename, expected_lang, expected_title, expected_flag, lang_code):
    """Verifica la existencia, validez y metadatos de los archivos JSON de idioma."""
    file_path = os.path.join(DATA_DIR, json_filename)
    assert os.path.exists(file_path), f"El archivo {json_filename} no existe en {DATA_DIR}"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    assert data["language"] == expected_lang
    assert data["title"] == expected_title
    assert data["flag"] == expected_flag
    assert len(data["sections"]) == 4

@pytest.mark.parametrize("json_filename, expected_lang, expected_title, expected_flag, lang_code", LANGUAGES)
def test_phrase_count_and_section_structure(json_filename, expected_lang, expected_title, expected_flag, lang_code):
    """Verifica que cada idioma contenga exactamente 31 frases en 4 secciones."""
    file_path = os.path.join(DATA_DIR, json_filename)
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    total_phrases = sum(len(sec["phrases"]) for sec in data["sections"])
    assert total_phrases == 31, f"Se esperaban 31 frases en {json_filename}, pero hay {total_phrases}"

@pytest.mark.parametrize("json_filename, expected_lang, expected_title, expected_flag, lang_code", LANGUAGES)
def test_phrase_object_schema_and_fields(json_filename, expected_lang, expected_title, expected_flag, lang_code):
    """Verifica la estructura y validez de cada objeto de frase en el JSON."""
    file_path = os.path.join(DATA_DIR, json_filename)
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    global_id = 1
    for sec in data["sections"]:
        assert "id" in sec and "title" in sec and "phrases" in sec
        for p in sec["phrases"]:
            assert "id" in p
            assert len(p["targetText"].strip()) > 0, f"Frase vacía en ID {global_id} de {json_filename}"
            assert len(p["phonetic"].strip()) > 0, f"Fonética vacía en ID {global_id} de {json_filename}"
            assert len(p["translation"].strip()) > 0, f"Traducción vacía en ID {global_id} de {json_filename}"
            assert p["audio"] == f"assets/audio/{lang_code}/phrase_{len(sec['phrases']):02d}.mp3" or p["audio"].startswith(f"assets/audio/{lang_code}/")
            assert "googleTranslateUrl" in p and p["googleTranslateUrl"].startswith("https://translate.google.com/")
            global_id += 1

def test_html_files_integration():
    """Verifica que las páginas HTML incorporen la carga dinámica con js/app.js y el contenedor #phrases-container."""
    html_files = ['portugues.html', 'ingles.html', 'aleman.html']
    for fname in html_files:
        path = os.path.join(BASE_DIR, fname)
        assert os.path.exists(path), f"Falta el archivo {fname}"
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        assert 'id="phrases-container"' in content, f"Falta #phrases-container en {fname}"
        assert 'src="js/app.js"' in content, f"Falta js/app.js en {fname}"
        assert 'src="stats.js"' in content, f"Falta stats.js en {fname}"
        assert 'initPhrasesApp(' in content, f"Falta inicialización initPhrasesApp en {fname}"

def test_stats_pass_removed():
    """Verifica que el panel de estadísticas no requiera contraseña."""
    stats_path = os.path.join(BASE_DIR, 'stats.js')
    assert os.path.exists(stats_path)
    with open(stats_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # openAdminPrompt debe llamar directamente a showDashboardModal()
    assert 'function openAdminPrompt() {\n        showDashboardModal();\n    }' in content

def test_js_app_engine_exists_and_documented():
    """Verifica la existencia y encabezado documental de js/app.js."""
    app_js_path = os.path.join(JS_DIR, 'app.js')
    assert os.path.exists(app_js_path)
    with open(app_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'PROYECTO: Encuentro Mundial Pa-Kua 2026' in content
    assert 'MÓDULO:   Motor Frontend Dinámico' in content
    assert 'window.parseFlag' in content
    assert 'window.playAudio' in content
    assert 'window.speak' in content
