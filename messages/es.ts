import type { MessageCatalog } from "@/messages/en";

export const es = {
  metadata: {
    applicationName: "Blind Journal",
    title: "Blind Journal",
    titleTemplate: "%s · Blind Journal",
    description: "Un diario personal privado con cifrado de extremo a extremo.",
  },
  common: {
    actions: {
      cancel: "Cancelar",
      done: "Listo",
      retry: "Reintentar",
      save: "Guardar",
    },
    labels: {
      loading: "Cargando…",
      soon: "Próximamente",
    },
    errors: {
      network: "No pudimos comunicarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      unexpected: "Algo salió mal. Inténtalo de nuevo.",
    },
  },
  auth: {
    signIn: {
      title: "Iniciar sesión",
      usernameLabel: "Nombre de usuario",
      usernamePlaceholder: "Ingresa tu nombre de usuario",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "Ingresa tu contraseña",
      createAccount: "Crear cuenta",
      submit: "Iniciar sesión",
    },
    success: {
      accountInformationReceived: "Información de la cuenta recibida.",
    },
    errors: {
      usernameRequired: "Ingresa un nombre de usuario.",
      userNotFound: "No se encontró una cuenta con ese nombre de usuario.",
    },
  },
  brand: {
    name: "Blind Journal",
  },
  navigation: {
    journalNavigationLabel: "Navegación del diario",
    primaryLabel: "Principal",
    collectionsLabel: "Colecciones",
    newEntry: "Nueva entrada",
    newEntryShortcut: "N",
    collectionsTitle: "COLECCIONES",
    sections: {
      journal: "Diario",
      calendar: "Calendario",
      favorites: "Favoritos",
      archive: "Archivo",
      trash: "Papelera",
    },
    collections: {
      personalGrowth: "Crecimiento personal",
      peopleILove: "Personas que amo",
    },
    privacy: {
      title: "Privado por diseño.",
      description: "Tu diario se cifra antes de salir de este dispositivo.",
    },
    account: {
      menuLabel: "Cuenta",
      profile: "Perfil",
      privacySettings: "Configuración de privacidad",
      lockJournal: "Bloquear diario",
      settings: "Configuración",
    },
  },
  journal: {
    moods: {
      calm: "En calma",
      hopeful: "Con esperanza",
      reflective: "Reflexivo",
      tired: "Cansado",
      grateful: "Agradecido",
    },
    list: {
      sectionLabel: "Entradas del diario",
      eyebrow: "DIARIO PERSONAL",
      title: "Tus entradas",
      filtersLabel: "Filtros de entradas",
      displayLabel: "Visualización",
      showMood: "Mostrar estado de ánimo",
      newestFirst: "Más recientes primero",
      searchPlaceholder: "Buscar en tu diario",
      all: "Todas",
      favorites: "Favoritas",
      entriesCountOne: "{count} entrada",
      entriesCountOther: "{count} entradas",
      favoriteLabel: "Favorita",
      encryptedLabel: "Cifrada",
      emptyTitle: "No hay entradas coincidentes",
      emptyDescription: "Prueba con un título, una etiqueta o una frase que recuerdes.",
    },
    editor: {
      encryptedOnDevice: "Cifrada en este dispositivo",
      privateEntry: "Solo tú puedes leer esta entrada",
      encryptionDetails: "Detalles del cifrado",
      removeFromFavorites: "Quitar de favoritos",
      addToFavorites: "Agregar a favoritos",
      sharePrivately: "Compartir de forma privada",
      entryActions: "Acciones de la entrada",
      exportEncryptedCopy: "Exportar copia cifrada",
      manageTags: "Administrar etiquetas",
      moveToTrash: "Mover a la papelera",
      addTag: "Agregar etiqueta",
      entryTitleLabel: "Título de la entrada",
      entryBodyLabel: "Entrada del diario",
      startWriting: "Empieza a escribir…",
      savedJustNow: "Guardado ahora",
      wordsCountOne: "{count} palabra",
      wordsCountOther: "{count} palabras",
      formatting: {
        bold: "Negrita",
        italic: "Cursiva",
        bulletedList: "Lista con viñetas",
        numberedList: "Lista numerada",
        quote: "Cita",
      },
    },
    newEntry: {
      title: "Entrada sin título",
      preview: "Empieza a escribir…",
      dateLabel: "Viernes, 31 de julio",
      timeLabel: "Ahora",
      updatedAt: "Nueva entrada",
    },
  },
  privacy: {
    title: "Privacidad y seguridad",
    description:
      "Configuración visual de cómo Blind Journal protege y desbloquea tus escritos privados.",
    settings: {
      biometricUnlock: {
        title: "Desbloqueo biométrico",
        description: "Usa Touch ID o la biometría de tu dispositivo después del primer desbloqueo.",
      },
      autoLock: {
        title: "Bloqueo automático",
        description: "Bloquea el diario después de cinco minutos de inactividad.",
      },
      encryptedSync: {
        title: "Sincronización cifrada",
        description:
          "Sincroniza los datos cifrados del diario entre tus dispositivos de confianza.",
      },
      trustedDevices: {
        title: "Dispositivos de confianza",
        description: "Solicita aprobación antes de que un dispositivo nuevo acceda a tu diario.",
      },
    },
    recovery: {
      title: "Clave de recuperación",
      description:
        "Blind Journal no puede leer ni recuperar tus entradas. Guarda tu clave de recuperación en un lugar seguro.",
      action: "Ver opciones de recuperación",
    },
  },
} satisfies MessageCatalog;
