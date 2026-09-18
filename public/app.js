const state = { products: [], editingId: null, token: sessionStorage.getItem("token") };

const elements = {
  loginScreen: document.querySelector("#login-screen"),
  loginForm: document.querySelector("#login-form"),
  loginEmail: document.querySelector("#login-email"),
  loginPassword: document.querySelector("#login-password"),
  loginFeedback: document.querySelector("#login-feedback"),
  tableBody: document.querySelector("#titles-table-body"),
  emptyState: document.querySelector("#empty-state"),
  searchInput: document.querySelector("#search-input"),
  modal: document.querySelector("#modal-backdrop"),
  form: document.querySelector("#product-form"),
  formTitle: document.querySelector("#form-title"),
  formFeedback: document.querySelector("#form-feedback"),
  submitButton: document.querySelector("#submit-form-button"),
  nameInput: document.querySelector("#name-input"),
  categoryInput: document.querySelector("#category-input"),
  priceInput: document.querySelector("#price-input"),
  stockInput: document.querySelector("#stock-input"),
  toast: document.querySelector("#toast"),
  totalProducts: document.querySelector("#total-titles"),
  totalCategories: document.querySelector("#total-categories"),
  totalStock: document.querySelector("#total-stock")
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

async function request(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Não foi possível completar a operação.");
  return data;
}

async function loadProducts() {
  if (!state.token) return showLogin();
  try {
    state.products = await request("/produtos");
    renderProducts();
    updateStats();
  } catch (error) {
    if (error.message.includes("Token")) {
      state.token = null;
      sessionStorage.removeItem("token");
      showLogin();
    } else showToast(error.message);
  }
}

function showLogin() {
  elements.loginScreen.hidden = false;
  elements.loginPassword.focus();
}

function hideLogin() {
  elements.loginScreen.hidden = true;
}

async function login(event) {
  event.preventDefault();
  elements.loginFeedback.textContent = "";
  try {
    const data = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: elements.loginEmail.value, senha: elements.loginPassword.value }),
      headers: {}
    });
    state.token = data.token;
    sessionStorage.setItem("token", state.token);
    hideLogin();
    await loadProducts();
  } catch (error) {
    elements.loginFeedback.textContent = error.message;
  }
}

function renderProducts() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const filteredProducts = state.products.filter((product) => `${product.nome} ${product.categoria}`.toLowerCase().includes(search));
  elements.tableBody.innerHTML = filteredProducts.map((product) => `
    <tr>
      <td>${escapeHtml(product.nome)}</td>
      <td><span class="type-tag">${escapeHtml(product.categoria)}</span></td>
      <td>${currency.format(product.preco)}</td>
      <td class="year">${escapeHtml(product.estoque)}</td>
      <td>
        <button class="action-button" data-action="edit" data-id="${product.id}" type="button">Editar</button>
        <button class="action-button delete" data-action="delete" data-id="${product.id}" type="button">Excluir</button>
      </td>
    </tr>`).join("");
  elements.emptyState.hidden = filteredProducts.length > 0;
}

function updateStats() {
  elements.totalProducts.textContent = state.products.length;
  elements.totalCategories.textContent = new Set(state.products.map((product) => product.categoria)).size;
  elements.totalStock.textContent = state.products.reduce((total, product) => total + product.estoque, 0);
}

function openForm(product = null) {
  state.editingId = product?.id || null;
  elements.form.reset();
  elements.formTitle.textContent = product ? "Editar produto" : "Adicionar produto";
  elements.submitButton.textContent = product ? "Salvar alterações" : "Salvar produto";
  elements.formFeedback.textContent = "";
  if (product) {
    elements.nameInput.value = product.nome;
    elements.categoryInput.value = product.categoria;
    elements.priceInput.value = product.preco;
    elements.stockInput.value = product.estoque;
  }
  elements.modal.hidden = false;
  elements.nameInput.focus();
}

function closeForm() {
  elements.modal.hidden = true;
  state.editingId = null;
}

async function saveProduct(event) {
  event.preventDefault();
  const isEditing = Boolean(state.editingId);
  const payload = { nome: elements.nameInput.value.trim(), categoria: elements.categoryInput.value.trim(), preco: Number(elements.priceInput.value), estoque: Number(elements.stockInput.value) };
  const url = state.editingId ? `/produtos/${state.editingId}` : "/produtos";
  const method = state.editingId ? "PUT" : "POST";
  elements.formFeedback.textContent = "";
  try {
    await request(url, { method, body: JSON.stringify(payload) });
    closeForm();
    await loadProducts();
    showToast(isEditing ? "Produto atualizado." : "Produto cadastrado.");
  } catch (error) {
    elements.formFeedback.textContent = error.message;
  }
}

async function deleteProduct(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || !window.confirm(`Excluir ${product.nome}?`)) return;
  try {
    await request(`/produtos/${id}`, { method: "DELETE" });
    await loadProducts();
    showToast("Produto excluído.");
  } catch (error) {
    showToast(error.message);
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("visible"), 2800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

document.querySelector("#open-form-button").addEventListener("click", () => openForm());
document.querySelector("#new-product-link").addEventListener("click", (event) => { event.preventDefault(); openForm(); });
document.querySelector("#close-form-button").addEventListener("click", closeForm);
document.querySelector("#cancel-form-button").addEventListener("click", closeForm);
elements.modal.addEventListener("click", (event) => { if (event.target === elements.modal) closeForm(); });
elements.form.addEventListener("submit", saveProduct);
elements.loginForm.addEventListener("submit", login);
elements.searchInput.addEventListener("input", renderProducts);
elements.tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") openForm(state.products.find((product) => product.id === id));
  if (button.dataset.action === "delete") deleteProduct(id);
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.modal.hidden) closeForm(); });

loadProducts();
