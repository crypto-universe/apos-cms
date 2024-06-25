module.exports = {
    fields: {
        add: {
            primaryNav: {
                label: 'Primary site navigation',
                type: 'array',
                titleField: 'label',
                help: 'Add, remove, and reorder navigation items.',
                fields: {
                    add: {
                        label: {
                            label: 'Nav item label',
                            type: 'string'
                        },
                        type: {
                            label: 'Link type',
                            type: 'select',
                            choices: [
                                {
                                    label: 'Page',
                                    value: 'page'
                                },
                                {
                                    label: 'Custom URL',
                                    value: 'custom'
                                }
                            ]
                        },
                        _page: {
                            label: 'Page to link',
                            type: 'relationship',
                            withType: '@apostrophecms/page',
                            max: 1,
                            required: true,
                            builders: {
                                project: {
                                    title: 1,
                                    _url: 1
                                }
                            },
                            if: {
                                type: 'page'
                            }
                        },
                        customUrl: {
                            label: 'URL for custom link',
                            type: 'url',
                            required: true,
                            if: {
                                type: 'custom'
                            }
                        },
                        target: {
                            label: 'Open new browser tab?',
                            type: 'checkboxes',
                            choices: [
                                {
                                    label: 'Open in new tab',
                                    value: '_blank'
                                }
                            ]
                        },
                        children: {
                            label: 'Child items',
                            type: 'array',
                            titleField: 'label',
                            fields: {
                                add: {
                                    label: {
                                        label: 'Nav item label',
                                        type: 'string'
                                    },
                                    type: {
                                        label: 'Link type',
                                        type: 'select',
                                        choices: [
                                            {
                                                label: 'Page',
                                                value: 'page'
                                            },
                                            {
                                                label: 'Custom URL',
                                                value: 'custom'
                                            }
                                        ]
                                    },
                                    _page: {
                                        label: 'Page to link',
                                        type: 'relationship',
                                        withType: '@apostrophecms/page',
                                        max: 1,
                                        required: true,
                                        builders: {
                                            project: {
                                                title: 1,
                                                _url: 1
                                            }
                                        },
                                        if: {
                                            type: 'page'
                                        }
                                    },
                                    customUrl: {
                                        label: 'URL for custom link',
                                        type: 'url',
                                        required: true,
                                        if: {
                                            type: 'custom'
                                        }
                                    },
                                    target: {
                                        label: 'Open new browser tab?',
                                        type: 'checkboxes',
                                        choices: [
                                            {
                                                label: 'Open in new tab',
                                                value: '_blank'
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        group: {
            primaryNav: {
                label: 'Main menu',
                fields: [
                    'primaryNav'
                ]
            }
        }
    }
};