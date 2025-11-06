const Anthropic = require('@anthropic-ai/sdk');

module.exports = {
  extend: '@apostrophecms/widget-type',

  options: {
    alias: 'faqGenerator',
    label: 'FAQ Generator',
    icon: 'help-circle-icon'
  },

  fields: {
    add: {
      title: {
        type: 'string',
        label: 'FAQ Section Title',
        def: 'Часто задаваемые вопросы'
      },
      faqItems: {
        type: 'array',
        label: 'FAQ Items',
        titleField: 'question',
        fields: {
          add: {
            question: {
              type: 'string',
              label: 'Question',
              required: true,
              textarea: true
            },
            answer: {
              type: 'area',
              label: 'Answer',
              required: true,
              options: {
                widgets: {
                  '@apostrophecms/rich-text': {}
                }
              }
            }
          }
        }
      },
      autoGenerate: {
        type: 'boolean',
        label: 'Auto-generate from article content',
        def: false,
        help: 'Use AI to automatically generate FAQ from article'
      },
      maxQuestions: {
        type: 'integer',
        label: 'Maximum questions to generate',
        def: 5,
        min: 3,
        max: 15,
        if: {
          autoGenerate: true
        }
      },
      displayStyle: {
        type: 'select',
        label: 'Display Style',
        def: 'accordion',
        choices: [
          { label: 'Accordion (expandable)', value: 'accordion' },
          { label: 'List (all visible)', value: 'list' },
          { label: 'Cards (with icons)', value: 'cards' }
        ]
      },
      showSchema: {
        type: 'boolean',
        label: 'Include Schema.org markup',
        def: true,
        help: 'Enables rich snippets in Google search'
      }
    }
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
          // API endpoint для автогенерации FAQ
          self.apos.app.post('/api/faq/generate', async (req, res) => {
            try {
              const { articleId, maxQuestions = 5 } = req.body;

              if (!req.user) {
                return res.status(401).json({
                  error: 'Unauthorized - please login first'
                });
              }

              if (!articleId) {
                return res.status(400).json({
                  error: 'Article ID is required'
                });
              }

              const faqItems = await self.generateFAQFromArticle(articleId, maxQuestions);

              return res.json({
                success: true,
                faqItems: faqItems
              });

            } catch (error) {
              console.error('FAQ generation error:', error);
              return res.status(500).json({
                error: 'Failed to generate FAQ',
                message: error.message
              });
            }
          });

          // API endpoint для получения FAQ с HTMX
          self.apos.app.post('/api/faq/render', async (req, res) => {
            try {
              const {
                articleId,
                maxQuestions = 5,
                displayStyle = 'accordion',
                title = 'Часто задаваемые вопросы'
              } = req.body;

              const faqItems = await self.generateFAQFromArticle(articleId, maxQuestions);

              if (faqItems.length === 0) {
                return res.send(`
                  <div class="faq-generator__empty">
                    <p style="color: #999; font-style: italic;">FAQ не могут быть сгенерированы для этой статьи</p>
                  </div>
                `);
              }

              // Рендерим HTML
              let html = `<div class="faq-generator faq-generator--${displayStyle}">`;
              html += `<h2 class="faq-generator__title">${self.escapeHtml(title)}</h2>`;

              if (displayStyle === 'accordion') {
                html += self.renderAccordion(faqItems);
              } else if (displayStyle === 'cards') {
                html += self.renderCards(faqItems);
              } else {
                html += self.renderList(faqItems);
              }

              html += '</div>';

              return res.send(html);

            } catch (error) {
              console.error('FAQ render error:', error);
              return res.send(`
                <div class="faq-generator__error">
                  <p>❌ Произошла ошибка при генерации FAQ</p>
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
      // Генерация FAQ из статьи
      async generateFAQFromArticle(articleId, maxQuestions = 5) {
        try {
          // Получаем статью
          const article = await self.apos.doc.db.findOne({
            _id: articleId,
            type: 'article'
          });

          if (!article) {
            throw new Error('Article not found');
          }

          // Проверяем наличие API ключа
          const apiKey = process.env.ANTHROPIC_API_KEY;

          if (!apiKey) {
            console.warn('⚠️ ANTHROPIC_API_KEY not set, using fallback FAQ');
            return self.generateFallbackFAQ(article, maxQuestions);
          }

          // Извлекаем контент статьи
          const articleText = self.extractArticleText(article);

          if (articleText.length < 200) {
            console.warn('⚠️ Article too short for FAQ generation');
            return self.generateFallbackFAQ(article, maxQuestions);
          }

          // Генерируем FAQ через Claude
          const client = new Anthropic({ apiKey });

          const prompt = `Проанализируй следующую статью и создай список из ${maxQuestions} наиболее важных и полезных вопросов с ответами (FAQ).

СТАТЬЯ:
Заголовок: ${article.title}
${article.description ? `Описание: ${article.description}` : ''}

Контент:
${articleText}

Требования к FAQ:
1. Вопросы должны быть конкретными и релевантными статье
2. Вопросы должны отражать то, что читатели действительно могут спросить
3. Ответы должны быть краткими но информативными (2-4 предложения)
4. Используй информацию только из статьи
5. Вопросы на русском языке

Верни ответ строго в формате JSON:
{
  "faq": [
    {
      "question": "Вопрос 1?",
      "answer": "Ответ на вопрос 1."
    },
    {
      "question": "Вопрос 2?",
      "answer": "Ответ на вопрос 2."
    }
  ]
}

Верни только JSON без дополнительного текста.`;

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.5,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          });

          const responseText = response.content[0].text;

          // Парсим JSON из ответа
          let faqData;
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              faqData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('JSON not found in response');
            }
          } catch (parseError) {
            console.error('FAQ JSON parsing error:', parseError);
            console.log('Response text:', responseText);
            return self.generateFallbackFAQ(article, maxQuestions);
          }

          if (!faqData.faq || !Array.isArray(faqData.faq)) {
            console.error('Invalid FAQ structure:', faqData);
            return self.generateFallbackFAQ(article, maxQuestions);
          }

          return faqData.faq.slice(0, maxQuestions);

        } catch (error) {
          console.error('Generate FAQ error:', error);
          return self.generateFallbackFAQ({ title: 'Article' }, maxQuestions);
        }
      },

      // Fallback FAQ когда AI недоступен
      generateFallbackFAQ(article, maxQuestions) {
        const fallbackQuestions = [
          {
            question: `Что такое ${article.title}?`,
            answer: article.description || 'Подробную информацию вы можете найти в статье выше.'
          },
          {
            question: 'Для кого предназначена эта информация?',
            answer: 'Эта информация будет полезна всем, кто интересуется данной темой.'
          },
          {
            question: 'Где можно узнать больше?',
            answer: 'Дополнительную информацию вы можете найти в основном тексте статьи.'
          },
          {
            question: 'Как применить эту информацию на практике?',
            answer: 'Следуйте рекомендациям и советам, изложенным в статье.'
          },
          {
            question: 'Есть ли дополнительные ресурсы по теме?',
            answer: 'Вы можете найти связанные статьи в разделе рекомендаций на этой странице.'
          }
        ];

        return fallbackQuestions.slice(0, maxQuestions);
      },

      // Извлечь текст из статьи
      extractArticleText(article) {
        let text = '';

        // Добавляем заголовок
        text += article.title + '\n\n';

        // Добавляем описание
        if (article.description) {
          text += article.description + '\n\n';
        }

        // Извлекаем текст из content areas
        if (article.content && article.content.items) {
          article.content.items.forEach(item => {
            if (item.type === '@apostrophecms/rich-text' && item.content) {
              // Убираем HTML теги
              const plainText = item.content.replace(/<[^>]*>/g, ' ');
              text += plainText + '\n\n';
            }
          });
        }

        return text.substring(0, 5000); // Ограничиваем длину
      },

      // Render helpers
      renderAccordion(faqItems) {
        let html = '<div class="faq-accordion">';

        faqItems.forEach((item, index) => {
          const itemId = `faq-item-${index}`;

          html += `
            <div class="faq-accordion__item">
              <button class="faq-accordion__question"
                      aria-expanded="false"
                      aria-controls="${itemId}"
                      onclick="this.classList.toggle('active'); this.setAttribute('aria-expanded', this.classList.contains('active')); document.getElementById('${itemId}').classList.toggle('active');">
                <span class="faq-accordion__question-icon">❓</span>
                <span class="faq-accordion__question-text">${self.escapeHtml(item.question)}</span>
                <span class="faq-accordion__toggle">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
              <div class="faq-accordion__answer" id="${itemId}">
                <p>${self.escapeHtml(item.answer)}</p>
              </div>
            </div>
          `;
        });

        html += '</div>';

        return html;
      },

      renderCards(faqItems) {
        let html = '<div class="faq-cards">';

        faqItems.forEach(item => {
          html += `
            <div class="faq-card">
              <div class="faq-card__icon">❓</div>
              <div class="faq-card__content">
                <h3 class="faq-card__question">${self.escapeHtml(item.question)}</h3>
                <p class="faq-card__answer">${self.escapeHtml(item.answer)}</p>
              </div>
            </div>
          `;
        });

        html += '</div>';

        return html;
      },

      renderList(faqItems) {
        let html = '<dl class="faq-list">';

        faqItems.forEach(item => {
          html += `
            <div class="faq-list__item">
              <dt class="faq-list__question">
                <span class="faq-list__icon">Q:</span>
                ${self.escapeHtml(item.question)}
              </dt>
              <dd class="faq-list__answer">
                <span class="faq-list__icon">A:</span>
                ${self.escapeHtml(item.answer)}
              </dd>
            </div>
          `;
        });

        html += '</dl>';

        return html;
      },

      // Escape HTML
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
      }
    };
  }
};
