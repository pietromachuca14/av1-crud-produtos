import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || "av2-secret-key";

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const produtos = [
  { id: 1, nome: "Notebook Gamer", categoria: "Eletrônicos", preco: 4200, estoque: 8 },
  { id: 2, nome: "Mouse sem fio", categoria: "Periféricos", preco: 180, estoque: 20 },
  { id: 3, nome: "Teclado mecânico", categoria: "Periféricos", preco: 520, estoque: 15 }
];
let proximoProdutoId = produtos.length + 1;

const usuarios = [
  {
    id: 1,
    nome: "Administrador",
    email: "admin@empresa.com",
    senha: bcrypt.hashSync("admin123", 10)
  }
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;
    cb(null, nomeArquivo);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo inválido. Envie uma imagem JPG, PNG ou WEBP."));
    }

    cb(null, true);
  }
});

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token de autenticação ausente ou inválido." });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
};

const validarProduto = (dados) => {
  const { nome, categoria, preco, estoque } = dados;

  if (!nome || !categoria || preco === undefined || estoque === undefined) {
    return "Nome, categoria, preço e estoque são obrigatórios.";
  }

  if (Number(preco) < 0 || Number(estoque) < 0) {
    return "Preço e estoque não podem ser negativos.";
  }

  return null;
};

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Produtos",
      version: "1.0.0",
      description: "API REST com CRUD de produtos, autenticação JWT, upload de imagem e documentação Swagger."
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Cadastro de usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome,email,senha]
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 */
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }

  const usuarioExistente = usuarios.find((usuario) => usuario.email.toLowerCase() === String(email).toLowerCase());
  if (usuarioExistente) {
    return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
  }

  const novoUsuario = {
    id: usuarios.length ? usuarios[usuarios.length - 1].id + 1 : 1,
    nome,
    email,
    senha: await bcrypt.hash(senha, 10)
  };

  usuarios.push(novoUsuario);

  res.status(201).json({
    mensagem: "Usuário cadastrado com sucesso.",
    usuario: {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email
    }
  });
});

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Login do usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email,senha]
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
  }

  const usuario = usuarios.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

  if (!usuario) {
    return res.status(401).json({ erro: "Credenciais inválidas." });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ erro: "Credenciais inválidas." });
  }

  const token = jwt.sign({ id: usuario.id, nome: usuario.nome, email: usuario.email }, JWT_SECRET, { expiresIn: "1h" });

  res.json({
    mensagem: "Login realizado com sucesso.",
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
  });
});

/**
 * @openapi
 * /produtos:
 *   post:
 *     summary: Cadastro de produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, categoria, preco, estoque]
 *             properties:
 *               nome:
 *                 type: string
 *               categoria:
 *                 type: string
 *               preco:
 *                 type: number
 *               estoque:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Produto cadastrado
 */
app.post("/produtos", authMiddleware, (req, res) => {
  const erro = validarProduto(req.body);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const novoProduto = {
    id: proximoProdutoId,
    nome: req.body.nome.trim(),
    categoria: req.body.categoria.trim(),
    preco: Number(req.body.preco),
    estoque: Number(req.body.estoque)
  };

  proximoProdutoId += 1;
  produtos.push(novoProduto);

  res.status(201).json({
    mensagem: "Produto cadastrado com sucesso.",
    produto: novoProduto
  });
});

app.get("/produtos", authMiddleware, (_req, res) => {
  res.json(produtos);
});

app.get("/produtos/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((item) => item.id === id);

  if (!produto) {
    return res.status(404).json({ erro: "Produto não encontrado." });
  }

  res.json(produto);
});

app.put("/produtos/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const indice = produtos.findIndex((item) => item.id === id);

  if (indice === -1) {
    return res.status(404).json({ erro: "Produto não encontrado." });
  }

  const erro = validarProduto(req.body);
  if (erro) {
    return res.status(400).json({ erro });
  }

  produtos[indice] = {
    id,
    nome: req.body.nome.trim(),
    categoria: req.body.categoria.trim(),
    preco: Number(req.body.preco),
    estoque: Number(req.body.estoque)
  };

  res.json({
    mensagem: "Produto atualizado com sucesso.",
    produto: produtos[indice]
  });
});

app.delete("/produtos/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const indice = produtos.findIndex((item) => item.id === id);

  if (indice === -1) {
    return res.status(404).json({ erro: "Produto não encontrado." });
  }

  const produtoExcluido = produtos[indice];
  produtos.splice(indice, 1);

  res.json({
    mensagem: "Produto excluído com sucesso.",
    produto: produtoExcluido
  });
});

app.post("/upload", authMiddleware, upload.single("imagem"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: "Arquivo de imagem não enviado." });
  }

  res.status(201).json({
    mensagem: "Arquivo enviado com sucesso.",
    nomeArquivo: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

app.get("/uploads/:nomeArquivo", (_req, res) => {
  res.sendFile(path.join(uploadsDir, _req.params.nomeArquivo));
});

app.get("/titulos", (_req, res) => {
  res.json([
    { id: 1, titulo: "Homem de Ferro", tipo: "Filme", genero: "Ação", ano: 2008 },
    { id: 2, titulo: "Os Vingadores", tipo: "Filme", genero: "Aventura", ano: 2012 },
    { id: 3, titulo: "Pantera Negra", tipo: "Filme", genero: "Ação", ano: 2018 }
  ]);
});

app.post("/titulos", (req, res) => {
  const { titulo, tipo, genero, ano } = req.body;

  if (!titulo || !tipo || !genero || ano === undefined) {
    return res.status(400).json({ erro: "Título, tipo, gênero e ano são obrigatórios." });
  }

  res.status(201).json({
    mensagem: "Título cadastrado com sucesso!",
    titulo: { id: Date.now(), titulo, tipo, genero, ano }
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const mensagem = error.code === "LIMIT_FILE_SIZE"
      ? "Arquivo muito grande. O tamanho máximo permitido é 2MB."
      : error.message;
    return res.status(400).json({ erro: mensagem });
  }

  if (error && error.message) {
    return res.status(400).json({ erro: error.message });
  }

  return res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

export default app;
