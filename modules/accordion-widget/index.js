const areaConfig = require('../../lib/area');
const aosSchema = require('../../lib/aosSchema.js');

module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Accordion',
    icon: 'menu-open-icon',
    description: 'Add expandable content to your page',
    previewImage: 'svg'
  },
  icons: {
    'menu-open-icon': 'MenuOpen'
  },
  fields: {
    add: {
      accordions: {
        type: 'array',
        label: 'Accordions',
        titleField: 'title',
        inline: true,
        fields: {
          add: {
            title: {
              type: 'string',
              label: 'Title'
            },
            content: {
              type: 'area',
              label: 'Content',
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
                  }
                }
              }
            }
          }
        }
      },
      ...aosSchema
    }
  }
};
