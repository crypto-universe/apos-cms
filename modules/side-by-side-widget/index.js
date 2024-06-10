const aosSchema = require('../../lib/aosSchema.js');

module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Side by side',
    icon: 'layout-side-icon',
    description: 'Display two sections of content side by side',
    previewImage: 'jpg'
  },
  icons: {
    'layout-side-icon': 'PageLayoutSidebarRight'
  },
  fields: {
    add: {
      invert: {
        type: 'boolean',
        label: 'Invert columns',
        required: true,
        def: false
      },
      one: {
        type: 'area',
        contextual: true,
        options: {
          widgets: {
            '@apostrophecms/rich-text': {
              toolbar: [
                'styles',
                '|',
                'bold',
                'italic',
                'strike',
                'link',
                '|',
                'bulletList',
                'orderedList'
              ],
              styles: [
                {
                  tag: 'p',
                  label: 'Paragraph (P)'
                },
                {
                  tag: 'h1',
                  label: 'Heading 1 (H1)'
                },
                {
                  tag: 'h2',
                  label: 'Heading 2 (H2)'
                },
                {
                  tag: 'h3',
                  label: 'Heading 3 (H3)'
                },
                {
                  tag: 'h4',
                  label: 'Heading 4 (H4)'
                },
                {
                  tag: 'h5',
                  label: 'Heading 5 (H5)'
                },
                {
                  tag: 'h6',
                  label: 'Heading 6 (H6)'
                }
              ]
            },
            '@apostrophecms/image': {
              size: 'original'
            },
            '@apostrophecms/video': {},
            'image-gallery': {}
          }
        }
      },
      two: {
        type: 'area',
        contextual: true,
        options: {
          widgets: {
            '@apostrophecms/rich-text': {
              toolbar: [
                'styles',
                '|',
                'bold',
                'italic',
                'strike',
                'link',
                '|',
                'bulletList',
                'orderedList'
              ],
              styles: [
                {
                  tag: 'p',
                  label: 'Paragraph (P)'
                },
                {
                  tag: 'h1',
                  label: 'Heading 1 (H1)'
                },
                {
                  tag: 'h2',
                  label: 'Heading 2 (H2)'
                },
                {
                  tag: 'h3',
                  label: 'Heading 3 (H3)'
                },
                {
                  tag: 'h4',
                  label: 'Heading 4 (H4)'
                },
                {
                  tag: 'h5',
                  label: 'Heading 5 (H5)'
                },
                {
                  tag: 'h6',
                  label: 'Heading 6 (H6)'
                }
              ]
            },
            '@apostrophecms/image': {
              size: 'original'
            },
            '@apostrophecms/video': {},
            'image-gallery': {}
          }
        }
      },
      ...aosSchema
    }
  }
};
