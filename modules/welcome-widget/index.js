module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Welcome',
    description: 'Welcome widget with editable text fields',
    icon: 'home'
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Title',
        required: true
      },
      description: {
        type: 'area',
        label: 'Description',
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
              ]
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
