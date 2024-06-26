const aosSchema = require('../../lib/aosSchema.js');

module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Image Gallery',
    description: 'Add a gallery of images to your page',
    previewImage: 'jpg',
    icon: 'image-gallery-icon'
  },
  icons: {
    'image-gallery-icon': 'ImageAlbum'
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
      _images: {
        type: 'relationship',
        withType: '@apostrophecms/image',
        label: 'Images',
        required: true,
        max: 10
      },
      ...aosSchema
    }
  }
};
