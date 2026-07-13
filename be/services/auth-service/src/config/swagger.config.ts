import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VIP Project — Auth Service API',
      version: '0.0.1',
      description:
        'Authentication microservice: register, login, token refresh, logout, and user profile.',
    },
    servers: [
      {
        url: 'http://localhost:9999',
        description: 'Dev gateway',
      },
    ],
    components: {
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'StrongPass123' },
            name: { type: 'string', example: 'Nguyen Van A' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'StrongPass123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        LogoutRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/interfaces/rest/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Serve raw JSON spec — consumed by unified Swagger UI at gateway (port 9999)
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('[AUTH-SERVICE] Swagger JSON spec at /api-docs.json');
}

