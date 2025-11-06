module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'breadcrumbs'
  },

  helpers(self) {
    return {
      // Получить breadcrumbs для страницы
      getBreadcrumbs(page, piece) {
        const items = [];

        // Главная страница
        items.push({
          title: 'Главная',
          url: '/',
          type: 'home',
          position: 1
        });

        // Добавляем предков страницы
        if (page && page._ancestors) {
          page._ancestors.forEach((ancestor, index) => {
            items.push({
              title: ancestor.title,
              url: ancestor._url,
              type: 'page',
              position: items.length + 1
            });
          });
        }

        // Добавляем текущую страницу
        if (page) {
          items.push({
            title: page.title,
            url: page._url,
            type: page.type,
            position: items.length + 1,
            current: !piece // Текущая, если нет piece
          });
        }

        // Если есть piece (статья), добавляем его
        if (piece) {
          items.push({
            title: piece.title,
            url: piece._url,
            type: piece.type,
            position: items.length + 1,
            current: true
          });
        }

        return items;
      },

      // Получить иконку для типа страницы
      getIconForType(type) {
        const icons = {
          home: '🏠',
          article: '📄',
          'article-page': '📰',
          'default-page': '📄',
          '@apostrophecms/home-page': '🏠'
        };
        return icons[type] || '📄';
      },

      // Рендер breadcrumbs HTML
      renderBreadcrumbs(page, piece, options = {}) {
        const items = this.getBreadcrumbs(page, piece);

        if (items.length <= 1) {
          return ''; // Не показываем breadcrumbs на главной
        }

        const showIcons = options.showIcons !== false;
        const showHome = options.showHome !== false;
        const separator = options.separator || '›';

        let html = '<nav class="breadcrumbs" aria-label="Навигация по сайту">';
        html += '<ol class="breadcrumbs__list" itemscope itemtype="https://schema.org/BreadcrumbList">';

        items.forEach((item, index) => {
          // Пропускаем главную, если showHome = false
          if (!showHome && item.type === 'home') {
            return;
          }

          const isLast = index === items.length - 1;
          const icon = showIcons ? this.getIconForType(item.type) : '';

          html += '<li class="breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';

          if (isLast) {
            // Последний элемент - не ссылка
            html += `<span class="breadcrumbs__current" aria-current="page">`;
            if (icon) html += `<span class="breadcrumbs__icon">${icon}</span>`;
            html += `<span itemprop="name">${item.title}</span>`;
            html += `</span>`;
          } else {
            // Остальные - ссылки
            html += `<a href="${item.url}" class="breadcrumbs__link" itemprop="item">`;
            if (icon) html += `<span class="breadcrumbs__icon">${icon}</span>`;
            html += `<span itemprop="name">${item.title}</span>`;
            html += `</a>`;

            // Разделитель
            html += `<span class="breadcrumbs__separator" aria-hidden="true">${separator}</span>`;
          }

          html += `<meta itemprop="position" content="${item.position}">`;
          html += '</li>';
        });

        html += '</ol>';
        html += '</nav>';

        return html;
      },

      // Упрощенная версия для использования в шаблонах
      render(data, options = {}) {
        return this.renderBreadcrumbs(data.page, data.piece, options);
      }
    };
  }
};
