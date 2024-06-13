module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Custom Text',
    description: 'A widget to display customizable text with custom styles',
    icon: 'align-left'
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
