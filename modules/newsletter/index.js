module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'newsletter'
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        addRoutes() {
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
              // await self.sendWelcomeEmail(email);

              return res.send(`
                <div class="subscription-message success">
                  <span>✅</span> Спасибо за подписку! Мы отправили письмо на ${email}
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
                return res.status(400).send('Invalid unsubscribe link');
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
                  </style>
                </head>
                <body>
                  <div class="message">
                    <h1>Вы успешно отписались</h1>
                    <p>Адрес ${email} был удален из списка рассылки.</p>
                  </div>
                </body>
                </html>
              `);

            } catch (error) {
              console.error('Unsubscribe error:', error);
              return res.status(500).send('Error processing unsubscribe request');
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
        // TODO: Реализовать поиск в базе данных
        // Используйте MongoDB для хранения подписчиков
        /*
        return await self.apos.db.collection('newsletterSubscribers').findOne({
          email: email.toLowerCase()
        });
        */
        return null; // Демо: всегда возвращаем null
      },

      // Сохранить подписчика
      async saveSubscriber(email) {
        // TODO: Реализовать сохранение в базе данных
        /*
        await self.apos.db.collection('newsletterSubscribers').insertOne({
          email: email.toLowerCase(),
          subscribedAt: new Date(),
          status: 'active',
          source: 'website-footer'
        });
        */

        // Для демо просто логируем
        console.log(`New subscriber: ${email}`);
      },

      // Удалить подписчика
      async removeSubscriber(email) {
        // TODO: Реализовать удаление из базы данных
        /*
        await self.apos.db.collection('newsletterSubscribers').deleteOne({
          email: email.toLowerCase()
        });
        */

        console.log(`Subscriber removed: ${email}`);
      },

      // Проверить токен отписки
      async validateUnsubscribeToken(email, token) {
        // TODO: Реализовать проверку токена
        // Токен должен быть сгенерирован при отправке письма
        /*
        const crypto = require('crypto');
        const expectedToken = crypto
          .createHash('sha256')
          .update(email + process.env.UNSUBSCRIBE_SECRET)
          .digest('hex');

        return token === expectedToken;
        */

        return true; // Демо: всегда валидный
      },

      // Отправить приветственное письмо
      async sendWelcomeEmail(email) {
        // TODO: Интеграция с email сервисом (SendGrid, Mailgun и т.д.)
        /*
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
          // конфигурация SMTP
        });

        await transporter.sendMail({
          from: 'noreply@agenc.io',
          to: email,
          subject: 'Добро пожаловать в нашу рассылку!',
          html: `
            <h1>Спасибо за подписку!</h1>
            <p>Вы будете получать наши обновления и новости.</p>
            <p><a href="${self.apos.baseUrl}/api/newsletter/unsubscribe?email=${email}&token=${token}">
              Отписаться от рассылки
            </a></p>
          `
        });
        */

        console.log(`Welcome email sent to: ${email}`);
      }
    };
  }
};
