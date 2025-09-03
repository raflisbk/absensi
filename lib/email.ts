import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com'
const FROM_NAME = process.env.FROM_NAME || 'Face Attendance System'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export class EmailService {
  static async sendEmailVerification(email: string, token: string, name: string) {
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`
    
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
                <p style="font-size: 16px; margin-bottom: 25px;">
                  Thank you for registering with Face Attendance System. To complete your registration, please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold; 
                            display: inline-block; 
                            font-size: 16px;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #667eea; word-break: break-all; font-size: 14px;">
                  ${verificationUrl}
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
                  This verification link will expire in 24 hours. If you didn't request this, please ignore this email.
                </p>
              </div>
            </body>
          </html>
        `
      })
      return true
    } catch (error) {
      console.error('Email verification send error:', error)
      return false
    }
  }

  static async sendPasswordReset(email: string, token: string, name: string) {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`
    
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
                <p style="font-size: 16px; margin-bottom: 25px;">
                  We received a request to reset your password. Click the button below to create a new password.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold; 
                            display: inline-block; 
                            font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #ff6b6b; word-break: break-all; font-size: 14px;">
                  ${resetUrl}
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
                  This password reset link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
                </p>
              </div>
            </body>
          </html>
        `
      })
      return true
    } catch (error) {
      console.error('Password reset email send error:', error)
      return false
    }
  }

  static async sendRegistrationApproval(email: string, name: string, approved: boolean, reason?: string) {
    const subject = approved ? 'Registration Approved' : 'Registration Status Update'
    const loginUrl = `${APP_URL}/login`
    
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${approved ? '#10ac84 0%, #1dd1a1 100%' : '#ff6b6b 0%, #ee5a24 100%'}); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">${subject}</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
                
                ${approved ? `
                  <p style="font-size: 16px; margin-bottom: 25px; color: #10ac84;">
                    Great news! Your registration has been approved and your account is now active.
                  </p>
                  <p style="font-size: 16px; margin-bottom: 25px;">
                    You can now log in to the Face Attendance System and start using all features.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" 
                       style="background: linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold; 
                              display: inline-block; 
                              font-size: 16px;">
                      Login to Your Account
                    </a>
                  </div>
                ` : `
                  <p style="font-size: 16px; margin-bottom: 25px; color: #ff6b6b;">
                    We regret to inform you that your registration could not be approved at this time.
                  </p>
                  ${reason ? `
                    <div style="background: #fff; border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #666;"><strong>Reason:</strong> ${reason}</p>
                    </div>
                  ` : ''}
                  <p style="font-size: 16px; margin-bottom: 25px;">
                    If you believe this is an error or would like to reapply, please contact our support team.
                  </p>
                `}
                
                <p style="color: #666; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
                  If you have any questions, please contact our support team at ${FROM_EMAIL}
                </p>
              </div>
            </body>
          </html>
        `
      })
      return true
    } catch (error) {
      console.error('Registration approval email send error:', error)
      return false
    }
  }

  static async sendWelcomeEmail(email: string, name: string) {
    const loginUrl = `${APP_URL}/login`
    
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to Face Attendance System',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin-top: 0;">Welcome ${name}!</h2>
                <p style="font-size: 16px; margin-bottom: 25px;">
                  Welcome to Face Attendance System! Your account is now fully set up and ready to use.
                </p>
                
                <div style="background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
                  <h3 style="color: #667eea; margin-top: 0;">Getting Started:</h3>
                  <ul style="color: #666; padding-left: 20px;">
                    <li>Complete your face enrollment for seamless attendance</li>
                    <li>Check your class schedule and enrollment</li>
                    <li>Use face recognition for quick check-ins</li>
                    <li>Monitor your attendance statistics</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold; 
                            display: inline-block; 
                            font-size: 16px;">
                    Get Started
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
                  Need help? Contact our support team at ${FROM_EMAIL}
                </p>
              </div>
            </body>
          </html>
        `
      })
      return true
    } catch (error) {
      console.error('Welcome email send error:', error)
      return false
    }
  }
}