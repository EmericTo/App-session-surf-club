const nodemailer = require('nodemailer');

let transporter;

// Configuration pour différents environnements
const createTransporter = async () => {
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    // Utiliser Ethereal Email pour les tests (emails factices)
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('📧 Using Ethereal Email for testing');
    console.log('📧 Preview emails at: https://ethereal.email');
  } else {
    // Configuration Gmail ou autre service
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    console.log('📧 Using configured email service');
  }
};

// Initialiser le transporteur
createTransporter();

const sendVerificationEmail = async (email, token, username) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Session Surf Club" <noreply@sessionsurf.com>',
    to: email,
    subject: 'Vérifiez votre compte Session Surf Club',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">🏄‍♂️ Session Surf Club</h1>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">Bienvenue ${username} !</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Merci de vous être inscrit sur Session Surf Club. Pour activer votre compte et commencer à partager vos sessions de surf, cliquez sur le bouton ci-dessous :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              ✅ Vérifier mon email
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⏰ Ce lien expire dans 24 heures pour votre sécurité.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si vous n'avez pas créé ce compte, ignorez cet email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Session Surf Club - Partagez votre passion du surf 🌊
          </p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  
  // Si on utilise Ethereal, afficher le lien de prévisualisation
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

const sendPasswordResetEmail = async (email, token, username) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Session Surf Club" <noreply@sessionsurf.com>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe - Session Surf Club',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; font-size: 28px; margin: 0;">🔒 Session Surf Club</h1>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Bonjour ${username},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              🔑 Réinitialiser mon mot de passe
            </a>
          </div>
          
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #dc2626; margin: 0; font-size: 14px;">
              ⏰ Ce lien expire dans 1 heure pour votre sécurité.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Session Surf Club - Partagez votre passion du surf 🌊
          </p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  
  // Si on utilise Ethereal, afficher le lien de prévisualisation
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};