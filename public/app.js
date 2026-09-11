const state = { titles: [], editingId: null };

const elements = {
  tableBody: document.querySelector("#titles-table-body"),
  emptyState: document.querySelector("#empty-state"),
  searchInput: document.querySelector("#search-input"),
  modal: document.querySelector("#modal-backdrop"),
  form: document.querySelector("#title-form"),
  formTitle: document.querySelector("#form-title"),
  formFeedback: document.querySelector("#form-feedback"),
  submitButton: document.querySelector("#submit-form-button"),
  titleInput: document.querySelector("#title-input"),
  typeInput: document.querySelector("#type-input"),
  genreInput: document.querySelector("#genre-input"),
  yearInput: document.querySelector("#year-input"),
  toast: document.querySelector("#toast"),
  totalTitles: document.querySelector("#total-titles"),
  totalMovies: document.querySelector("#total-movies"),
  totalSeries: document.querySelector("#total-series")
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Não foi possível completar a operação.");
  return data;
}

async function loadTitles() {
  try {
    state.titles = await request("/titulos");
    renderTitles();
    updateStats();
  } catch (error) {
    showToast(error.message);
  }
}

function renderTitles() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const filteredTitles = state.titles.filter((title) => `${title.titulo} ${title.tipo} ${title.genero} ${title.ano}`.toLowerCase().includes(search));
  elements.tableBody.innerHTML = filteredTitles.map((title) => `
    <tr>
      <td>${escapeHtml(title.titulo)}</td>
      <td><span class="type-tag ${title.tipo === "Série" ? "series" : "movie"}">${escapeHtml(title.tipo)}</span></td>
      <td>${escapeHtml(title.genero)}</td>
      <td class="year">${escapeHtml(title.ano)}</td>
      <td>
        <button class="action-button" data-action="edit" data-id="${title.id}" type="button">Editar</button>
        <button class="action-button delete" data-action="delete" data-id="${title.id}" type="button">Excluir</button>
      </td>
    </tr>`).join("");
  elements.emptyState.hidden = filteredTitles.length > 0;
}

function updateStats() {
  elements.totalTitles.textContent = state.titles.length;
  elements.totalMovies.textContent = state.titles.filter((title) => title.tipo === "Filme").length;
  elements.totalSeries.textContent = state.titles.filter((title) => title.tipo === "Série").length;
}

function openForm(title = null) {
  state.editingId = title?.id || null;
  elements.form.reset();
  elements.formTitle.textContent = title ? "Editar título" : "Adicionar título";
  elements.submitButton.textContent = title ? "Salvar alterações" : "Salvar título";
  elements.formFeedback.textContent = "";
  if (title) {
    elements.titleInput.value = title.titulo;
    elements.typeInput.value = title.tipo;
    elements.genreInput.value = title.genero;
    elements.yearInput.value = title.ano;
  }
  elements.modal.hidden = false;
  elements.titleInput.focus();
}

function closeForm() {
  elements.modal.hidden = true;
  state.editingId = null;
}

async function saveTitle(event) {
  event.preventDefault();
  const isEditing = Boolean(state.editingId);
  const payload = { titulo: elements.titleInput.value.trim(), tipo: elements.typeInput.value, genero: elements.genreInput.value.trim(), ano: Number(elements.yearInput.value) };
  const url = state.editingId ? `/titulos/${state.editingId}` : "/titulos";
  const method = state.editingId ? "PUT" : "POST";
  elements.formFeedback.textContent = "";
  try {
    await request(url, { method, body: JSON.stringify(payload) });
    closeForm();
    await loadTitles();
    showToast(isEditing ? "Título atualizado." : "Título cadastrado.");
  } catch (error) {
    elements.formFeedback.textContent = error.message;
  }
}

async function deleteTitle(id) {
  const title = state.titles.find((item) => item.id === id);
  if (!title || !window.confirm(`Excluir ${title.titulo}?`)) return;
  try {
    await request(`/titulos/${id}`, { method: "DELETE" });
    await loadTitles();
    showToast("Título excluído.");
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
document.querySelector("#new-title-link").addEventListener("click", (event) => { event.preventDefault(); openForm(); });
document.querySelector("#close-form-button").addEventListener("click", closeForm);
document.querySelector("#cancel-form-button").addEventListener("click", closeForm);
elements.modal.addEventListener("click", (event) => { if (event.target === elements.modal) closeForm(); });
elements.form.addEventListener("submit", saveTitle);
elements.searchInput.addEventListener("input", renderTitles);
elements.tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") openForm(state.titles.find((title) => title.id === id));
  if (button.dataset.action === "delete") deleteTitle(id);
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.modal.hidden) closeForm(); });

loadTitles();
