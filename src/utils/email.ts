// Brevo Email Service Integration
// Brevo (formerly Sendinblue) configuration for transactional emails with attachments

// Configuration
const CONFIG = {
  brevo: {
    apiUrl: 'https://api.brevo.com/v3/smtp/email',
    // You'll need to set this in your environment variables
    apiKey: import.meta.env.VITE_BREVO_API_KEY || '',
    // Use Brevo's default test sender - replace with your validated sender
    senderEmail: 'mohansfiles@gmail.com', // Default Brevo test sender
    senderName: 'TechCreator'
  },
  emailjs: {
    serviceId: 'service_qj44izj',
    publicKey: 'aImlP6dotqO-E3y6h',
    templates: {
      contact: 'template_k92zaj2',
      order: 'purchase_confirmation'
    }
  },
  developerEmail: 'mohanselemophile@gmail.com'
};

// Type Definitions
interface ContactFormData {
  from_name: string;
  from_email: string;
  project_type: string;
  budget: string;
  message: string;
}

interface OrderConfirmationData {
  project_title: string;
  customer_name: string;
  price: string;
  download_instructions?: string;
  support_email?: string;
  order_id?: string;
}

interface DocumentDeliveryData {
  project_title: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  documents: Array<{
    name: string;
    url: string;
    category: string;
    review_stage: string;
    size?: number;
  }>;
  access_expires?: string;
}

interface BrevoEmailData {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachment?: Array<{
    name: string;
    content: string; // Base64 encoded content
    url?: string; // Alternative to content for URL-based attachments
  }>;
  tags?: string[];
}

