const Anthropic = require('@anthropic-ai/sdk');

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'intelligentSearch'
  },

  helpers(self) {
    return {
      // Render search form in templates
      renderSearchForm() {
        return self.apos.template.safe(
          self.render(require, 'search-form', {})
        );
      }
    };
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          // API endpoint для умного поиска
          self.apos.app.post('/api/search/intelligent', async (req, res) => {
            try {
              const { query, page = 1, limit = 10 } = req.body;

              if (!query || query.trim().length < 2) {
                return res.json({
                  success: false,
                  results: [],
                  suggestions: [],
                  corrected: null
                });
              }

              // Выполняем поиск
              const searchResults = await self.performSearch(query, page, limit);

              // Генерируем AI подсказки если есть API ключ
              let aiSuggestions = [];
              let correctedQuery = null;

              if (process.env.ANTHROPIC_API_KEY) {
                const aiEnhancements = await self.getAIEnhancements(query, searchResults.results);
                aiSuggestions = aiEnhancements.suggestions;
                correctedQuery = aiEnhancements.correctedQuery;
              }

              return res.json({
                success: true,
                query: query,
                correctedQuery: correctedQuery,
                results: searchResults.results,
                total: searchResults.total,
                page: page,
                suggestions: aiSuggestions,
                relatedSearches: searchResults.relatedSearches
              });

            } catch (error) {
              console.error('Intelligent search error:', error);
              return res.status(500).json({
                success: false,
                error: 'Search failed',
                message: error.message
              });
            }
          });

          // API endpoint для живых подсказок (HTMX)
          self.apos.app.post('/api/search/suggestions', async (req, res) => {
            try {
              const { query } = req.body;

              if (!query || query.trim().length < 2) {
                return res.send('');
              }

              const suggestions = await self.getSuggestions(query);

              if (suggestions.length === 0) {
                return res.send(`
                  <div class="search-suggestions__empty">
                    <p>Начните вводить для получения подсказок...</p>
                  </div>
                `);
              }

              let html = '<ul class="search-suggestions__list">';

              suggestions.forEach(suggestion => {
                html += `
                  <li class="search-suggestions__item">
                    <button type="button"
                            class="search-suggestions__button"
                            onclick="document.getElementById('search-input').value='${self.escapeHtml(suggestion.text)}'; document.querySelector('.search-form').requestSubmit();">
                      <span class="search-suggestions__icon">${suggestion.icon}</span>
                      <span class="search-suggestions__text">${self.highlightMatch(suggestion.text, query)}</span>
                      ${suggestion.count ? `<span class="search-suggestions__count">${suggestion.count}</span>` : ''}
                    </button>
                  </li>
                `;
              });

              html += '</ul>';

              return res.send(html);

            } catch (error) {
              console.error('Suggestions error:', error);
              return res.send('');
            }
          });

          // API endpoint для рендера результатов (HTMX)
          self.apos.app.post('/api/search/results', async (req, res) => {
            try {
              const { query, page = 1 } = req.body;

              if (!query || query.trim().length < 2) {
                return res.send(`
                  <div class="search-results__empty">
                    <p>Введите поисковый запрос</p>
                  </div>
                `);
              }

              const searchResults = await self.performSearch(query, page, 10);

              if (searchResults.results.length === 0) {
                let html = `
                  <div class="search-results__empty">
                    <h3>По запросу "${self.escapeHtml(query)}" ничего не найдено</h3>
                    <p>Попробуйте изменить запрос или воспользуйтесь подсказками</p>
                  </div>
                `;

                // Показываем похожие поисковые запросы
                if (searchResults.relatedSearches.length > 0) {
                  html += '<div class="search-results__related">';
                  html += '<h4>Возможно, вы искали:</h4>';
                  html += '<ul>';
                  searchResults.relatedSearches.forEach(related => {
                    html += `
                      <li>
                        <button type="button"
                                onclick="document.getElementById('search-input').value='${self.escapeHtml(related)}'; document.querySelector('.search-form').requestSubmit();">
                          ${self.escapeHtml(related)}
                        </button>
                      </li>
                    `;
                  });
                  html += '</ul></div>';
                }

                return res.send(html);
              }

              let html = `
                <div class="search-results__header">
                  <p>Найдено результатов: <strong>${searchResults.total}</strong></p>
                </div>
              `;

              html += '<div class="search-results__list">';

              searchResults.results.forEach(result => {
                html += self.renderSearchResult(result, query);
              });

              html += '</div>';

              // Pagination
              if (searchResults.total > 10) {
                html += self.renderPagination(query, page, Math.ceil(searchResults.total / 10));
              }

              return res.send(html);

            } catch (error) {
              console.error('Search results error:', error);
              return res.send(`
                <div class="search-results__error">
                  <p>❌ Произошла ошибка при поиске</p>
                </div>
              `);
            }
          });
        }
      }
    };
  },

  methods(self) {
    return {
      // Выполнить поиск
      async performSearch(query, page = 1, limit = 10) {
        try {
          const skip = (page - 1) * limit;
          const searchTerm = query.trim();

          // Создаем регулярное выражение для поиска
          const regex = new RegExp(searchTerm.split(/\s+/).join('|'), 'i');

          // Поиск по статьям
          const articles = await self.apos.doc.db.find({
            type: 'article',
            trash: { $ne: true },
            $or: [
              { title: regex },
              { description: regex },
              { tags: { $in: [regex] } }
            ]
          })
          .skip(skip)
          .limit(limit)
          .toArray();

          const total = await self.apos.doc.db.countDocuments({
            type: 'article',
            trash: { $ne: true },
            $or: [
              { title: regex },
              { description: regex },
              { tags: { $in: [regex] } }
            ]
          });

          // Обогащаем результаты
          const results = articles.map(article => ({
            _id: article._id,
            title: article.title,
            description: article.description || '',
            url: article._url || `/articles/${article.slug}`,
            type: 'article',
            icon: '📄',
            publishedAt: article.publishedAt || article.createdAt,
            tags: article.tags || []
          }));

          // Генерируем похожие поисковые запросы
          const relatedSearches = await self.getRelatedSearches(searchTerm, articles);

          return {
            results,
            total,
            relatedSearches
          };

        } catch (error) {
          console.error('Perform search error:', error);
          return {
            results: [],
            total: 0,
            relatedSearches: []
          };
        }
      },

      // Получить подсказки для поиска
      async getSuggestions(query) {
        try {
          const searchTerm = query.trim().toLowerCase();
          const regex = new RegExp('^' + searchTerm, 'i');

          // Ищем статьи, начинающиеся с этого запроса
          const articles = await self.apos.doc.db.find({
            type: 'article',
            trash: { $ne: true },
            title: regex
          })
          .limit(5)
          .toArray();

          const suggestions = articles.map(article => ({
            text: article.title,
            icon: '📄',
            count: null
          }));

          // Добавляем популярные теги
          const tags = await self.apos.doc.db.distinct('tags', {
            type: 'article',
            trash: { $ne: true },
            tags: regex
          });

          tags.slice(0, 3).forEach(tag => {
            suggestions.push({
              text: tag,
              icon: '🏷️',
              count: null
            });
          });

          return suggestions;

        } catch (error) {
          console.error('Get suggestions error:', error);
          return [];
        }
      },

      // Получить AI улучшения для поиска
      async getAIEnhancements(query, results) {
        try {
          const apiKey = process.env.ANTHROPIC_API_KEY;

          if (!apiKey) {
            return {
              suggestions: [],
              correctedQuery: null
            };
          }

          const client = new Anthropic({ apiKey });

          const prompt = `Проанализируй поисковый запрос и помоги улучшить поиск.

ПОИСКОВЫЙ ЗАПРОС: "${query}"

НАЙДЕННЫЕ РЕЗУЛЬТАТЫ (${results.length} шт.):
${results.slice(0, 5).map(r => `- ${r.title}`).join('\n')}

Задачи:
1. Если в запросе есть ошибки или опечатки, предложи исправленный вариант
2. Предложи 3-5 связанных поисковых запросов, которые могут быть интересны пользователю
3. Учитывай найденные результаты

Верни ответ строго в формате JSON:
{
  "correctedQuery": "исправленный запрос" или null если исправлений нет,
  "suggestions": [
    "похожий запрос 1",
    "похожий запрос 2",
    "похожий запрос 3"
  ]
}

Верни только JSON без дополнительного текста.`;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 512,
            temperature: 0.3,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          });

          const responseText = response.content[0].text;

          let aiData;
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('JSON not found');
            }
          } catch (parseError) {
            console.error('AI response parsing error:', parseError);
            return {
              suggestions: [],
              correctedQuery: null
            };
          }

          return {
            suggestions: aiData.suggestions || [],
            correctedQuery: aiData.correctedQuery
          };

        } catch (error) {
          console.error('AI enhancements error:', error);
          return {
            suggestions: [],
            correctedQuery: null
          };
        }
      },

      // Получить похожие поисковые запросы
      async getRelatedSearches(query, results) {
        try {
          const relatedSearches = [];

          // Извлекаем теги из найденных результатов
          const allTags = new Set();
          results.forEach(result => {
            if (result.tags) {
              result.tags.forEach(tag => allTags.add(tag));
            }
          });

          // Берем первые 3-5 тегов
          const tags = Array.from(allTags).slice(0, 5);

          return tags.filter(tag => tag.toLowerCase() !== query.toLowerCase());

        } catch (error) {
          console.error('Get related searches error:', error);
          return [];
        }
      },

      // Render helpers
      renderSearchResult(result, query) {
        let html = '<article class="search-result">';

        html += `
          <div class="search-result__icon">${result.icon}</div>
          <div class="search-result__content">
            <h3 class="search-result__title">
              <a href="${result.url}">${self.highlightMatch(result.title, query)}</a>
            </h3>
        `;

        if (result.description) {
          html += `<p class="search-result__description">${self.highlightMatch(result.description, query)}</p>`;
        }

        html += '<div class="search-result__meta">';

        if (result.publishedAt) {
          const date = new Date(result.publishedAt);
          html += `<time datetime="${date.toISOString()}">${self.formatDate(date)}</time>`;
        }

        if (result.tags && result.tags.length > 0) {
          html += '<div class="search-result__tags">';
          result.tags.slice(0, 3).forEach(tag => {
            html += `<span class="search-result__tag">${self.escapeHtml(tag)}</span>`;
          });
          html += '</div>';
        }

        html += '</div></div></article>';

        return html;
      },

      renderPagination(query, currentPage, totalPages) {
        let html = '<div class="search-pagination">';

        // Previous button
        if (currentPage > 1) {
          html += `
            <button type="button"
                    class="search-pagination__button"
                    hx-post="/api/search/results"
                    hx-vals='{"query": "${self.escapeHtml(query)}", "page": ${currentPage - 1}}'
                    hx-target="#search-results"
                    hx-swap="innerHTML">
              ← Назад
            </button>
          `;
        }

        html += `<span class="search-pagination__current">Страница ${currentPage} из ${totalPages}</span>`;

        // Next button
        if (currentPage < totalPages) {
          html += `
            <button type="button"
                    class="search-pagination__button"
                    hx-post="/api/search/results"
                    hx-vals='{"query": "${self.escapeHtml(query)}", "page": ${currentPage + 1}}'
                    hx-target="#search-results"
                    hx-swap="innerHTML">
              Далее →
            </button>
          `;
        }

        html += '</div>';

        return html;
      },

      // Вспомогательные методы
      highlightMatch(text, query) {
        if (!text || !query) return self.escapeHtml(text);

        const escaped = self.escapeHtml(text);
        const words = query.trim().split(/\s+/);

        let highlighted = escaped;

        words.forEach(word => {
          const regex = new RegExp(`(${word})`, 'gi');
          highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        });

        return highlighted;
      },

      escapeHtml(text) {
        if (!text) return '';

        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };

        return text.toString().replace(/[&<>"']/g, char => map[char]);
      },

      formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
      }
    };
  }
};
