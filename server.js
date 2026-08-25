import express from "express";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API de Cadastro de Produtos funcionando!",
    rotas: {
      cadastrar: "POST /produtos",
      listar: "GET /produtos",
      consultar: "GET /produtos/:id",
      editar: "PUT /produtos/:id",
      excluir: "DELETE /produtos/:id"
    }
  });
});

let produtos = [];
let proximoId = 1;

app.post("/produtos", (req, res) => {
  const { nome, preco, categoria } = req.body;

  if (!nome || preco === undefined || !categoria) {
    return res.status(400).json({
      erro: "Nome, preço e categoria são obrigatórios."
    });
  }

  const novoProduto = {
    id: proximoId,
    nome,
    preco,
    categoria
  };

  produtos.push(novoProduto);
  proximoId++;

  res.status(201).json({
    mensagem: "Produto cadastrado com sucesso!",
    produto: novoProduto
  });
});

app.get("/produtos", (req, res) => {
  res.json(produtos);
});

app.get("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((produto) => produto.id === id);

  if (!produto) {
    return res.status(404).json({
      erro: "Produto não encontrado."
    });
  }

  res.json(produto);
});

app.put("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = produtos.findIndex((produto) => produto.id === id);

  if (indice === -1) {
    return res.status(404).json({
      erro: "Produto não encontrado."
    });
  }

  const { nome, preco, categoria } = req.body;

  if (!nome || preco === undefined || !categoria) {
    return res.status(400).json({
      erro: "Nome, preço e categoria são obrigatórios."
    });
  }

  produtos[indice] = {
    id,
    nome,
    preco,
    categoria
  };

  res.json({
    mensagem: "Produto atualizado com sucesso!",
    produto: produtos[indice]
  });
});

app.delete("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = produtos.findIndex((produto) => produto.id === id);

  if (indice === -1) {
    return res.status(404).json({
      erro: "Produto não encontrado."
    });
  }

  const produtoExcluido = produtos[indice];
  produtos.splice(indice, 1);

  res.json({
    mensagem: "Produto excluído com sucesso!",
    produto: produtoExcluido
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});