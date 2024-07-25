const fetch = require('node-fetch');
const https = require('https');

module.exports = {
  extend: '@apostrophecms/page-type',
  options: {
    label: 'Default Page'
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
            'offers': {},
            'html': {}
          }
        }
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
  },
  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          self.apos.app.post('/modules/default-page/report', async (req, res) => {
            const url = req.body.url;

            if (!url) {
              res.status(400).send({ error: 'URL is required' });
              return;
            }

            try {
              const agent = new https.Agent({
                rejectUnauthorized: false // Ignore SSL certificate errors
              });

              const response = await fetch(`https://seo.agenc.io/api/v1/reports?url=${encodeURIComponent(url)}`, {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer Ax0OELup0UMZbSyJmOYN4CiA51rjkI9E8Km0jnpXlJ4Dzgn6j3D6VVB7ssRbTJ6H2',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                agent
              });

              const data = await response.json();
              const result = data.data;
              const overallScore = Math.round(result.result);
              const contentLength = result.results.content_length.value;
              const readingTime = (contentLength / 230).toFixed(0);

              const responseData = `
                <div class="reading-time">
                  Время чтения: ${readingTime} минут-(ы)
                </div>
                <div class="overall-score">
                  Рейтинг: <span>${overallScore}</span>
                </div>
              `;

              res.send(responseData);
            } catch (error) {
              console.error('Error posting to external API:', error);
              res.status(500).send({ error: 'Error posting to external API' });
            }
          });
        }
      }
    };
  }
};
