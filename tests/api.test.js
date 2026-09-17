import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

let server;

test.before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await delay(1500);
});

test.after(() => {
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
});

test('should register, login and manage protected products', async () => {
  const cadastro = await fetch('http://localhost:3000/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Maria',
      email: 'maria@email.com',
      senha: '123456'
    })
  });

  assert.equal(cadastro.status, 201, 'deve cadastrar usuário');

  const login = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'maria@email.com',
      senha: '123456'
    })
  });

  assert.equal(login.status, 200, 'deve logar com sucesso');

  const loginData = await login.json();
  assert.ok(loginData.token, 'deve devolver token JWT');

  const criar = await fetch('http://localhost:3000/produtos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      nome: 'Notebook',
      categoria: 'Eletrônicos',
      preco: 3200,
      estoque: 10
    })
  });

  assert.equal(criar.status, 201, 'deve criar produto');

  const lista = await fetch('http://localhost:3000/produtos', {
    headers: {
      Authorization: `Bearer ${loginData.token}`
    }
  });

  assert.equal(lista.status, 200, 'deve listar produtos');
  const produtos = await lista.json();
  assert.ok(produtos.length >= 1, 'deve ter ao menos um produto');
});
