module.exports = {
  extend: '@apostrophecms/piece-type',
  fields: {
    add: {
      string: {
        label: 'Super long string title that is entirely too long to be very helpful',
        type: 'string',
        help: 'One cannot separate orchestras from cheerful magicians. The fructed knowledge reveals itself as an unkempt tub to those who look. This could be, or perhaps few can name a crimpy thailand that isn\'t a shadeless literature. A timer can hardly be considered an unfilled chalk without also being a priest. The almanacs could be said to resemble chaster beards.'
      },
      slugger: {
        type: 'slug',
        label: 'Fake Slug'
      },
      main: {
        label: 'Content',
        type: 'area',
        options: {
          widgets: require('../../lib/area').fullConfig
        }
      },
      singleton: {
        label: 'Video singleton',
        type: 'area',
        max: 1,
        options: {
          widgets: {
            '@apostrophecms/video': {}
          }
        }
      },
      _topics: {
        label: 'Related topics',
        type: 'relationship',
        withType: 'topic',
        help: 'No more than two allowed.',
        max: 2,
        builders: {
          project: {
            title: 1,
            type: 1,
            checkFields: 1
          }
        }
      },
      arrayField: {
        label: 'Array field',
        type: 'array',
        titleField: 'firstString',
        fields: {
          add: {
            firstString: {
              type: 'string',
              label: 'The primary string'
            },
            moreString: {
              type: 'string',
              label: 'Another string'
            }
          }
        }
      },
      attachmentField: {
        label: 'Attachment',
        type: 'attachment',
        fileGroup: 'office'
      },
      photoField: {
        label: 'Photo attachment',
        type: 'attachment',
        fileGroup: 'images'
      },
      booleanField: {
        label: 'Boolean',
        type: 'boolean'
      },
      booleanCustom: {
        label: 'Labeled boolean',
        type: 'boolean',
        choices: [
          {
            label: 'Go',
            value: true
          },
          {
            label: 'Stop',
            value: false
          }
        ]
      },
      checkFields: {
        label: 'Label',
        type: 'checkboxes',
        choices: [
          {
            label: 'Small',
            value: 'small'
          },
          {
            label: 'Medium',
            value: 'med'
          },
          {
            label: 'Big',
            value: 'big'
          }
        ]
      },
      radioFields: {
        label: 'Radio',
        type: 'radio',
        choices: [
          {
            label: 'Small',
            value: 'small'
          },
          {
            label: 'Medium',
            value: 'med'
          },
          {
            label: 'Big',
            value: 'big'
          }
        ]
      },
      colorField: {
        type: 'color',
        label: 'Color'
      },
      dateField: {
        label: 'Date',
        type: 'date'
      },
      emailField: {
        type: 'email'
      },
      floatField: {
        label: 'Float',
        type: 'float',
        help: 'Maximum of 4.0',
        max: 4.0
      },
      integerField: {
        label: 'Integer',
        type: 'integer',
        help: 'Between 3 and 9, inclusive',
        min: 3,
        max: 9
      },
      oembedField: {
        label: 'Embedder',
        type: 'oembed'
      },
      selector: {
        label: 'Select a color scheme for this page',
        type: 'select',
        choices: [
          {
            label: 'Dark 🌚',
            value: 'dark'
          },
          {
            label: 'Light 💡',
            value: 'light'
          },
          {
            label: 'Dusk 🌆',
            value: 'dusk'
          },
          {
            label: 'Swamp 🐢',
            value: 'swamp'
          }
        ]
      },
      urlField: {
        label: 'URL',
        type: 'url'
      }
    },
    group: {
      strings: {
        label: 'Strings',
        fields: [
          'title',
          'string'
        ]
      },
      nonStrings: {
        label: 'Fun fields',
        fields: [
          'attachmentField',
          'booleanField',
          'checkFields',
          'radioFields',
          'colorField',
          'floatField',
          'integerField',
          'rangeField',
          'selector',
          'booleanCustom'
        ]
      },
      fancy: {
        label: 'Fancy fields',
        fields: [
          '_topics',
          'arrayField',
          'photoField',
          'singleton',
          'oembedField',
          'main'
        ]
      }
    }
  }
};
