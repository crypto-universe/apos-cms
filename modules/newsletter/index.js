const crypto = require('crypto');

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'newsletter'
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        async addRoutes() {
          // Создаем индекс для email поля при старте приложения
          try {
            await self.apos.db.collection('newsletterSubscribers').createIndex(
              { email: 1 },
              { unique: true }
            );
            console.log('✅ Newsletter module: MongoDB index created');
          } catch (error) {
            if (error.code !== 85) { // Игнорируем ошибку если индекс уже существует
              console.error('Newsletter index creation error:', error);
            }
          }

          // API endpoint для подписки на рассылку
          self.apos.app.post('/api/newsletter/subscribe', async (req, res) => {
            try {
              const { email } = req.body;

              // Валидация email
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!email || !emailRegex.test(email)) {
                return res.send(`
                  <div class="subscription-message error">
                    <span>❌</span> Пожалуйста, введите корректный email адрес
                  </div>
                `);
              }

              // Проверка на существование подписки
              const existingSubscription = await self.findSubscriber(email);
              if (existingSubscription) {
                return res.send(`
                  <div class="subscription-message info">
                    <span>ℹ️</span> Этот email уже подписан на рассылку
                  </div>
                `);
              }

              // Сохранение подписчика
              await self.saveSubscriber(email);

              // Отправка приветственного письма (опционально)
              try {
                await self.sendWelcomeEmail(email);
              } catch (emailError) {
                console.error('Welcome email error:', emailError);
                // Не прерываем процесс если письмо не отправилось
              }

              return res.send(`
                <div class="subscription-message success">
                  <span>✅</span> Спасибо за подписку! Мы отправим письмо на ${email}
                </div>
              `);

            } catch (error) {
              console.error('Newsletter subscription error:', error);
              return res.send(`
                <div class="subscription-message error">
                  <span>❌</span> Произошла ошибка. Попробуйте позже
                </div>
              `);
            }
          });

          // API endpoint для отписки
          self.apos.app.get('/api/newsletter/unsubscribe', async (req, res) => {
            try {
              const { email, token } = req.query;

              // Проверка токена безопасности
              const isValid = await self.validateUnsubscribeToken(email, token);
              if (!isValid) {
                return res.status(400).send(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Ошибка отписки</title>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                        text-align: center;
                      }
                      .message {
                        background: #fee;
                        padding: 30px;
                        border-radius: 8px;
                        border: 2px solid #fcc;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="message">
                      <h1>❌ Неверная ссылка</h1>
                      <p>Ссылка для отписки недействительна или устарела.</p>
                    </div>
                  </body>
                  </html>
                `);
              }

              await self.removeSubscriber(email);

              return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Отписка от рассылки</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      max-width: 600px;
                      margin: 50px auto;
                      padding: 20px;
                      text-align: center;
                    }
                    .message {
                      background: #f0f0f0;
                      padding: 30px;
                      border-radius: 8px;
                    }
                    .success {
                      color: #0c0;
                      font-size: 48px;
                      margin-bottom: 20px;
                    }
                  </style>
                </head>
                <body>
                  <div class="message">
                    <div class="success">✅</div>
                    <h1>Вы успешно отписались</h1>
                    <p>Адрес ${email} был удален из списка рассылки.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                      Нам жаль, что вы уходите. Мы всегда рады видеть вас снова!
                    </p>
                  </div>
                </body>
                </html>
              `);

            } catch (error) {
              console.error('Unsubscribe error:', error);
              return res.status(500).send(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Ошибка</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      max-width: 600px;
                      margin: 50px auto;
                      padding: 20px;
                      text-align: center;
                    }
                    .message {
                      background: #fee;
                      padding: 30px;
                      border-radius: 8px;
                    }
                  </style>
                </head>
                <body>
                  <div class="message">
                    <h1>Произошла ошибка</h1>
                    <p>Пожалуйста, попробуйте позже или свяжитесь с нами.</p>
                  </div>
                </body>
                </html>
              `);
            }
          });

          // API endpoint для получения статистики (только для админов)
          self.apos.app.get('/api/newsletter/stats', async (req, res) => {
            try {
              // Проверка авторизации
              if (!req.user || !req.user.role === 'admin') {
                return res.status(401).json({
                  error: 'Unauthorized'
                });
              }

              const stats = await self.getStats();

              return res.json({
                success: true,
                stats: stats
              });

            } catch (error) {
              console.error('Newsletter stats error:', error);
              return res.status(500).json({
                error: 'Failed to get stats',
                message: error.message
              });
            }
          });
        }
      }
    };
  },

  methods(self) {
    return {
      // Найти подписчика по email
      async findSubscriber(email) {
        try {
          return await self.apos.db.collection('newsletterSubscribers').findOne({
            email: email.toLowerCase()
          });
        } catch (error) {
          console.error('Find subscriber error:', error);
          throw error;
        }
      },

      // Сохранить подписчика
      async saveSubscriber(email) {
        try {
          const subscriber = {
            email: email.toLowerCase(),
            subscribedAt: new Date(),
            status: 'active',
            source: 'website-footer',
            ipAddress: null, // Можно добавить req.ip если нужно
            userAgent: null, // Можно добавить req.headers['user-agent']
            confirmedAt: null, // Для double opt-in если нужно
            metadata: {}
          };

          await self.apos.db.collection('newsletterSubscribers').insertOne(subscriber);

          console.log(`✅ New newsletter subscriber: ${email}`);

          return subscriber;

        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error - подписчик уже существует
            console.log(`ℹ️ Subscriber already exists: ${email}`);
            return null;
          }

          console.error('Save subscriber error:', error);
          throw error;
        }
      },

      // Удалить подписчика
      async removeSubscriber(email) {
        try {
          const result = await self.apos.db.collection('newsletterSubscribers').deleteOne({
            email: email.toLowerCase()
          });

          if (result.deletedCount > 0) {
            console.log(`✅ Subscriber removed: ${email}`);
          } else {
            console.log(`ℹ️ Subscriber not found: ${email}`);
          }

          return result;

        } catch (error) {
          console.error('Remove subscriber error:', error);
          throw error;
        }
      },

      // Проверить токен отписки
      async validateUnsubscribeToken(email, token) {
        try {
          if (!email || !token) {
            return false;
          }

          const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';

          const expectedToken = crypto
            .createHash('sha256')
            .update(email.toLowerCase() + secret)
            .digest('hex');

          return token === expectedToken;

        } catch (error) {
          console.error('Validate token error:', error);
          return false;
        }
      },

      // Сгенерировать токен отписки
      generateUnsubscribeToken(email) {
        const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';

        return crypto
          .createHash('sha256')
          .update(email.toLowerCase() + secret)
          .digest('hex');
      },

      // Отправить приветственное письмо
      async sendWelcomeEmail(email) {
        // Проверяем наличие SMTP конфигурации
        const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER;

        if (!smtpConfigured) {
          console.log(`⚠️ SMTP не настроен. Email не отправлен: ${email}`);
          console.log('ℹ️ Настройте SMTP_HOST, SMTP_USER, SMTP_PASS в .env для отправки писем');
          return;
        }

        try {
          const nodemailer = require('nodemailer');

          // Создаем транспорт для отправки
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true для 465, false для других портов
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          // Генерируем токен для отписки
          const unsubscribeToken = self.generateUnsubscribeToken(email);
          const unsubscribeUrl = `${self.apos.baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

          // Отправляем письмо
          const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Техно-Агенсио" <noreply@agenc.io>',
            to: email,
            subject: 'Добро пожаловать в нашу рассылку! 🎉',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                  }
                  .content {
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                  }
                  .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                  }
                  .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>🎉 Добро пожаловать!</h1>
                </div>
                <div class="content">
                  <h2>Спасибо за подписку, ${email}!</h2>

                  <p>Мы рады приветствовать вас в нашей рассылке. Теперь вы будете получать:</p>

                  <ul>
                    <li>✨ Последние новости и обновления</li>
                    <li>🚀 Эксклюзивные предложения</li>
                    <li>💡 Полезные советы и материалы</li>
                    <li>🎁 Специальные бонусы для подписчиков</li>
                  </ul>

                  <p>Следите за обновлениями в вашей почте!</p>

                  <a href="${self.apos.baseUrl}" class="button">Посетить наш сайт</a>

                  <div class="footer">
                    <p>Вы получили это письмо, потому что подписались на рассылку на ${self.apos.baseUrl}</p>
                    <p>
                      <a href="${unsubscribeUrl}" style="color: #666;">Отписаться от рассылки</a>
                    </p>
                    <p>© 2024 Техно-Агенсио. Все права защищены.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          });

          console.log(`✅ Welcome email sent to ${email}. Message ID: ${info.messageId}`);

          return info;

        } catch (error) {
          console.error('Send email error:', error);
          // Не бросаем ошибку, чтобы не прерывать процесс подписки
          console.error(`❌ Failed to send welcome email to ${email}`);
        }
      },

      // Получить статистику подписчиков
      async getStats() {
        try {
          const collection = self.apos.db.collection('newsletterSubscribers');

          const total = await collection.countDocuments({ status: 'active' });
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todayCount = await collection.countDocuments({
            status: 'active',
            subscribedAt: { $gte: today }
          });

          const last7Days = new Date(today);
          last7Days.setDate(last7Days.getDate() - 7);

          const weekCount = await collection.countDocuments({
            status: 'active',
            subscribedAt: { $gte: last7Days }
          });

          const last30Days = new Date(today);
          last30Days.setDate(last30Days.getDate() - 30);

          const monthCount = await collection.countDocuments({
            status: 'active',
            subscribedAt: { $gte: last30Days }
          });

          // Статистика по источникам
          const sourceStats = await collection.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]).toArray();

          return {
            total: total,
            today: todayCount,
            last7Days: weekCount,
            last30Days: monthCount,
            bySources: sourceStats.map(s => ({
              source: s._id,
              count: s.count
            }))
          };

        } catch (error) {
          console.error('Get stats error:', error);
          throw error;
        }
      },

      // Экспорт подписчиков в CSV (для админов)
      async exportSubscribers() {
        try {
          const subscribers = await self.apos.db.collection('newsletterSubscribers')
            .find({ status: 'active' })
            .sort({ subscribedAt: -1 })
            .toArray();

          // Простой CSV формат
          let csv = 'Email,Subscribed At,Source\n';
          subscribers.forEach(sub => {
            csv += `${sub.email},${sub.subscribedAt.toISOString()},${sub.source}\n`;
          });

          return csv;

        } catch (error) {
          console.error('Export subscribers error:', error);
          throw error;
        }
      }
    };
  }
};
