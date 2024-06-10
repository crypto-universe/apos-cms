const area = {
  all: {
    columns: {}
  },
  columnExpandedGroup: {
    basic: {
      label: 'Basic Tools',
      widgets: {
        'rich-text': {}
      },
      columns: 2
    },
    layout: {
      label: 'Layout Tools',
      widgets: {
        'rich-text': {}
      },
      columns: 2
    },
    general: {
      label: 'Themed Widgets',
      widgets: {
        'rich-text': {}
      },
      columns: 3
    }
  },
  richText: {
    '@apostrophecms/rich-text': {
    }
  },
  fullExpandedGroup: {
    layout: {
      label: 'Layout Tools',
      widgets: {
        columns: {}
      },
      columns: 2
    },
    media: {
      label: 'Media Widgets',
      widgets: {
        image: {},
        '@apostrophecms/video': {}
      },
      columns: 2
    },
    general: {
      label: 'Content Widgets',
      widgets: {
        'rich-text': {}
      },
      columns: 3
    }
  }
};

module.exports = {
  '@apostrophecms/image': {},
  '@apostrophecms/video': {},
  '@apostrophecms/html': {},
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
      '|',
      'blockquote',
      'codeBlock',
      '|',
      'horizontalRule',
      '|',
      'undo',
      'redo'
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
      'image'
    ]
  }
};
