import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Sidebar principal de Carvento con estructura organizada
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Negocio y Requerimientos',
      collapsed: false,
      items: [
        'negocio/resumen-ejecutivo',
        'negocio/requerimientos',
        'negocio/historias-usuario',
      ],
    },
    {
      type: 'category',
      label: 'Arquitectura Técnica',
      collapsed: false,
      items: [
        'arquitectura/arquitectura-general',
        'arquitectura/base-de-datos',
        'arquitectura/estrategia-despliegue',
      ],
    },
    {
      type: 'category',
      label: 'Dominios del Negocio',
      collapsed: false,
      items: [
        'dominios/inventario-vehiculos',
        'dominios/usuarios-autenticacion',
        'dominios/backoffice-administracion',
      ],
    },
    {
      type: 'category',
      label: 'Guías de Desarrollo',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Frontend',
          items: [
            'desarrollo/frontend/vision-general',
            'desarrollo/frontend/guia-desarrollo',
            'desarrollo/frontend/guia-estilos',
            'desarrollo/frontend/interceptores-http',
            'desarrollo/frontend/modales-globales',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
