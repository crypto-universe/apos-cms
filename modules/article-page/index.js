const fetch = require('node-fetch');
const https = require('https');

module.exports = {
  extend: '@apostrophecms/piece-page-type',
  options: {
    label: 'Article Index Page',
    pluralLabel: 'Article Index Pages'
  },
  fields: {
    add: {
      intro: {
        type: 'area',
        options: {
          limit: 1,
          widgets: {
            '@apostrophecms/rich-text': {
              toolbar: [
                'styles',
                'bold',
                'italic',
                'link',
                'blockquote'
              ]
            }
          }
        }
      }
    }
  },
  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          self.apos.app.post('/modules/article-page/report', async (req, res) => {
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

              const failedResults = Object.entries(result.results).filter(([key, value]) => value.passed === false);

              const rows = failedResults.map(([key, value]) => `
                <tr>
                  <td>${key}</td>
                  <td>${value.importance}</td>
                  <td>${value.errors ? JSON.stringify(value.errors) : 'N/A'}</td>
                </tr>
              `).join('');

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
