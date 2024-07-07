const fetch = require('node-fetch');

module.exports = {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'Article',
    pluralLabel: 'Articles',
    perPage: 100,
    publicApiProjection: {
      title: 1,
      _url: 1,
      image: 1,
      _topics: 1
    }
  },
  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          self.apos.app.get('/article/relation', async (req, res) => {
            let articles = [];
            const searchTopic = req.query.topic || 'Develop';

            try {
              const response = await fetch(`https://new.agenc.io/api/v1/article`);
              const data = await response.json();
              articles = data.results;

              articles = articles.filter(article => {
                return article._topics && article._topics.some(topic => topic.title.includes(searchTopic));
              });
            } catch (error) {
              console.error('Error fetching articles:', error);
            }

            const rows = articles.map(article => `
              <tr>
                <td>${req.query.page || 1}</td>
                <td><a href="${article._url || `https://new.agenc.io/articles/${article.slug}`}">Link</a></td>
                <td>${article.title}</td>
                <td>${article.slug}</td>
                <td>${new Date(article.createdAt || article.cacheInvalidatedAt).toLocaleDateString()}</td>
              </tr>
            `).join('');

            res.send(rows);
          });
        }
      }
    };
  },
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
              toolbar: ['bold', 'italic']
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
                  tag: 'h1',
                  label: 'Heading 1 (H1)'
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
              ],
              insert: [
                'table',
                'image',
              ],
              typoConfig: {
                trademark: false,
                rightArrow: '=>'
              },
              smiliesConfig: {
                tone: 2
              },
              charCountConfig: {
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
