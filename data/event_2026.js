/**
 * ============================================================================
 * PROYECTO: Encuentro Mundial Pa-Kua 2026 (50.º Aniversario) - San Pedro, Arg.
 * MÓDULO:   data/event_2026.js
 * FINALIDAD: Catálogo y configuración de información, flyers y programas
 *            para el evento "Aulas Abiertas Diciembre 2026" en 4 idiomas.
 * ============================================================================
 */

const EVENT_2026_DATA = {
  info: {
    title: "Aulas Abiertas - Diciembre 2026",
    subtitle: "Ciudad de San Pedro, Buenos Aires, Argentina",
    edition: "50 Aniversario Pa-Kua (1976 - 2026)",
    baseFolder: "Info Aulas Abiertas Diciembre 2026"
  },
  languages: {
    es: {
      code: "es",
      name: "Castellano",
      flag: "🇪🇸",
      tabLabel: "🇪🇸 Castellano",
      title: "Aulas Abiertas — Diciembre 2026",
      subtitle: "Ciudad de San Pedro, Provincia de Buenos Aires, Argentina",
      pendingMessage: "Información en proceso de generación",
      pendingDescription: "El material oficial en este idioma se publicará automáticamente en esta sección a medida que el equipo organizador complete la edición.",
      previewOtherLabel: "Ver material disponible en otros idiomas:",
      items: [
        {
          id: "flyer_es",
          title: "Flyer Oficial del Evento",
          tag: "Flyer Convocatoria",
          description: "Información general, disciplinas, maestros y convocatoria internacional para las Aulas Abiertas 2026.",
          file: "Info Aulas Abiertas Diciembre 2026/Castellano/Flyer aulas abiertas Pakua 2026.jpeg"
        },
        {
          id: "programa_es",
          title: "Programa Diario de Actividades",
          tag: "Cronograma Oficial",
          description: "Detalle día por día con horarios de entrenamientos, talleres, clases magistrales y eventos especiales.",
          file: "Info Aulas Abiertas Diciembre 2026/Castellano/Programa diario aulas abiertas Pakua 2026.jpeg"
        }
      ],
      // Candidatos a auto-descubrimiento adicional si el usuario añade nuevos archivos a la carpeta
      autoDiscoveryCandidates: [
        "Info Aulas Abiertas Diciembre 2026/Castellano/flyer.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Castellano/flyer.jpg",
        "Info Aulas Abiertas Diciembre 2026/Castellano/programa.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Castellano/programa.jpg"
      ]
    },
    pt: {
      code: "pt",
      name: "Português",
      flag: "🇧🇷",
      tabLabel: "🇧🇷 Português",
      title: "Aulas Abertas — Dezembro 2026",
      subtitle: "Cidade de San Pedro, Província de Buenos Aires, Argentina",
      pendingMessage: "Informações em processo de geração",
      pendingDescription: "O material oficial neste idioma será publicado automaticamente nesta seção assim que a equipe de organização concluir a edição.",
      previewOtherLabel: "Ver material disponível em outros idiomas:",
      items: [
        {
          id: "flyer_pt",
          title: "Flyer Oficial do Evento",
          tag: "Flyer Convocatória",
          description: "Informações gerais, disciplinas, mestres e convocatória internacional para as Aulas Abertas 2026.",
          file: "Info Aulas Abiertas Diciembre 2026/Portugues/flyer aulas pakua 2026 en portugues.jpeg"
        }
      ],
      autoDiscoveryCandidates: [
        "Info Aulas Abiertas Diciembre 2026/Portugues/programa.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Portugues/programa.jpg",
        "Info Aulas Abiertas Diciembre 2026/Portugues/Programa diario aulas abiertas Pakua 2026 en portugues.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Portugues/flyer.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Portugues/flyer.jpg"
      ]
    },
    en: {
      code: "en",
      name: "English",
      flag: "🇺🇸",
      tabLabel: "🇺🇸 English",
      title: "Open Classes — December 2026",
      subtitle: "San Pedro City, Buenos Aires Province, Argentina",
      pendingMessage: "Information in process of generation",
      pendingDescription: "The official material in English will be published automatically in this section as soon as the organizing team completes the translation and design.",
      previewOtherLabel: "View available materials in other languages:",
      items: [],
      autoDiscoveryCandidates: [
        "Info Aulas Abiertas Diciembre 2026/Ingles/Flyer aulas abiertas Pakua 2026 en ingles.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Ingles/flyer.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Ingles/flyer.jpg",
        "Info Aulas Abiertas Diciembre 2026/Ingles/flyer.png",
        "Info Aulas Abiertas Diciembre 2026/Ingles/programa.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Ingles/programa.jpg",
        "Info Aulas Abiertas Diciembre 2026/Ingles/Program aulas abiertas Pakua 2026.jpeg"
      ]
    },
    de: {
      code: "de",
      name: "Deutsch",
      flag: "🇩🇪",
      tabLabel: "🇩🇪 Deutsch",
      title: "Offene Klassen — Dezember 2026",
      subtitle: "Stadt San Pedro, Provinz Buenos Aires, Argentinien",
      pendingMessage: "Informationen in Vorbereitung",
      pendingDescription: "Das offizielle Material in deutscher Sprache wird automatisch in diesem Bereich veröffentlicht, sobald das Organisationsteam die Übersetzung und Gestaltung abgeschlossen hat.",
      previewOtherLabel: "Verfügbares Material in anderen Sprachen anzeigen:",
      items: [],
      autoDiscoveryCandidates: [
        "Info Aulas Abiertas Diciembre 2026/Aleman/Flyer aulas abiertas Pakua 2026 en aleman.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Aleman/flyer.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Aleman/flyer.jpg",
        "Info Aulas Abiertas Diciembre 2026/Aleman/flyer.png",
        "Info Aulas Abiertas Diciembre 2026/Aleman/programm.jpeg",
        "Info Aulas Abiertas Diciembre 2026/Aleman/programm.jpg",
        "Info Aulas Abiertas Diciembre 2026/Aleman/Programm aulas abiertas Pakua 2026.jpeg"
      ]
    }
  }
};

// Exportar globalmente
if (typeof window !== "undefined") {
  window.EVENT_2026_DATA = EVENT_2026_DATA;
}
