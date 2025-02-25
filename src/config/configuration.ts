export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10), // Corregido: valor predeterminado como cadena
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10), // Corregido: valor predeterminado como cadena
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'buscadis',
    ssl: process.env.DB_SSL === 'true',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',  // Considera usar un valor predeterminado más seguro
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10), // Corregido: valor predeterminado como cadena
    user: process.env.SMTP_USER, //Estos valores no deberían tener un default, ya que varían.
    password: process.env.SMTP_PASSWORD,//Estos valores no deberían tener un default, ya que varían.
    from: process.env.SMTP_FROM, //Estos valores no deberían tener un default, ya que varían.
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, //Estos valores no deberían tener un default, ya que varían.
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, //Estos valores no deberían tener un default, ya que varían.
    region: process.env.AWS_REGION, //Estos valores no deberían tener un default, ya que varían.
    bucketName: process.env.AWS_BUCKET_NAME, //Estos valores no deberían tener un default, ya que varían.
  },

  // Elasticsearch
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic', //Aunque no es lo ideal, mantengo el default,
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',//Aunque no es lo ideal, mantengo el default,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10), // Corregido: valor predeterminado como cadena
    password: process.env.REDIS_PASSWORD, //Estos valores no deberían tener un default, ya que varían.
  },

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID, //Estos valores no deberían tener un default, ya que varían.
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, //Estos valores no deberían tener un default, ya que varían.
      callbackUrl: process.env.GOOGLE_CALLBACK_URL, //Estos valores no deberían tener un default, ya que varían.
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID, //Estos valores no deberían tener un default, ya que varían.
      appSecret: process.env.FACEBOOK_APP_SECRET, //Estos valores no deberían tener un default, ya que varían.
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL, //Estos valores no deberían tener un default, ya que varían.
    },
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY, //Estos valores no deberían tener un default, ya que varían.
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, //Estos valores no deberían tener un default, ya que varían.
    currency: process.env.STRIPE_CURRENCY || 'usd',
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN, //Estos valores no deberían tener un default, ya que varían.
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  // SMS Authentication
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID, //Estos valores no deberían tener un default, ya que varían.
    authToken: process.env.TWILIO_AUTH_TOKEN, //Estos valores no deberían tener un default, ya que varían.
    phoneNumber: process.env.TWILIO_PHONE_NUMBER, //Estos valores no deberían tener un default, ya que varían.
  },

  // API Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10), // Corregido: valor predeterminado como cadena
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // Corregido: valor predeterminado como cadena
  },
});