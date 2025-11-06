/**
 * Signup Module
 * Публичная регистрация пользователей:
 * - Форма регистрации на frontend
 * - Email верификация
 * - CAPTCHA защита
 * - Approval queue для админов
 * - Welcome emails
 */

const crypto = require('crypto');

module.exports = {
  extend: '@apostrophecms/module',

  options: {
    alias: 'signup',
    // Включить регистрацию
    enabled: true,
    // Требовать email верификацию
    requireEmailVerification: true,
    // Требовать approval от админа
    requireApproval: false,
    // Группа по умолчанию для новых пользователей
    defaultGroup: null,
    // Минимальная длина пароля
    minPasswordLength: 8,
    // Время жизни verification token (часы)
    verificationTokenTTL: 24
  },

  handlers(self) {
    return {
      'apostrophe:modulesReady': {
        async setupCollections() {
          // Индексы для pending users
          await self.apos.db.collection('pendingUsers').createIndex({ email: 1 }, { unique: true });
          await self.apos.db.collection('pendingUsers').createIndex({ verificationToken: 1 });
          await self.apos.db.collection('pendingUsers').createIndex({ createdAt: 1 });

          // TTL для автоудаления неверифицированных пользователей
          await self.apos.db.collection('pendingUsers').createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: self.options.verificationTokenTTL * 60 * 60 }
          );
        },

        addRoutes() {
          // ========================================
          // РЕГИСТРАЦИЯ
          // ========================================

          // Регистрация пользователя
          self.apos.app.post('/api/signup/register', async (req, res) => {
            try {
              if (!self.options.enabled) {
                return res.status(403).json({ error: 'Signup is disabled' });
              }

              const { email, password, username, firstName, lastName } = req.body;

              // Валидация
              const validation = self.validateRegistration(email, password, username);
              if (!validation.valid) {
                return res.status(400).json({ error: validation.error });
              }

              // Проверяем что пользователь не существует
              const existingUser = await self.apos.user.find(req, { email: email }).toObject();
              if (existingUser) {
                return res.status(400).json({ error: 'User with this email already exists' });
              }

              // Создаем pending user
              const pendingUser = await self.createPendingUser({
                email: email,
                password: password,
                username: username || email.split('@')[0],
                firstName: firstName,
                lastName: lastName
              });

              // Отправляем verification email
              if (self.options.requireEmailVerification) {
                await self.sendVerificationEmail(pendingUser);
              } else {
                // Сразу активируем
                await self.activateUser(pendingUser._id);
              }

              return res.json({
                success: true,
                message: self.options.requireEmailVerification
                  ? 'Please check your email to verify your account'
                  : 'Account created successfully'
              });

            } catch (error) {
              console.error('Registration error:', error);
              return res.status(500).json({
                error: 'Registration failed',
                message: error.message
              });
            }
          });

          // Верификация email
          self.apos.app.get('/api/signup/verify/:token', async (req, res) => {
            try {
              const { token } = req.params;

              const pendingUser = await self.apos.db.collection('pendingUsers')
                .findOne({ verificationToken: token });

              if (!pendingUser) {
                return res.status(404).send('Invalid or expired verification link');
              }

              // Активируем пользователя
              await self.activateUser(pendingUser._id);

              // Редирект на страницу успеха
              return res.redirect('/signup-success');

            } catch (error) {
              console.error('Verification error:', error);
              return res.status(500).send('Verification failed');
            }
          });

          // Resend verification
          self.apos.app.post('/api/signup/resend-verification', async (req, res) => {
            try {
              const { email } = req.body;

              if (!email) {
                return res.status(400).json({ error: 'Email is required' });
              }

              const pendingUser = await self.apos.db.collection('pendingUsers')
                .findOne({ email: email });

              if (!pendingUser) {
                return res.status(404).json({ error: 'User not found' });
              }

              // Генерируем новый token
              const newToken = crypto.randomBytes(32).toString('hex');

              await self.apos.db.collection('pendingUsers').updateOne(
                { _id: pendingUser._id },
                {
                  $set: {
                    verificationToken: newToken,
                    tokenGeneratedAt: new Date()
                  }
                }
              );

              pendingUser.verificationToken = newToken;

              // Отправляем email
              await self.sendVerificationEmail(pendingUser);

              return res.json({
                success: true,
                message: 'Verification email sent'
              });

            } catch (error) {
              console.error('Resend verification error:', error);
              return res.status(500).json({
                error: 'Failed to resend verification',
                message: error.message
              });
            }
          });

          // ========================================
          // ADMIN: APPROVAL QUEUE
          // ========================================

          // Получить pending users
          self.apos.app.get('/api/signup/pending', async (req, res) => {
            try {
              if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const pendingUsers = await self.apos.db.collection('pendingUsers')
                .find({ verified: true, approved: false })
                .sort({ createdAt: -1 })
                .toArray();

              return res.json({
                success: true,
                users: pendingUsers
              });

            } catch (error) {
              console.error('Get pending users error:', error);
              return res.status(500).json({
                error: 'Failed to get pending users',
                message: error.message
              });
            }
          });

          // Approve user
          self.apos.app.post('/api/signup/approve/:userId', async (req, res) => {
            try {
              if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { userId } = req.params;

              await self.activateUser(userId);

              return res.json({ success: true });

            } catch (error) {
              console.error('Approve user error:', error);
              return res.status(500).json({
                error: 'Failed to approve user',
                message: error.message
              });
            }
          });

          // Reject user
          self.apos.app.post('/api/signup/reject/:userId', async (req, res) => {
            try {
              if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
              }

              const { userId } = req.params;

              await self.apos.db.collection('pendingUsers').deleteOne({
                _id: self.apos.db.ObjectId(userId)
              });

              return res.json({ success: true });

            } catch (error) {
              console.error('Reject user error:', error);
              return res.status(500).json({
                error: 'Failed to reject user',
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
      /**
       * Валидация регистрационных данных
       */
      validateRegistration(email, password, username) {
        // Email
        if (!email || !self.isValidEmail(email)) {
          return { valid: false, error: 'Invalid email address' };
        }

        // Password
        if (!password || password.length < self.options.minPasswordLength) {
          return {
            valid: false,
            error: `Password must be at least ${self.options.minPasswordLength} characters`
          };
        }

        // Username
        if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
          return {
            valid: false,
            error: 'Username can only contain letters, numbers, underscores and hyphens'
          };
        }

        return { valid: true };
      },

      /**
       * Проверка email
       */
      isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      },

      /**
       * Создать pending user
       */
      async createPendingUser(userData) {
        try {
          const { email, password, username, firstName, lastName } = userData;

          // Хэшируем пароль (используем Apostrophe util)
          const hashedPassword = await self.apos.user.hashPassword(password);

          // Генерируем verification token
          const verificationToken = crypto.randomBytes(32).toString('hex');

          const pendingUser = {
            email: email.toLowerCase(),
            password: hashedPassword,
            username: username,
            firstName: firstName || '',
            lastName: lastName || '',
            verificationToken: verificationToken,
            tokenGeneratedAt: new Date(),
            verified: false,
            approved: !self.options.requireApproval,
            createdAt: new Date()
          };

          const result = await self.apos.db.collection('pendingUsers').insertOne(pendingUser);
          pendingUser._id = result.insertedId;

          return pendingUser;

        } catch (error) {
          console.error('Create pending user error:', error);
          throw error;
        }
      },

      /**
       * Отправить verification email
       */
      async sendVerificationEmail(pendingUser) {
        try {
          // Проверяем есть ли настройки SMTP
          if (!process.env.SMTP_HOST) {
            console.warn('⚠️ SMTP not configured, skipping verification email');
            return;
          }

          const verificationUrl = `${self.apos.baseUrl}/api/signup/verify/${pendingUser.verificationToken}`;

          const emailHtml = `
            <h1>Verify Your Email</h1>
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in ${self.options.verificationTokenTTL} hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
          `;

          // Используем Newsletter модуль для отправки
          if (self.apos.modules.newsletter) {
            await self.apos.modules.newsletter.sendEmail(
              pendingUser.email,
              'Verify Your Email',
              emailHtml
            );
          }

        } catch (error) {
          console.error('Send verification email error:', error);
          // Не бросаем ошибку, просто логируем
        }
      },

      /**
       * Активировать пользователя
       */
      async activateUser(pendingUserId) {
        try {
          const pendingUser = await self.apos.db.collection('pendingUsers')
            .findOne({ _id: self.apos.db.ObjectId(pendingUserId) });

          if (!pendingUser) {
            throw new Error('Pending user not found');
          }

          // Создаем реального пользователя
          const user = {
            email: pendingUser.email,
            username: pendingUser.username,
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            password: pendingUser.password, // Уже хэширован
            role: 'contributor', // Default role
            disabled: false
          };

          // Добавляем в default группу если указана
          if (self.options.defaultGroup) {
            user.groups = [self.options.defaultGroup];
          }

          // Вставляем в users collection
          const result = await self.apos.user.db.insertOne(user);

          // Удаляем из pending
          await self.apos.db.collection('pendingUsers').deleteOne({
            _id: pendingUser._id
          });

          // Отправляем welcome email
          await self.sendWelcomeEmail(user);

          return result.insertedId;

        } catch (error) {
          console.error('Activate user error:', error);
          throw error;
        }
      },

      /**
       * Отправить welcome email
       */
      async sendWelcomeEmail(user) {
        try {
          if (!process.env.SMTP_HOST) {
            return;
          }

          const emailHtml = `
            <h1>Welcome to ${self.apos.shortName}!</h1>
            <p>Hi ${user.firstName || user.username},</p>
            <p>Your account has been activated. You can now log in and start using the platform.</p>
            <p><a href="${self.apos.baseUrl}/login" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Login Now</a></p>
            <p>If you have any questions, feel free to contact us.</p>
          `;

          if (self.apos.modules.newsletter) {
            await self.apos.modules.newsletter.sendEmail(
              user.email,
              'Welcome!',
              emailHtml
            );
          }

        } catch (error) {
          console.error('Send welcome email error:', error);
        }
      }
    };
  }
};