// Utility Functions
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    datetime: now.toISOString()
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Brevo API Service
const sendBrevoEmail = async (emailData: BrevoEmailData): Promise<void> => {
  if (!CONFIG.brevo.apiKey) {
    console.warn('Brevo API key is not configured. Email will not be sent.');
    console.log('To configure Brevo:');
    console.log('1. Go to https://app.brevo.com/settings/keys/api');
    console.log('2. Create an API key');
    console.log('3. Add VITE_BREVO_API_KEY to your .env file');
    console.log('4. Validate your sender email in Brevo dashboard');
    return;
  }

  try {
    const response = await fetch(CONFIG.brevo.apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': CONFIG.brevo.apiKey
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific sender validation error
      if (response.status === 400 && errorData.message?.includes('sender')) {
        throw new Error(`
Brevo Sender Validation Error: ${errorData.message}

To fix this:
1. Go to https://app.brevo.com/senders/domain
2. Add and validate your domain, OR
3. Go to https://app.brevo.com/senders/list
4. Add and validate your sender email address
5. Update the senderEmail in the email configuration

Current sender: ${emailData.sender.email}
        `);
      }
      
      throw new Error(`Brevo API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Email sent successfully via Brevo:', result);
  } catch (error) {
    console.error('Brevo email sending failed:', error);
    throw error;
  }
};

// Email Services (keeping EmailJS for contact form, using Brevo for document delivery)
export const sendContactForm = async (data: ContactFormData): Promise<void> => {
  // Keep using EmailJS for contact forms since they don't need attachments
  if (!validateEmail(data.from_email)) {
    throw new Error('Invalid sender email address');
  }

  const { date, time } = getCurrentDateTime();

  try {
    // Import EmailJS dynamically to avoid issues if not available
    const emailjs = await import('@emailjs/browser');
    
    await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templates.contact,
      {
        name: data.from_name,
        email: data.from_email,
        project_type: data.project_type,
        budget: data.budget,
        message: data.message,
        current_date: date,
        current_time: time,
        title: `New inquiry from ${data.from_name}`,
        to_email: CONFIG.developerEmail,
        reply_to: data.from_email
      },
      CONFIG.emailjs.publicKey
    );
  } catch (error) {
    console.error('Contact form email failed:', error);
    throw new Error('Failed to send your message. Please try again later.');
  }
};

export const sendOrderConfirmation = async (
  data: OrderConfirmationData,
  recipientEmail: string
): Promise<void> => {
  if (!validateEmail(recipientEmail)) {
    throw new Error('Invalid recipient email address');
  }

  const { date } = getCurrentDateTime();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - TechCreator</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .order-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .highlight { color: #3b82f6; font-weight: bold; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .setup-note { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.customer_name},</h2>
          
          <p>Your order has been confirmed and is being processed. Here are your order details:</p>
          
          <div class="order-details">
            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> <span class="highlight">${data.order_id}</span></p>
            <p><strong>Project:</strong> ${data.project_title}</p>
            <p><strong>Amount Paid:</strong> <span class="highlight">${data.price}</span></p>
            <p><strong>Order Date:</strong> ${date}</p>
          </div>
          
          <div class="warning">
            <h3>📧 Document Delivery</h3>
            <p><strong>You will receive a separate email within 24 hours</strong> containing download links for all project documents, organized by review stages.</p>
          </div>
          
          <div class="setup-note">
            <h3>⚠️ Setup Note</h3>
            <p>Email delivery is currently being configured. If you don't receive the document delivery email within 24 hours, please contact support directly.</p>
          </div>
          
          <h3>What's Included:</h3>
          <ul>
            <li>Complete source code and project files</li>
            <li>Comprehensive documentation across 3 review stages</li>
            <li>Installation and setup guides</li>
            <li>Technical specifications and implementation details</li>
            <li>Lifetime access to all downloads</li>
            <li>Email support for technical questions</li>
          </ul>
          
          <h3>Next Steps:</h3>
          <ol>
            <li>Keep this email for your records</li>
            <li>Watch for the document delivery email (check spam folder)</li>
            <li>Contact support if you don't receive documents within 24 hours</li>
          </ol>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
          
          <p>Thank you for choosing TechCreator!</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 TechCreator. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Order Confirmation - TechCreator

Hello ${data.customer_name},

Your order has been confirmed! Here are your order details:

Order ID: ${data.order_id}
Project: ${data.project_title}
Amount Paid: ${data.price}
Order Date: ${date}

IMPORTANT: You will receive a separate email within 24 hours containing download links for all project documents.

What's Included:
- Complete source code and project files
- Comprehensive documentation across 3 review stages
- Installation and setup guides
- Technical specifications and implementation details
- Lifetime access to all downloads
- Email support for technical questions

If you have any questions, contact us at ${CONFIG.developerEmail}

Thank you for choosing TechCreator!
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: recipientEmail,
      name: data.customer_name
    }],
    subject: `Order Confirmation - ${data.project_title} (${data.order_id})`,
    htmlContent,
    textContent,
    tags: ['order-confirmation', 'transactional']
  };

  try {
    await sendBrevoEmail(emailData);
  } catch (error) {
    console.error('Order confirmation failed:', error);
    // Don't throw error for order confirmation - order should still complete
    console.log('Order completed successfully, but email notification failed. Customer should be notified manually.');
  }
};

export const sendDocumentDelivery = async (data: DocumentDeliveryData): Promise<void> => {
  if (!validateEmail(data.customer_email)) {
    throw new Error('Invalid recipient email address');
  }

  const { date } = getCurrentDateTime();

  // Group documents by review stage
  const documentsByStage = {
    review_1: data.documents.filter(doc => doc.review_stage === 'review_1'),
    review_2: data.documents.filter(doc => doc.review_stage === 'review_2'),
    review_3: data.documents.filter(doc => doc.review_stage === 'review_3')
  };

  const stageLabels = {
    review_1: 'Review 1 - Initial Project Review',
    review_2: 'Review 2 - Mid-Project Assessment', 
    review_3: 'Review 3 - Final Review & Completion'
  };

  // Generate HTML content for documents
  const generateStageHtml = (stage: keyof typeof documentsByStage) => {
    const docs = documentsByStage[stage];
    if (docs.length === 0) return '';

    return `
      <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0;">${stageLabels[stage]}</h3>
        <div style="display: grid; gap: 10px;">
          ${docs.map(doc => `
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                  <h4 style="margin: 0 0 5px 0; color: #1f2937;">${doc.name}</h4>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Category: ${doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                    ${doc.size ? ` • Size: ${formatFileSize(doc.size)}` : ''}
                  </p>
                </div>
              </div>
              <a href="${doc.url}" 
                 style="display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;"
                 target="_blank">
                📥 Download Document
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Documents - ${data.project_title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .summary { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981; }
        .highlight { color: #059669; font-weight: bold; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📁 Project Documents Delivered</h1>
          <p>Your complete project package is ready!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.customer_name},</h2>
          
          <p>Your project documents for <strong>${data.project_title}</strong> are now available for download!</p>
          
          <div class="summary">
            <h3>📊 Document Summary</h3>
            <p><strong>Order ID:</strong> <span class="highlight">${data.order_id}</span></p>
            <p><strong>Total Documents:</strong> ${data.documents.length}</p>
            <p><strong>Access:</strong> ${data.access_expires || 'Lifetime access'}</p>
            <p><strong>Delivery Date:</strong> ${date}</p>
          </div>
          
          <h3>📋 Documents by Review Stage</h3>
          <p>Your documents are organized by project review stages for easy navigation:</p>
          
          ${generateStageHtml('review_1')}
          ${generateStageHtml('review_2')}
          ${generateStageHtml('review_3')}
          
          <div class="warning">
            <h3>⚠️ Important Notes</h3>
            <ul>
              <li><strong>Save these links:</strong> Bookmark or save this email for future access</li>
              <li><strong>Download soon:</strong> While you have lifetime access, we recommend downloading files promptly</li>
              <li><strong>Technical support:</strong> Contact us if you have any questions about implementation</li>
              <li><strong>File issues:</strong> If any download links don't work, contact support immediately</li>
            </ul>
          </div>
          
          <h3>🛠️ What's Included</h3>
          <ul>
            <li>Complete source code and project files</li>
            <li>Detailed documentation for each review stage</li>
            <li>Installation and setup instructions</li>
            <li>Technical specifications and architecture details</li>
            <li>Implementation guides and best practices</li>
          </ul>
          
          <h3>💬 Need Help?</h3>
          <p>If you have any questions about the project, implementation, or need technical support, please contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
          
          <p>Thank you for choosing TechCreator. We hope this project serves you well!</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 TechCreator. All rights reserved.</p>
          <p>This email contains your purchased project documents. Please keep it safe.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Project Documents - ${data.project_title}

Hello ${data.customer_name},

Your project documents for "${data.project_title}" are now available for download!

Order ID: ${data.order_id}
Total Documents: ${data.documents.length}
Access: ${data.access_expires || 'Lifetime access'}
Delivery Date: ${date}

DOCUMENTS BY REVIEW STAGE:

${Object.entries(documentsByStage).map(([stage, docs]) => {
  if (docs.length === 0) return '';
  return `
${stageLabels[stage as keyof typeof stageLabels]}:
${docs.map(doc => `
  • ${doc.name}
    Category: ${doc.category}${doc.size ? ` | Size: ${formatFileSize(doc.size)}` : ''}
    Download: ${doc.url}
`).join('')}
`;
}).filter(Boolean).join('\n')}

IMPORTANT NOTES:
- Save these links for future access
- Download files promptly for best experience
- Contact support if any links don't work
- Technical support available at ${CONFIG.developerEmail}

Thank you for choosing TechCreator!
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: data.customer_email,
      name: data.customer_name
    }],
    subject: `📁 Project Documents Ready - ${data.project_title} (${data.order_id})`,
    htmlContent,
    textContent,
    tags: ['document-delivery', 'transactional', 'project-files']
  };

  try {
    await sendBrevoEmail(emailData);
    console.log('Document delivery email sent successfully via Brevo');
  } catch (error) {
    console.error('Document delivery email failed:', error);
    throw new Error('Failed to send document delivery email. Please try again later.');
  }
};

// Generate download instructions for order confirmation
export const generateDownloadInstructions = (projectTitle: string, orderId: string): string => {
  return `
Thank you for purchasing "${projectTitle}"!

Your Order ID: ${orderId}

What happens next:
1. You will receive a separate email within 24 hours containing download links for all project documents
2. Documents are organized by review stages (Review 1, 2, and 3)
3. Each document includes presentations, documentation, and reports as applicable
4. You'll have lifetime access to download these documents

The document delivery email will include:
• Direct download links for all files
• Documents grouped by review stage
• File size information
• Technical specifications
• Implementation guides

If you have any questions or need support, please contact us at ${CONFIG.developerEmail}

Thank you for your business!
  `.trim();
};

// Setup instructions for Brevo
export const getBrevoSetupInstructions = (): string => {
  return `
BREVO EMAIL SETUP INSTRUCTIONS:

1. Create Brevo Account:
   - Go to https://app.brevo.com/
   - Sign up for a free account

2. Get API Key:
   - Go to https://app.brevo.com/settings/keys/api
   - Create a new API key
   - Add it to your .env file as VITE_BREVO_API_KEY

3. Validate Sender Email:
   Option A - Validate Individual Email:
   - Go to https://app.brevo.com/senders/list
   - Click "Add a sender"
   - Add your email (e.g., mohanselemophile@gmail.com)
   - Verify it via the confirmation email

   Option B - Validate Domain (Recommended):
   - Go to https://app.brevo.com/senders/domain
   - Add your domain
   - Add the required DNS records
   - This allows any email from your domain

4. Update Configuration:
   - Replace 'noreply@brevo.com' with your validated sender email
   - Update the senderName if needed

5. Test Email Delivery:
   - Use the test function in the email utils
   - Check Brevo dashboard for delivery statistics

Current Configuration:
- Sender Email: ${CONFIG.brevo.senderEmail}
- Sender Name: ${CONFIG.brevo.senderName}
- API Key: ${CONFIG.brevo.apiKey ? 'Configured' : 'Not configured'}
  `;
};

// Test function for development
export const testBrevoService = async () => {
  try {
    console.log(getBrevoSetupInstructions());
    
    const testData: DocumentDeliveryData = {
      project_title: 'Test Project',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      order_id: 'TEST123',
      documents: [
        {
          name: 'Test Document.pdf',
          url: 'https://example.com/test.pdf',
          category: 'document',
          review_stage: 'review_1',
          size: 1024000
        }
      ]
    };

    await sendDocumentDelivery(testData);
    console.log('Brevo test email sent successfully');
  } catch (error) {
    console.error('Brevo test failed:', error);
  }
};