#!/usr/bin/env node
const nodemailer = require('nodemailer');

const maxRetries = process.env.SMTP_RETRY_COUNT
  ? parseInt(process.env.SMTP_RETRY_COUNT, 10)
  : 3;
const retryDelay = process.env.SMTP_RETRY_DELAY_MS
  ? parseInt(process.env.SMTP_RETRY_DELAY_MS, 10)
  : 3000;

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const to = process.env.TEST_EMAIL || user;

  if (!user || !pass) {
    console.error('Missing EMAIL_USER or EMAIL_PASS environment variables');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`Attempt ${attempt} — verifying SMTP connection...`);
      await transporter.verify();
      console.log('SMTP verify OK');
      break;
    } catch (err) {
      console.error(
        `Verify attempt ${attempt} failed:`,
        err && err.code ? err.code : err.message || err,
      );
      if (attempt === maxRetries) {
        console.error('All verify attempts failed');
        process.exit(2);
      }
      console.log(`Waiting ${retryDelay}ms before retrying...`);
      // eslint-disable-next-line no-await-in-loop
      await wait(retryDelay);
    }
  }

  // Try sending a small test email
  try {
    console.log('Sending test email to', to);
    const info = await transporter.sendMail({
      from: `"Krezona Test" <${user}>`,
      to,
      subject: 'Krezona SMTP Test',
      text: 'This is a test email from Krezona backend (SMTP check).',
    });
    console.log(
      'sendMail success:',
      info && info.response ? info.response : info,
    );
    process.exit(0);
  } catch (err) {
    console.error('sendMail failed', err);
    process.exit(3);
  }
}

run();
