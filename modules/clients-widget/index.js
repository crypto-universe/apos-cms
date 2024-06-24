module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Clients',
    description: 'A widget to display a list of clients with links and images',
    icon: 'crown'
  },
  icons: {
    'crown': 'Crown'
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Section Title',
        required: true
      },
      clients: {
        type: 'array',
        label: 'Clients',
        titleField: 'name',
        fields: {
          add: {
            name: {
              type: 'string',
              label: 'Client Name',
              required: true
            },
            url: {
              type: 'url',
              label: 'Client URL',
              required: true
            },
            image: {
              type: 'attachment',
              label: 'Client Image',
              required: true,
              extensions: ['jpg', 'png', 'gif', 'webp']
            }
          }
        }
      }
    }
  }
};
