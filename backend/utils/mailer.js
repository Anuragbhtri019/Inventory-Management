const nodemailer = require("nodemailer");
const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in the environment");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};
const sendOtpEmail = async ({ to, otp }) => {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Your TrendMart verification code",
    text: `Your TrendMart verification code is ${otp}. It expires in 2 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0b1220;">
        <h2 style="margin: 0 0 12px;">TrendMart verification</h2>
        <p>Use the code below to verify your email address. This code expires in 2 minutes.</p>
        <div style="font-size: 24px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
