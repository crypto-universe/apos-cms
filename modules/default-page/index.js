module.exports = {
  extend: '@apostrophecms/page-type',
  options: {
    label: 'Default Page'
  },
  fields: {
    add: {
      main: {
        type: 'area',
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
                'orderedList',
                'characterCount'
              ],
              styles: [
                {
                  tag: 'p',
                  label: 'Paragraph (P)'
                },
                {
                  tag: 'h3',
                  label: 'Heading 3 (H3)'
                },
                {
                  tag: 'h4',
                  label: 'Heading 4 (H4)'
                }
              ],
              insert: [
                'table',
                'image',
              ],
              typoConfig: {
                // Will no longer convert `(tm)` to ™
                trademark: false,
                // Will convert `->` to `=>`
                rightArrow: '=>'
              },
              smiliesConfig: {
                tone: 2
              },
              charCountConfig: {
                // How X!
                limit: 3000
              }
            },
            '@apostrophecms/image': {},
            '@apostrophecms/video': {},
            'image-gallery': {},
            'columns': {},
            'side-by-side': {},
            'accordion': {},
            'portfolio': {},
            'welcome': {},
            'clients': {},
            'custom-text': {},
            'faq': {},
            'offers': {}
          }
        }
      }
    },
    group: {
      basics: {
        label: 'Basics',
        fields: [
          'title',
          'main'
        ]
      }
    }
  }
};
