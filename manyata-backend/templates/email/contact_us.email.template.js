const generateHtmlBody = (data) => {
    const { name, email, phone, city, message } = data;
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission - Manyata-Enterprises</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    
        <!-- Outer Table (White Background) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 40px 20px;">
            <tr>
                <td align="center">
                    
                    <!-- Inner Container (Dark card to ensure White & Yellow text legibility) -->
                    <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #161616; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                        
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #0d0d0d; border-bottom: 3px solid #f39c12;">
                                <h1 style="margin: 0; color: #f39c12; font-size: 26px; letter-spacing: 1px;">Manyata-Enterprises</h1>
                                <p style="margin: 6px 0 0 0; color: #ffffff; font-size: 14px; letter-spacing: 0.5px;">New Website Inquiry</p>
                            </td>
                        </tr>
    
                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 35px 30px;">
                                <p style="margin-top: 0; margin-bottom: 25px; color: #ffffff; font-size: 16px; line-height: 1.5;">
                                    Hello Team,<br><br>
                                    You have received a new contact submission from your website. Here are the details provided:
                                </p>
    
                                <!-- Data Fields Container -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #222222; border-radius: 6px; padding: 20px;">
                                    <tr>
                                        <td style="padding-bottom: 18px;">
                                            <strong style="color: #f39c12; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Name</strong>
                                            <span style="color: #ffffff; font-size: 16px;">${name}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 18px;">
                                            <strong style="color: #f39c12; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Email</strong>
                                            <span style="color: #ffffff; font-size: 16px;">
                                                <a href="mailto:${email}" style="color: #ffffff; text-decoration: underline;">${email}</a>
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 18px;">
                                            <strong style="color: #f39c12; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Phone</strong>
                                            <span style="color: #ffffff; font-size: 16px;">${phone}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 18px;">
                                            <strong style="color: #f39c12; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">City / Town</strong>
                                            <span style="color: #ffffff; font-size: 16px;">${city}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong style="color: #f39c12; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Message</strong>
                                            <span style="color: #ffffff; font-size: 15px; line-height: 1.6; display: block; background-color: #1c1c1c; padding: 12px; border-radius: 4px; border-left: 3px solid #f39c12;">
                                                ${message}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
    
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #0d0d0d; border-top: 1px solid #222222;">
                                <p style="margin: 0; color: #888888; font-size: 12px;">
                                    This is an automated notification from <strong style="color: #f39c12;">Manyata-Enterprises</strong>.
                                </p>
                            </td>
                        </tr>
    
                    </table>
                </td>
            </tr>
        </table>
    
    </body>
    </html>`
}


const contactUsEmailTemplate = (data) => {
    const htmlBody = generateHtmlBody(data);
    const subject = `Contact Form Submission`;
    return {
        html: htmlBody,
        subject
    }
}

module.exports = contactUsEmailTemplate;