module.exports = {
    fields: {
        add: {
            // Adding our array field, `primaryNav`
            primaryNav: {
                label: 'Primary site navigation',
                type: 'array',
                titleField: 'label',
                help: 'Add, remove, and reorder navigation items.',
                // The array schema for each item
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
                            // Only if it's a page link
                            if: {
                                type: 'page'
                            }
                        },
                        customUrl: {
                            label: 'URL for custom link',
                            type: 'url',
                            required: true,
                            // Only if it's a custom link
                            if: {
                                type: 'custom'
                            }
                        },
                        // A nice option to have the link open in a new tab
                        // Could use a boolean here
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
            },
            footerNav1: {
                label: 'Footer site navigation',
                type: 'array',
                titleField: 'label',
                fields: {
                    add: {
                        label: {
                            label: 'Nav item label',
                            type: 'string'
                        },
                        customUrl: {
                            label: 'URL for custom link',
                            type: 'url',
                            required: true
                        },
                        target: {
                            label: 'Will the link open a new browser tab?',
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
            },
            footerNav2: {
                label: 'Footer site navigation',
                type: 'array',
                titleField: 'label',
                fields: {
                    add: {
                        label: {
                            label: 'Nav item label',
                            type: 'string'
                        },
                        customUrl: {
                            label: 'URL for custom link',
                            type: 'url',
                            required: true
                        },
                        target: {
                            label: 'Will the link open a new browser tab?',
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
            },
            loyaltyArea: {
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
                                'orderedList'
                            ],
                            styles: [
                                {
                                    tag: 'p',
                                    label: 'Paragraph (P)'
                                },
                                {
                                    tag: 'h2',
                                    label: 'Heading 2 (H2)'
                                },
                                {
                                    tag: 'h3',
                                    label: 'Heading 3 (H3)'
                                },
                                {
                                    tag: 'h4',
                                    label: 'Heading 4 (H4)'
                                },
                                {
                                    tag: 'h5',
                                    label: 'Heading 5 (H5)'
                                },
                                {
                                    tag: 'h6',
                                    label: 'Heading 6 (H6)'
                                }
                            ]
                        }
                    }
                }
            },
            loyaltyAppStore: {
                label: 'App Store URL',
                type: 'string'
            },
            loyaltyPlayMarket: {
                label: 'PlayMarket URL',
                type: 'string'
            },
            loyaltyQRLinkLabel: {
                label: 'Loyalty Label QR',
                type: 'string'
            },
            loyaltyQRLink: {
                label: 'Loyalty Follow Link',
                type: 'string'
            }
        },
        group: {
            primaryNav: {
                label: 'Main menu',
                fields: [
                    'primaryNav'
                ]
            },
            footerNav1: {
                label: 'Footer menu',
                fields: [
                    'footerNav1'
                ]
            },
            footerNav2: {
                label: 'Footer menu 2',
                fields: [
                    'footerNav2'
                ]
            }
        }
    }
};
