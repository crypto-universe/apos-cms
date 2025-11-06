module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'schemaMarkup'
  },

  helpers(self) {
    return {
      // Генерация Organization schema
      getOrganizationSchema() {
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Техно-Агенсио',
          url: self.apos.baseUrl || 'https://new.agenc.io',
          logo: `${self.apos.baseUrl}/logo.png`,
          description: 'Веб-студия полного цикла. Создание сайтов, мобильных приложений и цифровых решений.',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'RU'
          },
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            availableLanguage: ['Russian', 'English']
          },
          sameAs: [
            // Добавьте социальные сети
            'https://facebook.com/your-page',
            'https://twitter.com/your-account',
            'https://linkedin.com/company/your-company'
          ]
        };
      },

      // Генерация Article schema
      getArticleSchema(piece) {
        if (!piece) return null;

        const schema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: piece.title,
          description: piece.blurb || piece.metaDescription || '',
          datePublished: piece.publishedAt || piece.createdAt,
          dateModified: piece.updatedAt || piece.createdAt,
          author: {
            '@type': 'Person',
            name: piece._author?.title || 'Техно-Агенсио'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Техно-Агенсио',
            logo: {
              '@type': 'ImageObject',
              url: `${self.apos.baseUrl}/logo.png`
            }
          }
        };

        // Добавляем изображение если есть
        if (piece.image && piece.image._urls) {
          schema.image = {
            '@type': 'ImageObject',
            url: piece.image._urls.full || piece.image._urls.original,
            width: piece.image.width || 1200,
            height: piece.image.height || 630
          };
        }

        // Добавляем URL статьи
        if (piece._url) {
          schema.url = self.apos.baseUrl + piece._url;
          schema.mainEntityOfPage = {
            '@type': 'WebPage',
            '@id': self.apos.baseUrl + piece._url
          };
        }

        return schema;
      },

      // Генерация BreadcrumbList schema
      getBreadcrumbSchema(page) {
        if (!page || !page._ancestors || page._ancestors.length === 0) {
          return null;
        }

        const items = [];
        let position = 1;

        // Добавляем главную страницу
        items.push({
          '@type': 'ListItem',
          position: position++,
          name: 'Главная',
          item: self.apos.baseUrl
        });

        // Добавляем предков
        page._ancestors.forEach(ancestor => {
          items.push({
            '@type': 'ListItem',
            position: position++,
            name: ancestor.title,
            item: self.apos.baseUrl + ancestor._url
          });
        });

        // Добавляем текущую страницу
        items.push({
          '@type': 'ListItem',
          position: position,
          name: page.title,
          item: self.apos.baseUrl + page._url
        });

        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items
        };
      },

      // Генерация FAQPage schema
      getFaqSchema(faqs) {
        if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
          return null;
        }

        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer
            }
          }))
        };
      },

      // Генерация WebSite schema (для поиска)
      getWebsiteSchema() {
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Техно-Агенсио',
          url: self.apos.baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${self.apos.baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        };
      },

      // Генерация Product schema (для услуг)
      getServiceSchema(service) {
        if (!service) return null;

        return {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.description,
          provider: {
            '@type': 'Organization',
            name: 'Техно-Агенсио'
          },
          areaServed: {
            '@type': 'Country',
            name: 'Russia'
          },
          serviceType: service.category || 'Web Development'
        };
      },

      // Генерация HowTo schema
      getHowToSchema(howTo) {
        if (!howTo || !howTo.steps || !Array.isArray(howTo.steps)) {
          return null;
        }

        return {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: howTo.title,
          description: howTo.description,
          step: howTo.steps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name || `Шаг ${index + 1}`,
            text: step.text,
            image: step.image ? step.image._urls?.full : undefined
          }))
        };
      },

      // Генерация Review/Rating schema
      getReviewSchema(reviews) {
        if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
          return null;
        }

        // Вычисляем среднюю оценку
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avgRating = totalRating / reviews.length;

        return {
          '@context': 'https://schema.org',
          '@type': 'AggregateRating',
          ratingValue: avgRating.toFixed(1),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1
        };
      },

      // Универсальный метод для получения всех schema для страницы
      getAllSchemas(data) {
        const schemas = [];

        // Всегда добавляем Organization
        schemas.push(this.getOrganizationSchema());

        // Всегда добавляем WebSite
        schemas.push(this.getWebsiteSchema());

        // Если это статья
        if (data.piece && data.piece.type === 'article') {
          const articleSchema = this.getArticleSchema(data.piece);
          if (articleSchema) schemas.push(articleSchema);
        }

        // Breadcrumbs для всех страниц
        if (data.page) {
          const breadcrumbSchema = this.getBreadcrumbSchema(data.page);
          if (breadcrumbSchema) schemas.push(breadcrumbSchema);
        }

        return schemas;
      },

      // Рендер JSON-LD script tag
      renderSchemaScript(schema) {
        if (!schema) return '';

        return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
      },

      // Рендер всех schema для страницы
      renderAllSchemas(data) {
        const schemas = this.getAllSchemas(data);
        return schemas.map(schema => this.renderSchemaScript(schema)).join('\n');
      }
    };
  }
};
