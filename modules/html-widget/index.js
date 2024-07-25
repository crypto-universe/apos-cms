module.exports = {
    extend: '@apostrophecms/widget-type',
    options: {
        label: 'HTML widget',
        description: 'Custom HTML widget',
        icon: 'heart-box'
    },
    icons: {
        'heart-box': 'HeartBox'
    },
    fields: {
        add: {
            html: {
                label: 'HTML for custom widget',
                type: 'string',
                textarea: true
            }
        }
    }
};
