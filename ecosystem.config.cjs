module.exports = {
  apps: [{
    name: 'gross-ict',
    script: './dist/index.js',
    env: {
      NODE_ENV: 'production',
      DB_HOST: 'k20p.your-database.de',
      DB_PORT: '3306',
      DB_USER: 'jqviwy_1',
      DB_PASSWORD: 'd1]PZ+n3o26R',
      DB_NAME: 'jqviwy_db1',
      SMTP_HOST: 'smtp.office365.com',
      SMTP_PORT: '587',
      SMTP_USER: 'stefan@gross-ict.ch',
      SMTP_PASS: '!LeliBist.1561!',
      SMTP_FROM: 'stefan@gross-ict.ch',
      JWT_SECRET: 'f5b1234906f2510d8d58efcbb473c61d',
      OAUTH_SERVER_URL: 'https://oauth.manus.im'
    }
  }]
};
