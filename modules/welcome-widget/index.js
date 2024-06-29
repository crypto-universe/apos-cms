module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Welcome',
    description: 'Welcome widget with editable text fields',
    icon: 'heart-box'
  },
  icons: {
    'heart-box': 'HeartBox'
  },
  fields: {
    add: {
      headerTitle: {
        type: 'string',
        label: 'Header Title',
        required: true
      },
      descTitle: {
        type: 'string',
        label: 'Description Title',
        required: true
      },
      texts: {
        type: 'array',
        label: 'Texts',
        titleField: 'text',
        fields: {
          add: {
            text: {
              type: 'string',
              label: 'Text',
              required: true
            }
          }
        }
      },
      description: {
        type: 'area',
        label: 'Description',
        options: {
          widgets: {
            '@apostrophecms/rich-text': {},
            '@apostrophecms/image': {}
          }
        },
        required: true
      },
      hashtags: {
        type: 'array',
        label: 'Hashtags',
        titleField: 'hashtag',
        fields: {
          add: {
            hashtag: {
              type: 'string',
              label: 'Hashtag',
              required: true
            },
            _hashtagLink: {
              type: 'relationship',
              withType: '@apostrophecms/page',
              required: true
            }
          }
        },
        required: true
      },
      buttonText: {
        type: 'string',
        label: 'Button Text',
        required: true
      },
      buttonLink: {
        type: 'url',
        label: 'Button Link',
        required: true
      }
    }
  }
};
