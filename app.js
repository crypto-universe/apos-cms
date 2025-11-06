require('apostrophe')({
  shortName: 't-a',
  baseUrl: 'https://new.agenc.io',
  bundles: [ '@apostrophecms/rich-text-example-extensions'],
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
    // The main blog piece type module
    // A piece type for articles
    '@apostrophecms/sitemap': {},
    '@apostrophecms/open-graph': {},
    '@apostrophecms/piece-type-exporter': {},
    '@apostrophecms/piece-type-importer': {},
    '@apostrophecms/redirect': {},
    '@apostrophecms/scheduled-publishing': {},
    '@apostrophecms/seo': {},
    '@apostrophecms/svg-sprite': {},
    '@apostrophecms/typography': {},
    '@apostrophecms/anchors': {},
    '@apostrophecms/favicon': {},
    '@apostrophecms/notification': {},
    '@apostrophecms/login-totp': {},
    '@apostrophecms/smilies': {},
    '@apostrophecms/characterCount': {},
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
    // AI Provider Manager - unified system for multiple AI providers
    'ai-provider-manager': {},
    // AI Assistant module for content generation with multiple AI providers
    'ai-assistant': {},
    // Newsletter subscription module with htmx integration
    newsletter: {},
    // Schema.org structured data for SEO (rich snippets)
    'schema-markup': {},
    // Enhanced Breadcrumbs with Schema.org support
    'enhanced-breadcrumbs': {},
    // AI-powered Related Content Widget
    'related-content-widget': {},
    // AI-powered FAQ Generator
    'faq-generator': {},
    // Intelligent Search with AI hints
    'intelligent-search': {},
    // ========================================
    // APOSTROPHE PRO FEATURES
    // ========================================
    // Advanced Permissions - granular access control
    'advanced-permissions': {},
    // Automatic Translations - Google Translate, DeepL, AI
    'automatic-translations': {},
    // Document Versions - full versioning system
    'document-versions': {},
    // Template Library - content templates
    'template-library': {},
    // Signup - user registration with email verification
    'signup': {},
    // Data Set - CSV import and visualization
    'data-set': {},
    'data-set-widget': {},
    article: {},
    // Tease an article on any page
    'article-widget': {},
    // Paginated index of articles, and with pages for individual articles
    'article-page': {},
    topic: {},
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
    'html-widget': {},
    'dynamic-content-widget': {},
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
