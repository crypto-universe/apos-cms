// AI Assistant Frontend Module
export default () => {
  console.log('AI Assistant module loaded');

  // Инициализация AI помощника
  window.aiAssistant = {
    // Генерация текста
    async generateText(prompt, context = '', type = 'general') {
      try {
        const response = await fetch('/api/ai/generate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, context, type })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('AI generation failed:', error);
        throw error;
      }
    },

    // Улучшение текста
    async improveText(text, instructions = '') {
      try {
        const response = await fetch('/api/ai/improve-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, instructions })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('AI improvement failed:', error);
        throw error;
      }
    },

    // Получение SEO рекомендаций
    async getSeoSuggestions(title, content, keywords = []) {
      try {
        const response = await fetch('/api/ai/seo-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, content, keywords })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('SEO suggestions failed:', error);
        throw error;
      }
    },

    // Генерация alt текста для изображений
    async generateAltText(imageUrl, context = '') {
      try {
        const response = await fetch('/api/ai/generate-alt-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl, context })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Alt text generation failed:', error);
        throw error;
      }
    },

    // Показать AI панель
    showAiPanel(targetElement) {
      const existingPanel = document.querySelector('.ai-assistant-panel');
      if (existingPanel) {
        existingPanel.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'ai-assistant-panel';
      panel.innerHTML = `
        <div class="ai-panel-header">
          <h3>AI Помощник</h3>
          <button class="ai-panel-close" aria-label="Закрыть">×</button>
        </div>
        <div class="ai-panel-content">
          <div class="ai-panel-tabs">
            <button class="ai-tab active" data-tab="generate">Создать</button>
            <button class="ai-tab" data-tab="improve">Улучшить</button>
            <button class="ai-tab" data-tab="seo">SEO</button>
          </div>

          <div class="ai-tab-content active" data-content="generate">
            <label for="ai-prompt">Что вы хотите создать?</label>
            <textarea id="ai-prompt" placeholder="Опишите что вы хотите..." rows="3"></textarea>

            <label for="ai-context">Контекст (опционально):</label>
            <textarea id="ai-context" placeholder="Дополнительная информация..." rows="2"></textarea>

            <label for="ai-type">Тип контента:</label>
            <select id="ai-type">
              <option value="general">Общий</option>
              <option value="article">Статья</option>
              <option value="product">Описание продукта</option>
              <option value="blog">Блог пост</option>
            </select>

            <button class="ai-generate-btn">
              <span class="ai-btn-text">Сгенерировать</span>
              <span class="ai-btn-loading" style="display: none;">
                <span class="spinner"></span> Генерация...
              </span>
            </button>
          </div>

          <div class="ai-tab-content" data-content="improve">
            <label for="ai-improve-text">Текст для улучшения:</label>
            <textarea id="ai-improve-text" placeholder="Вставьте текст..." rows="5"></textarea>

            <label for="ai-instructions">Инструкции (опционально):</label>
            <textarea id="ai-instructions" placeholder="Как улучшить текст?" rows="2"></textarea>

            <button class="ai-improve-btn">
              <span class="ai-btn-text">Улучшить</span>
              <span class="ai-btn-loading" style="display: none;">
                <span class="spinner"></span> Обработка...
              </span>
            </button>
          </div>

          <div class="ai-tab-content" data-content="seo">
            <label for="ai-seo-title">Заголовок:</label>
            <input type="text" id="ai-seo-title" placeholder="Заголовок страницы">

            <label for="ai-seo-content">Контент:</label>
            <textarea id="ai-seo-content" placeholder="Текст страницы..." rows="4"></textarea>

            <label for="ai-seo-keywords">Ключевые слова (через запятую):</label>
            <input type="text" id="ai-seo-keywords" placeholder="ключ1, ключ2, ключ3">

            <button class="ai-seo-btn">
              <span class="ai-btn-text">Анализировать</span>
              <span class="ai-btn-loading" style="display: none;">
                <span class="spinner"></span> Анализ...
              </span>
            </button>
          </div>

          <div class="ai-result" style="display: none;">
            <div class="ai-result-header">
              <h4>Результат</h4>
              <button class="ai-copy-btn">Копировать</button>
            </div>
            <div class="ai-result-content"></div>
          </div>
        </div>
      `;

      document.body.appendChild(panel);

      // Event listeners
      panel.querySelector('.ai-panel-close').addEventListener('click', () => {
        panel.remove();
      });

      // Tab switching
      panel.querySelectorAll('.ai-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.dataset.tab;

          panel.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
          panel.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));

          tab.classList.add('active');
          panel.querySelector(`[data-content="${tabName}"]`).classList.add('active');

          // Hide result when switching tabs
          panel.querySelector('.ai-result').style.display = 'none';
        });
      });

      // Generate button
      panel.querySelector('.ai-generate-btn').addEventListener('click', async () => {
        const btn = panel.querySelector('.ai-generate-btn');
        const prompt = panel.querySelector('#ai-prompt').value;
        const context = panel.querySelector('#ai-context').value;
        const type = panel.querySelector('#ai-type').value;

        if (!prompt.trim()) {
          alert('Пожалуйста, введите описание');
          return;
        }

        btn.querySelector('.ai-btn-text').style.display = 'none';
        btn.querySelector('.ai-btn-loading').style.display = 'inline-flex';
        btn.disabled = true;

        try {
          const result = await window.aiAssistant.generateText(prompt, context, type);

          const resultDiv = panel.querySelector('.ai-result');
          const resultContent = panel.querySelector('.ai-result-content');

          resultContent.innerHTML = `
            <div class="ai-generated-text">${result.text.replace(/\n/g, '<br>')}</div>
            ${result.suggestions && result.suggestions.length > 0 ? `
              <div class="ai-suggestions">
                <h5>Рекомендации:</h5>
                <ul>
                  ${result.suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          `;

          resultDiv.style.display = 'block';
        } catch (error) {
          alert('Ошибка генерации: ' + error.message);
        } finally {
          btn.querySelector('.ai-btn-text').style.display = 'inline';
          btn.querySelector('.ai-btn-loading').style.display = 'none';
          btn.disabled = false;
        }
      });

      // Improve button
      panel.querySelector('.ai-improve-btn').addEventListener('click', async () => {
        const btn = panel.querySelector('.ai-improve-btn');
        const text = panel.querySelector('#ai-improve-text').value;
        const instructions = panel.querySelector('#ai-instructions').value;

        if (!text.trim()) {
          alert('Пожалуйста, введите текст для улучшения');
          return;
        }

        btn.querySelector('.ai-btn-text').style.display = 'none';
        btn.querySelector('.ai-btn-loading').style.display = 'inline-flex';
        btn.disabled = true;

        try {
          const result = await window.aiAssistant.improveText(text, instructions);

          const resultDiv = panel.querySelector('.ai-result');
          const resultContent = panel.querySelector('.ai-result-content');

          resultContent.innerHTML = `
            <div class="ai-generated-text">${result.improvedText.replace(/\n/g, '<br>')}</div>
            ${result.changes && result.changes.length > 0 ? `
              <div class="ai-changes">
                <h5>Внесенные изменения:</h5>
                <ul>
                  ${result.changes.map(c => `<li>${c}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          `;

          resultDiv.style.display = 'block';
        } catch (error) {
          alert('Ошибка улучшения: ' + error.message);
        } finally {
          btn.querySelector('.ai-btn-text').style.display = 'inline';
          btn.querySelector('.ai-btn-loading').style.display = 'none';
          btn.disabled = false;
        }
      });

      // SEO button
      panel.querySelector('.ai-seo-btn').addEventListener('click', async () => {
        const btn = panel.querySelector('.ai-seo-btn');
        const title = panel.querySelector('#ai-seo-title').value;
        const content = panel.querySelector('#ai-seo-content').value;
        const keywords = panel.querySelector('#ai-seo-keywords').value.split(',').map(k => k.trim());

        btn.querySelector('.ai-btn-text').style.display = 'none';
        btn.querySelector('.ai-btn-loading').style.display = 'inline-flex';
        btn.disabled = true;

        try {
          const result = await window.aiAssistant.getSeoSuggestions(title, content, keywords);

          const resultDiv = panel.querySelector('.ai-result');
          const resultContent = panel.querySelector('.ai-result-content');

          resultContent.innerHTML = `
            <div class="seo-analysis">
              <div class="seo-score">
                <h5>Заголовок (${result.suggestions.titleScore}/100)</h5>
                <ul>
                  ${result.suggestions.titleSuggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
              <div class="seo-score">
                <h5>Контент (${result.suggestions.contentScore}/100)</h5>
                <ul>
                  ${result.suggestions.contentSuggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
              ${result.suggestions.keywordDensity && result.suggestions.keywordDensity.length > 0 ? `
                <div class="keyword-density">
                  <h5>Плотность ключевых слов:</h5>
                  <ul>
                    ${result.suggestions.keywordDensity.map(k =>
                      `<li>${k.keyword}: ${k.density.toFixed(2)}% ${k.optimal ? '✓' : '✗'}</li>`
                    ).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `;

          resultDiv.style.display = 'block';
        } catch (error) {
          alert('Ошибка анализа: ' + error.message);
        } finally {
          btn.querySelector('.ai-btn-text').style.display = 'inline';
          btn.querySelector('.ai-btn-loading').style.display = 'none';
          btn.disabled = false;
        }
      });

      // Copy button
      panel.querySelector('.ai-copy-btn').addEventListener('click', () => {
        const text = panel.querySelector('.ai-generated-text')?.innerText || '';
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            const btn = panel.querySelector('.ai-copy-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Скопировано!';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 2000);
          });
        }
      });

      // Close on outside click
      panel.addEventListener('click', (e) => {
        if (e.target === panel) {
          panel.remove();
        }
      });
    }
  };

  // Добавляем кнопку AI помощника на страницу (если пользователь авторизован)
  if (document.body.classList.contains('apos-logged-in')) {
    const aiButton = document.createElement('button');
    aiButton.className = 'floating-ai-button';
    aiButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <path d="M9 10h.01M15 10h.01M9.5 14.5a3.5 3.5 0 0 0 5 0"></path>
      </svg>
      <span>AI</span>
    `;
    aiButton.title = 'Открыть AI помощника';

    aiButton.addEventListener('click', () => {
      window.aiAssistant.showAiPanel();
    });

    document.body.appendChild(aiButton);
  }
};
