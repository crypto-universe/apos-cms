const aosSchema = require('../../lib/aosSchema.js');

module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Portfolio',
    description: 'Add a portfolio of projects to your page',
    previewImage: 'jpg',
    icon: 'portfolio-icon'
  },
  fields: {
    add: {
      displayType: {
        type: 'select',
        label: 'Slide display type',
        required: true,
        choices: [
          {
            label: 'Large, single slide',
            value: 1,
            def: true
          },
          {
            label: 'Three slides',
            value: 3
          },
          {
            label: 'Four slides',
            value: 4
          },
          {
            label: 'Five slides',
            value: 5
          },
          {
            label: 'Six slides',
            value: 6
          },
          {
            label: 'Seven slides',
            value: 7
          }
        ]
      },
      portfolioItems: {
        type: 'array',
        label: 'Portfolio Items',
        fields: {
          add: {
            _image: {
              type: 'relationship',
              withType: '@apostrophecms/image',
              label: 'Image',
              required: true
            },
            title: {
              type: 'string',
              label: 'Title',
              required: true
            },
            description: {
              type: 'string',
              label: 'Description',
              required: true
            },
            price: {
              type: 'string',
              label: 'Price',
              required: true
            },
            link: {
              type: 'url',
              label: 'Link',
              required: true
            }
          }
        }
      },
      ...aosSchema
    }
  }
};
