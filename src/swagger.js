const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const getServerUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://validador-web.vercel.app';
  }
  return `http://localhost:${process.env.PORT || 3001}`;
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'License Validator API',
      version: '1.0.0',
      description: 'API para validação de licenças de componentes web'
    },
    servers: [
      { 
        url: getServerUrl(),
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      schemas: {
        LicenseValidationResponse: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            manifest: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                version: { type: 'string' },
                build: { type: 'string', format: 'date-time' }
              }
            },
            component: { type: 'string' },
            expiresAt: { type: 'string', format: 'date' },
            origin: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            licenseCount: { type: 'integer' },
            environment: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/server.js']
};

module.exports = { swaggerUi, specs: swaggerJsdoc(options) };
