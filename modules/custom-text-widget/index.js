module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Custom Text',
    description: 'A widget to display customizable text with custom styles',
    icon: 'format-textbox'
  },
  icons: {
    'format-textbox': 'FormatTextbox'
  },
  fields: {
    add: {
      text: {
        type: 'string',
        label: 'Text',
        required: true
      }
    }
  }
};
