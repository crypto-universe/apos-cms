module.exports = {
  extend: '@apostrophecms/piece-type',
  fields: {
    add: {
      blurb: {
        type: 'area',
        label: 'Blurb',
        help: 'A short summary.',
        options: {
          max: 1,
          widgets: {
            '@apostrophecms/rich-text': {
              toolbar: [ 'bold', 'italic' ]
            }
          }
        }
      },
      image: {
        label: 'Article photo',
        type: 'area',
        options: {
          max: 1,
          widgets: {
            '@apostrophecms/image': {}
          }
        }
      },
      _topics: {
        label: 'Article topics',
        type: 'relationship',
        withType: 'topic'
      },
      main: {
        label: 'Content',
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
                'image',
              ],
              typoConfig: {
                // Will no longer convert `(tm)` to ™
                trademark: false,
                // Will convert `->` to `=>`
                rightArrow: '=>'
              },
              smiliesConfig: {
                tone: 2
              },
              charCountConfig: {
                // How X!
                limit: 3000
              }
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
            'offers': {}
          }
        }
      }
    },
    group: {
      basics: {
        label: 'Basics',
        fields: [
          'title',
          'blurb',
          'image'
        ]
      },
      main: {
        label: 'Content',
        fields: [
          'main',
          '_topics'
        ]
      },
      conditions: {
        label: 'Conditions',
        fields: [
          'condition',
          'conditionalField'
        ]
      }
    }
  },
  columns: {
    add: {
      _topics: {
        label: 'Topics',
        component: 'DemoCellRelation'
      }
    }
  },
  components(self) {
    return {
      async recent(req, data) {
        return {
          articles: await self.find(req).limit(data.limit).sort({ createdAt: -1 }).toArray()
        };
      }
    };
  },
  init(self) {
    // blurb used to be a string; now we've decided it should be
    // a rich text widget. Make the conversion with a migration
    self.apos.migration.add('blurb', async () => {
      await self.apos.migration.eachDoc({
        type: 'article'
      }, 5, async (doc) => {
        if ((typeof doc.blurb) === 'string') {
          doc.blurb = self.apos.area.fromPlaintext(doc.blurb);
          return self.apos.doc.db.updateOne({
            _id: doc._id
          }, {
            $set: {
              blurb: doc.blurb
            }
          });
        }
      });
    });
  }
};
