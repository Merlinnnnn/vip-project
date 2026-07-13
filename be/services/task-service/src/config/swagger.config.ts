import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VIP Project — Task Service API',
      version: '0.0.1',
      description:
        'Task management microservice: tasks CRUD, skills tracking, and notifications.',
    },
    servers: [
      {
        url: 'http://localhost:9999',
        description: 'Dev gateway',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token from auth-service',
        },
        UserIdHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-id',
          description: 'User ID passed by Nginx / gateway (internal)',
        },
      },
      schemas: {
        // ─── Task ────────────────────────────────────────
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done', 'overdue'],
            },
            priority: { type: 'integer' },
            learningMinutes: { type: 'integer' },
            dueDate: { type: 'string', format: 'date-time' },
            skillId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title', 'dueDate'],
          properties: {
            title: { type: 'string', example: 'Học TypeScript Generics' },
            description: { type: 'string', example: 'Ôn lại phần Mapped Types' },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              default: 'todo',
            },
            priority: { type: 'integer', example: 1 },
            learningMinutes: { type: 'integer', example: 60 },
            dueDate: { type: 'string', format: 'date-time', example: '2026-07-20T00:00:00Z' },
            skillId: { type: 'string', format: 'uuid' },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
            },
            priority: { type: 'integer' },
            learningMinutes: { type: 'integer' },
            dueDate: { type: 'string', format: 'date-time' },
            skillId: { type: 'string', format: 'uuid' },
          },
        },

        // ─── Skill ───────────────────────────────────────
        Skill: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            totalMinutes: { type: 'integer' },
            targetMinutes: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateSkillRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'TypeScript' },
            targetMinutes: { type: 'integer', example: 600000 },
          },
        },
        UpdateSkillRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            targetMinutes: { type: 'integer' },
          },
        },

        // ─── Notification ────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', example: 'TASK_SCHEDULED' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Common ─────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
          },
        },
      },
    },
    security: [
      { BearerAuth: [] },
      { UserIdHeader: [] },
    ],
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

  console.log('[TASK-SERVICE] Swagger JSON spec at /api-docs.json');
}

