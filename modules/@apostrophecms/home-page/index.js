module.exports = {
    options: {
        label: 'Home Page'
    },
    fields: {
        add: {
            main: {
                type: 'area',
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
                                'orderedList',
                                'characterCount'
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
                        },
                        '@apostrophecms/image': {},
                        '@apostrophecms/video': {},
                        'image-gallery': {},
                        'columns': {},
                        'side-by-side': {},
                        'accordion': {},
                        'portfolio': {},
                        'welcome': {},
                        'clients': {},
                        'custom-text': {},
                        'faq': {},
                        'offers': {},
                        'article': {},
                        'html': {}
                    }
                }
            },
            html: {
                label: 'HTML код',
                type: 'string',
                textarea: true
            }
        },
        group: {
            basics: {
                label: 'Basics',
                fields: [
                    'title',
                    'main'
                ]
            }
        }
    }
};
