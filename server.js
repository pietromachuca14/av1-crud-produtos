const express = require("express");

const app = express();
const PORT = 3000;

// Permite receber JSON nas requisições
app.use(express.json());

// Lista de produtos armazenada em memória
let produtos = [];

// ID para os novos produtos
let proximoId = 1;

// ROTA PRINCIPAL
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

// CADASTRAR PRODUTO
app.post("/produtos", (req, res) => {
    const { nome, preco, categoria } = req.body;

    if (!nome || preco === undefined || !categoria) {
        return res.status(400).json({
            erro: "Nome, preço e categoria são obrigatórios."
        });
    }

    const novoProduto = {
        id: proximoId,
        nome: nome,
        preco: preco,
        categoria: categoria
    };

    produtos.push(novoProduto);
    proximoId++;

    res.status(201).json({
        mensagem: "Produto cadastrado com sucesso!",
        produto: novoProduto
    });
});

// LISTAR TODOS OS PRODUTOS
app.get("/produtos", (req, res) => {
    res.json(produtos);
});

// CONSULTAR PRODUTO PELO ID
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

// EDITAR PRODUTO
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
        id: id,
        nome: nome,
        preco: preco,
        categoria: categoria
    };

    res.json({
        mensagem: "Produto atualizado com sucesso!",
        produto: produtos[indice]
    });
});

// EXCLUIR PRODUTO
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

// INICIAR SERVIDOR
console.log("CHEGUEI NO FINAL DO ARQUIVO");

app.listen(PORT, () => {
    console.log("SERVIDOR INICIADO!");
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});