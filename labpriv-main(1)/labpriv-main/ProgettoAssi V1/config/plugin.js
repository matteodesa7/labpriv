module.exports = ({ env }) => ({
    // ...
    email: {
        provider: 'nodemailer',
        providerOptions: {
          host: env('SMTP_HOST', 'smtp.gmail.com'),
          port: env('SMTP_PORT', 587),
          auth: {
            user: env('SMTP_USERNAME'),
            pass: env('SMTP_PASSWORD'),
          },
          // ... any custom nodemailer options
        },
        settings: {
          defaultFrom: 'progettolab7@gmail.com',
          defaultReplyTo: 'progettolab7@gmail.com',
        },
    },
});