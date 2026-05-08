const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'unknown';

app.use(express.json());

// Хранилище пользователей (в памяти)
let users = [];
let products = [
  { id: 1, name: "Ноутбук", price: 75000, description: "Мощный ноутбук" },
  { id: 2, name: "Мышь", price: 1500, description: "Беспроводная мышь" },
  { id: 3, name: "Клавиатура", price: 3500, description: "Механическая клавиатура" }
];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Load Balancer API',
      version: '1.0.0',
      description: 'API with Nginx Load Balancer',
    },
    servers: [{ url: 'http://localhost', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Add paths manually
swaggerSpec.paths = {
  '/': {
    get: {
      summary: 'Get server info',
      responses: { 200: { description: 'Server information' } },
    },
  },
  '/api/auth/register': {
    post: {
      summary: 'Register user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                password: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'User created' } },
    },
  },
  '/api/auth/login': {
    post: {
      summary: 'Login user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Login successful' } },
    },
  },
  '/api/users': {
    get: {
      summary: 'Get all users',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'List of users' } },
    },
  },
  '/api/products': {
    get: {
      summary: 'Get all products',
      responses: { 200: { description: 'List of products' } },
    },
    post: {
      summary: 'Create product',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Product created' } },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get('/', (req, res) => {
  res.json({
    server: SERVER_ID,
    timestamp: new Date().toISOString(),
    message: `Response from ${SERVER_ID}`,
    docs: 'http://localhost/api-docs'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_ID });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ error: "Username already exists" });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(users.length + 1),
    username,
    passwordHash,
    role: role || "user",
    blocked: false
  };
  
  users.push(user);
  res.status(201).json({
    id: user.id,
    username: user.username,
    role: user.role,
    blocked: user.blocked
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user || user.blocked) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  // Simple token (in real app use JWT)
  const token = Buffer.from(`${user.id}:${user.username}`).toString('base64');
  res.json({
    accessToken: token,
    refreshToken: token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// Get users (no auth for testing)
app.get('/api/users', (req, res) => {
  const safeUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    blocked: u.blocked
  }));
  res.json(safeUsers);
});

// Get products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Create product
app.post('/api/products', (req, res) => {
  const { name, price, description } = req.body;
  const newProduct = {
    id: products.length + 1,
    name,
    price,
    description: description || ""
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${SERVER_ID} running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});
