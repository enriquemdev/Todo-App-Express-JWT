const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const express = require("express");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY;
const users = []; // Simulación de usuarios en memoria
const todos = []; // Simulación de tareas en memoria

// Configuración de Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Todo API",
            version: "1.0.0",
            description: "API de tareas con autenticación JWT"
        },
        servers: [{ url: "http://localhost:3000" }]
    },
    apis: [__filename]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "Token requerido" });
    
    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Token inválido" });
        req.userId = decoded.id;
        next();
    });
};

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente
 */
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ id: users.length + 1, username, password: hashedPassword });
    res.json({ message: "Usuario registrado" });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión y obtiene un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token generado correctamente
 */
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
    }
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Obtiene todas las tareas del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tareas
 */
app.get("/todos", verifyToken, (req, res) => {
    res.json(todos.filter(todo => todo.userId === req.userId));
});

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Crea una nueva tarea
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tarea creada exitosamente
 */
app.post("/todos", verifyToken, (req, res) => {
    const { text } = req.body;
    const todo = { id: todos.length + 1, text, userId: req.userId };
    todos.push(todo);
    res.json(todo);
});

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Elimina una tarea por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarea eliminada exitosamente
 */
app.delete("/todos/:id", verifyToken, (req, res) => {
    const index = todos.findIndex(todo => todo.id === parseInt(req.params.id) && todo.userId === req.userId);
    if (index === -1) return res.status(404).json({ message: "Tarea no encontrada" });
    todos.splice(index, 1);
    res.json({ message: "Tarea eliminada" });
});

if (process.env.NODE_ENV !== "production") {
    app.listen(3000, () => console.log(`Servidor corriendo en el puerto 3000`));
} else {
    app.listen(3000, "0.0.0.0", () => console.log(`Servidor corriendo en http://0.0.0.0:3000`));
}

