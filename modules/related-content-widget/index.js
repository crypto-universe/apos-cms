const Anthropic = require('@anthropic-ai/sdk');

module.exports = {
  extend: '@apostrophecms/widget-type',

  options: {
    alias: 'relatedContent',
    label: 'Related Content',
    icon: 'link-variant-icon'
  },

  fields: {
    add: {
      maxItems: {
        type: 'integer',
        label: 'Maximum number of related items',
        def: 3,
        min: 1,
        max: 10
      },
      displayStyle: {
        type: 'select',
        label: 'Display Style',
        def: 'cards',
        choices: [
          { label: 'Cards (with images)', value: 'cards' },
          { label: 'List (compact)', value: 'list' },
          { label: 'Grid (3 columns)', value: 'grid' }
        ]
      },
      showExcerpt: {
        type: 'boolean',
        label: 'Show excerpt',
        def: true
      },
      showImages: {
        type: 'boolean',
        label: 'Show featured images',
        def: true
      },
      useAI: {
        type: 'boolean',
        label: 'Use AI for smart matching',
        def: true,
        help: 'AI analyzes content semantically. Fallback to tag matching if disabled.'
      },
      manualSelection: {
        type: 'relationship',
        label: 'Manual selection (optional)',
        withType: 'article',
        max: 10,
        help: 'Leave empty for automatic AI-powered selection'
      }
    }
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          // API endpoint для получения похожего контента
          self.apos.app.post('/api/related-content/get', async (req, res) => {
            try {
              const {
                articleId,
                maxItems = 3,
                useAI = true,
                displayStyle = 'cards',
                showExcerpt = true,
                showImages = true
              } = req.body;

              if (!articleId) {
                return res.send(`
                  <div class="related-content-widget__error">
                    <p>❌ Не указан ID статьи</p>
                  </div>
                `);
              }

              const relatedArticles = await self.findRelatedContent(
                articleId,
                maxItems,
                useAI
              );

              if (relatedArticles.length === 0) {
                return res.send(`
                  <div class="related-content-widget__empty">
                    <p style="color: #999; font-style: italic;">Похожие статьи не найдены</p>
                  </div>
                `);
              }

              // Рендерим HTML для HTMX
              let html = '<h2 class="related-content-widget__title">Похожие статьи</h2>';

              if (displayStyle === 'cards') {
                html += '<div class="related-content-widget__cards">';
                relatedArticles.forEach(article => {
                  html += self.renderCard(article, showExcerpt, showImages);
                });
                html += '</div>';
              } else if (displayStyle === 'grid') {
                html += '<div class="related-content-widget__grid">';
                relatedArticles.forEach(article => {
                  html += self.renderGridItem(article, showExcerpt, showImages);
                });
                html += '</div>';
              } else {
                html += '<ul class="related-content-widget__list">';
                relatedArticles.forEach(article => {
                  html += self.renderListItem(article);
                });
                html += '</ul>';
              }

              return res.send(html);

            } catch (error) {
              console.error('Related content error:', error);
              return res.send(`
                <div class="related-content-widget__error">
                  <p>❌ Произошла ошибка при загрузке похожих статей</p>
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
      // Найти похожий контент
      async findRelatedContent(articleId, maxItems = 3, useAI = true) {
        try {
          // Получаем текущую статью
          const currentArticle = await self.apos.doc.db.findOne({
            _id: articleId,
            type: 'article'
          });

          if (!currentArticle) {
            throw new Error('Article not found');
          }

          let relatedArticles;

          if (useAI && process.env.ANTHROPIC_API_KEY) {
            // AI-powered поиск
            relatedArticles = await self.findRelatedWithAI(currentArticle, maxItems);
          } else {
            // Fallback на поиск по тегам и категориям
            relatedArticles = await self.findRelatedByTags(currentArticle, maxItems);
          }

          return relatedArticles;

        } catch (error) {
          console.error('Find related content error:', error);

          // Fallback: возвращаем последние статьи
          return await self.getLatestArticles(maxItems, articleId);
        }
      },

      // AI-powered поиск похожего контента
      async findRelatedWithAI(article, maxItems) {
        try {
          const apiKey = process.env.ANTHROPIC_API_KEY;

          if (!apiKey) {
            console.warn('⚠️ ANTHROPIC_API_KEY not set, using tag-based matching');
            return await self.findRelatedByTags(article, maxItems);
          }

          // Получаем все статьи для анализа
          const allArticles = await self.apos.doc.db.find({
            type: 'article',
            _id: { $ne: article._id },
            trash: { $ne: true }
          }).limit(50).toArray(); // Ограничиваем для производительности

          if (allArticles.length === 0) {
            return [];
          }

          // Создаем краткое описание статьи для AI
          const articleSummary = self.getArticleSummary(article);

          // Создаем список статей для анализа
          const articlesForAnalysis = allArticles.map((a, idx) => ({
            index: idx,
            id: a._id,
            title: a.title,
            summary: self.getArticleSummary(a)
          }));

          // Используем Claude для нахождения похожих статей
          const client = new Anthropic({ apiKey });

          const prompt = `Проанализируй следующую статью и найди ${maxItems} наиболее релевантных статей из списка.

ТЕКУЩАЯ СТАТЬЯ:
Заголовок: ${article.title}
Контент: ${articleSummary}

СПИСОК СТАТЕЙ ДЛЯ АНАЛИЗА:
${articlesForAnalysis.map((a, i) => `${i}. "${a.title}" - ${a.summary}`).join('\n')}

Верни только JSON массив с индексами ${maxItems} наиболее релевантных статей, отсортированных по релевантности (от наиболее к наименее релевантной).
Формат ответа: [0, 3, 7] (только числа - индексы из списка)

Критерии релевантности:
- Тематическая близость
- Схожесть тем и проблематики
- Дополняемость контента
- Интерес для читателей первой статьи`;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 256,
            temperature: 0.3,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          });

          const responseText = response.content[0].text;

          // Парсим JSON из ответа
          let indices;
          try {
            const jsonMatch = responseText.match(/\[[\d,\s]+\]/);
            if (jsonMatch) {
              indices = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('JSON not found in response');
            }
          } catch (parseError) {
            console.error('AI response parsing error:', parseError);
            // Fallback: используем первые N статей
            indices = Array.from({ length: Math.min(maxItems, allArticles.length) }, (_, i) => i);
          }

          // Получаем полные данные выбранных статей
          const selectedArticles = indices
            .slice(0, maxItems)
            .filter(idx => idx >= 0 && idx < allArticles.length)
            .map(idx => allArticles[idx]);

          // Обогащаем данные
          return await self.enrichArticlesData(selectedArticles);

        } catch (error) {
          console.error('AI-powered search error:', error);

          // Fallback на поиск по тегам
          return await self.findRelatedByTags(article, maxItems);
        }
      },

      // Поиск по тегам и категориям (fallback)
      async findRelatedByTags(article, maxItems) {
        try {
          const query = {
            type: 'article',
            _id: { $ne: article._id },
            trash: { $ne: true }
          };

          // Если есть теги, ищем по ним
          if (article.tags && article.tags.length > 0) {
            query.tags = { $in: article.tags };
          }

          const articles = await self.apos.doc.db
            .find(query)
            .limit(maxItems * 2) // Берем больше для разнообразия
            .toArray();

          // Сортируем по количеству совпадающих тегов
          if (article.tags && article.tags.length > 0) {
            articles.sort((a, b) => {
              const tagsA = a.tags || [];
              const tagsB = b.tags || [];

              const matchesA = tagsA.filter(tag => article.tags.includes(tag)).length;
              const matchesB = tagsB.filter(tag => article.tags.includes(tag)).length;

              return matchesB - matchesA;
            });
          }

          const selectedArticles = articles.slice(0, maxItems);

          return await self.enrichArticlesData(selectedArticles);

        } catch (error) {
          console.error('Tag-based search error:', error);
          return await self.getLatestArticles(maxItems, article._id);
        }
      },

      // Получить краткое описание статьи
      getArticleSummary(article) {
        let summary = '';

        // Берем заголовок
        summary += article.title || '';

        // Добавляем описание если есть
        if (article.description) {
          summary += '. ' + article.description;
        }

        // Берем начало контента
        if (article.content) {
          const textContent = self.extractTextFromContent(article.content);
          summary += '. ' + textContent.substring(0, 500);
        }

        // Добавляем теги
        if (article.tags && article.tags.length > 0) {
          summary += '. Теги: ' + article.tags.join(', ');
        }

        return summary.substring(0, 1000); // Ограничиваем длину
      },

      // Извлечь текст из content (Apostrophe areas)
      extractTextFromContent(content) {
        if (!content || !content.items) {
          return '';
        }

        let text = '';

        content.items.forEach(item => {
          if (item.type === '@apostrophecms/rich-text') {
            // Извлекаем текст из rich text (убираем HTML теги)
            if (item.content) {
              const plainText = item.content.replace(/<[^>]*>/g, ' ');
              text += plainText + ' ';
            }
          }
        });

        return text.trim();
      },

      // Обогатить данные статей (добавить изображения, URL и т.д.)
      async enrichArticlesData(articles) {
        return articles.map(article => {
          // Получаем URL статьи
          const url = article._url || `/articles/${article.slug}`;

          // Получаем изображение
          let imageUrl = null;
          if (article.featuredImage && article.featuredImage.length > 0) {
            const image = article.featuredImage[0];
            imageUrl = image._url || (image.attachment && image.attachment._url);
          }

          // Получаем excerpt
          let excerpt = article.description || '';
          if (!excerpt && article.content) {
            const textContent = self.extractTextFromContent(article.content);
            excerpt = textContent.substring(0, 200) + '...';
          }

          return {
            _id: article._id,
            title: article.title,
            url: url,
            excerpt: excerpt,
            imageUrl: imageUrl,
            publishedAt: article.publishedAt || article.createdAt,
            tags: article.tags || []
          };
        });
      },

      // Получить последние статьи (ultimate fallback)
      async getLatestArticles(maxItems, excludeId = null) {
        try {
          const query = {
            type: 'article',
            trash: { $ne: true }
          };

          if (excludeId) {
            query._id = { $ne: excludeId };
          }

          const articles = await self.apos.doc.db
            .find(query)
            .sort({ createdAt: -1 })
            .limit(maxItems)
            .toArray();

          return await self.enrichArticlesData(articles);

        } catch (error) {
          console.error('Get latest articles error:', error);
          return [];
        }
      },

      // Render helpers для HTML генерации
      renderCard(article, showExcerpt, showImages) {
        let html = '<article class="related-content-card">';

        // Изображение
        if (showImages && article.imageUrl) {
          html += `
            <div class="related-content-card__image">
              <a href="${article.url}">
                <img src="${article.imageUrl}"
                     alt="${self.escapeHtml(article.title)}"
                     loading="lazy">
              </a>
            </div>
          `;
        }

        html += '<div class="related-content-card__content">';

        // Заголовок
        html += `
          <h3 class="related-content-card__title">
            <a href="${article.url}">${self.escapeHtml(article.title)}</a>
          </h3>
        `;

        // Excerpt
        if (showExcerpt && article.excerpt) {
          html += `<p class="related-content-card__excerpt">${self.escapeHtml(article.excerpt)}</p>`;
        }

        // Meta
        html += '<div class="related-content-card__meta">';
        if (article.publishedAt) {
          const date = new Date(article.publishedAt);
          html += `<time datetime="${date.toISOString()}">${self.formatDate(date)}</time>`;
        }
        html += `<a href="${article.url}" class="related-content-card__link">Читать далее →</a>`;
        html += '</div>';

        html += '</div></article>';

        return html;
      },

      renderGridItem(article, showExcerpt, showImages) {
        let html = '<article class="related-content-grid-item">';

        // Изображение
        if (showImages && article.imageUrl) {
          html += `
            <div class="related-content-grid-item__image">
              <a href="${article.url}">
                <img src="${article.imageUrl}"
                     alt="${self.escapeHtml(article.title)}"
                     loading="lazy">
              </a>
            </div>
          `;
        }

        // Заголовок
        html += `
          <h3 class="related-content-grid-item__title">
            <a href="${article.url}">${self.escapeHtml(article.title)}</a>
          </h3>
        `;

        // Excerpt
        if (showExcerpt && article.excerpt) {
          const truncatedExcerpt = article.excerpt.substring(0, 100) + '...';
          html += `<p class="related-content-grid-item__excerpt">${self.escapeHtml(truncatedExcerpt)}</p>`;
        }

        html += '</article>';

        return html;
      },

      renderListItem(article) {
        let html = '<li class="related-content-list-item">';

        html += `
          <a href="${article.url}" class="related-content-list-item__link">
            <span class="related-content-list-item__icon">📄</span>
            <span class="related-content-list-item__title">${self.escapeHtml(article.title)}</span>
          </a>
        `;

        if (article.publishedAt) {
          const date = new Date(article.publishedAt);
          html += `<time class="related-content-list-item__date" datetime="${date.toISOString()}">${self.formatDate(date)}</time>`;
        }

        html += '</li>';

        return html;
      },

      // Вспомогательные методы
      escapeHtml(text) {
        if (!text) return '';

        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, char => map[char]);
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
