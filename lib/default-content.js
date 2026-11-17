// Contenido inicial del sitio. El usuario master lo puede cambiar desde /admin/.
// Si se modifica este archivo, ejecutar: node tools/sync-default.mjs
export const DEFAULT_CONTENT = {
  version: 1,
  hero: {
    eyebrow: 'Empresa de tecnología',
    title: 'Donde empieza\nla tecnología',
    text: 'Arkhenix es el núcleo de un grupo de productos de software, cada uno con su propia marca.',
    cta: 'Ver las marcas',
  },
  brandsSection: {
    title: 'Marcas',
    subtitle: 'Módulos del grupo',
  },
  lema: 'ORIGEN TECNOLÓGICO · SOLUCIONES DE SOFTWARE',
  brands: [
    {
      id: 'corte', name: 'Corte Atlas', tag: 'ATLAS · VISOR',
      description: 'Atlas interactivo y visor DICOM en la web.',
      url: 'https://corteatlas.com', status: 'activa', logo: '/assets/corte-logo.png', videos: [],
    },
    {
      id: 'cerven', name: 'Cerven', tag: 'TELERADIOLOGÍA',
      description: 'Plataforma de teleradiología.',
      url: 'https://cerven.io', status: 'activa', logo: '', videos: [],
    },
    {
      id: 'verbato', name: 'Verbato', tag: 'VOZ A TEXTO',
      description: 'Transcripción de audio a texto, para cualquier ámbito.',
      url: 'https://verbato.io', status: 'activa', logo: '', videos: [],
    },
    {
      id: 'his', name: 'HIS', tag: 'SISTEMA HIS',
      description: 'Sistema de información hospitalaria.',
      url: '', status: 'pronto', logo: '', videos: [],
    },
  ],
  about: {
    title: 'Sobre nosotros',
    paragraphs: [
      'Arkhenix es una empresa de tecnología dedicada a crear soluciones de software. Diseñamos, desarrollamos y mantenemos productos digitales que resuelven problemas concretos, con foco en la calidad técnica, la seguridad de la información y una experiencia de uso clara.',
      'Cada producto nace como una marca propia, con identidad y comunidad propias, pero todos comparten la misma base: ingeniería cuidada, infraestructura en la nube y mejora continua a partir de lo que dicen quienes los usan.',
      'Hoy el grupo reúne a Corte Atlas, Cerven y Verbato, y prepara un sistema de información hospitalaria. Seguimos creciendo con una idea simple: que la buena tecnología empieza desde la base.',
    ],
  },
  contact: {
    title: 'Hablemos.',
    text: 'Cuéntanos qué necesitas o qué te gustaría construir. Te responderemos a la brevedad.',
    email: 'contacto@arkhenix.com',
  },
  footer: {
    description: 'Empresa de tecnología que crea y desarrolla soluciones de software. Es el origen de Corte Atlas, Cerven y Verbato, y prepara un sistema de información hospitalaria.',
    social: { linkedin: '', instagram: '', youtube: '', x: '' },
  },
  legal: {
    company: '[RAZÓN SOCIAL]',
    taxId: '[RIF / NÚMERO FISCAL]',
    address: '[DIRECCIÓN]',
    country: '[PAÍS]',
    email: 'contacto@arkhenix.com',
    updated: '17 de noviembre de 2026',
  },
};
