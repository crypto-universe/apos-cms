require('apostrophe')({
  shortName: 't-a',
  baseUrl: 'https://new.agenc.io',
  modules: {
    // Apostrophe module configuration
    // *******************************
    //
    // NOTE: most configuration occurs in the respective modules' directories.
    // See modules/@apostrophecms/page/index.js for an example.
    //
    // Any modules that are not present by default in Apostrophe must at least
    // have a minimal configuration here to turn them on: `moduleName: {}`
    // ***********************************************************************
    // `className` options set custom CSS classes for Apostrophe core widgets.
    '@apostrophecms/login-totp': {},
    '@apostrophecms/open-graph': {},
    '@apostrophecms/piece-type-exporter': {},
    '@apostrophecms/piece-type-importer': {},
    '@apostrophecms/redirect': {},
    '@apostrophecms/scheduled-publishing': {},
    '@apostrophecms/seo': {},
    '@apostrophecms/sitemap': {},
    '@apostrophecms/svg-sprite': {},
    '@apostrophecms/anchors': {},
    '@apostrophecms/favicon': {},
    '@apostrophecms/i18n-static': {
      options: {
        excludeNamespaces: [ 'aposEvent', 'aposForm' ]
      }
    },
    '@apostrophecms/rich-text-widget': {
      options: {
        className: 'bp-rich-text'
      }
    },
    '@apostrophecms/image-widget': {
      options: {
        className: 'bp-image-widget'
      }
    },
    '@apostrophecms/video-widget': {
      options: {
        className: 'bp-video-widget'
      }
    },
    // `asset` supports the project's webpack build for client-side assets.
    asset: {},
    // The project's first custom page type.
    'default-page': {},
    'columns-widget': {},
    'side-by-side-widget': {},
    'image-gallery-widget': {},
    'accordion-widget': {},
    'portfolio-widget':{},
    'welcome-widget':{},
    'clients-widget':{},
    'custom-text-widget': {},
    'faq-widget': {},
    'offers-widget': {},
    'navigation': {},
    '@apostrophecms/admin-bar': {
      options: {
        addGroups: [
          {
            label: 'Media',
            items: [
              '@apostrophecms/image',
              '@apostrophecms/image-tag',
              '@apostrophecms/file',
              '@apostrophecms/file-tag'
            ]
          }
        ]
      }
    }
  }
});
