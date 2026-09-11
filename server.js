import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let titulos = [
  { id: 1, titulo: "Homem de Ferro", tipo: "Filme", genero: "Ação", ano: 2008 },
  { id: 2, titulo: "Os Vingadores", tipo: "Filme", genero: "Aventura", ano: 2012 },
  { id: 3, titulo: "Pantera Negra", tipo: "Filme", genero: "Ação", ano: 2018 },
  { id: 4, titulo: "Guardiões da Galáxia", tipo: "Filme", genero: "Ficção científica", ano: 2014 },
  { id: 5, titulo: "Loki", tipo: "Série", genero: "Fantasia", ano: 2021 },
  { id: 6, titulo: "WandaVision", tipo: "Série", genero: "Drama", ano: 2021 },
  { id: 7, titulo: "Demolidor: Renascido", tipo: "Série", genero: "Ação", ano: 2025 }
];
let proximoId = titulos.length + 1;

app.post("/titulos", (req, res) => {
  const { titulo, tipo, genero, ano } = req.body;

  if (!titulo || !tipo || !genero || ano === undefined) {
    return res.status(400).json({
      erro: "Título, tipo, gênero e ano são obrigatórios."
    });
  }

  const novoTitulo = {
    id: proximoId,
    titulo,
    tipo,
    genero,
    ano
  };

  titulos.push(novoTitulo);
  proximoId++;

  res.status(201).json({
    mensagem: "Título cadastrado com sucesso!",
    titulo: novoTitulo
  });
});

app.get("/titulos", (req, res) => {
  res.json(titulos);
});

app.get("/titulos/:id", (req, res) => {
  const id = Number(req.params.id);
  const titulo = titulos.find((titulo) => titulo.id === id);

  if (!titulo) {
    return res.status(404).json({
      erro: "Título não encontrado."
    });
  }

  res.json(titulo);
});

app.put("/titulos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = titulos.findIndex((titulo) => titulo.id === id);

  if (indice === -1) {
    return res.status(404).json({
      erro: "Título não encontrado."
    });
  }

  const { titulo, tipo, genero, ano } = req.body;

  if (!titulo || !tipo || !genero || ano === undefined) {
    return res.status(400).json({
      erro: "Título, tipo, gênero e ano são obrigatórios."
    });
  }

  titulos[indice] = {
    id,
    titulo,
    tipo,
    genero,
    ano
  };

  res.json({
    mensagem: "Título atualizado com sucesso!",
    titulo: titulos[indice]
  });
});

app.delete("/titulos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = titulos.findIndex((titulo) => titulo.id === id);

  if (indice === -1) {
    return res.status(404).json({
      erro: "Título não encontrado."
    });
  }

  const tituloExcluido = titulos[indice];
  titulos.splice(indice, 1);

  res.json({
    mensagem: "Título excluído com sucesso!",
    titulo: tituloExcluido
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});