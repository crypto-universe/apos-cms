module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'FAQ',
    description: 'A widget to display frequently asked questions',
    icon: 'frequently-asked-questions'
  },
  icons: {
    'frequently-asked-questions': 'FrequentlyAskedQuestions'
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Section Title',
        required: true
      },
      faqs: {
        type: 'array',
        label: 'FAQs',
        titleField: 'question',
        fields: {
          add: {
            question: {
              type: 'string',
              label: 'Question',
              required: true
            },
            answer: {
              type: 'string',
              label: 'Answer',
              required: true,
              textarea: true
            }
          }
        }
      }
    }
  }
};
