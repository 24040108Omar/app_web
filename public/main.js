const API = "/api";

// Toastr solo si está disponible
function showToast(type, msg) {
  if (typeof toastr !== "undefined") {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-bottom-right",
      timeOut: 2500
    };
    toastr[type](msg);
  }
}

// -------------------- SESSION --------------------
function setSession(session) {
  localStorage.setItem("session", JSON.stringify(session));
}
function getSession() {
  const raw = localStorage.getItem("session");
  return raw ? JSON.parse(raw) : null;
}
function clearSession() {
  localStorage.removeItem("session");
}
function pageName() {
  return (location.pathname.split("/").pop() || "").toLowerCase();
}

// Proteger rutas
function protectRoutes() {
  const page = pageName();
  const session = getSession();

  const isAdminPage = page === "admin.html";
  const isUserPage = page === "user.html";

  if ((isAdminPage || isUserPage) && !session) {
    location.href = "login.html";
    return;
  }

  if (isAdminPage && session?.rol !== "admin") {
    location.href = "user.html";
    return;
  }

  if (isUserPage && session?.rol !== "user") {
    location.href = "admin.html";
    return;
  }

  const welcome = document.getElementById("welcomeTitle");
  if (welcome && session?.rol === "user") {
    welcome.textContent = `Bienvenido ${session.nombre} a tus cursos`;
  }

  const sessionInfo = document.getElementById("sessionInfo");
  if (sessionInfo && session) {
    sessionInfo.textContent = `Conectado como: ${session.nombre} (${session.email}) — Rol: ${session.rol}`;
  }
}

// -------------------- AUTH --------------------
async function login(email, contrasena) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo iniciar sesión");
  return data;
}

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    try {
      const data = await login(email, contrasena);

      setSession({
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.nombre,
        rol: data.user.rol
      });

      showToast("success", "Sesión iniciada ✅");

      setTimeout(() => {
        if (data.user.rol === "admin") location.href = "admin.html";
        else location.href = "user.html";
      }, 400);

    } catch (err) {
      showToast("error", err.message || "Error");
    }
  });
}

function initLogout() {
  const btn = document.getElementById("btnLogout");
  if (!btn) return;

  btn.addEventListener("click", () => {
    clearSession();
    location.href = "login.html";
  });
}

// -------------------- HELPERS --------------------
const CURSOS_API = `${API}/cursos-reg`;

async function apiGetCursos() {
  const res = await fetch(CURSOS_API);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al cargar cursos");
  return data;
}
async function apiCreateCurso(payload) {
  const res = await fetch(CURSOS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al crear curso");
  return data;
}
async function apiUpdateCurso(id, payload) {
  const res = await fetch(`${CURSOS_API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al actualizar curso");
  return data;
}
async function apiDeleteCurso(id) {
  const res = await fetch(`${CURSOS_API}/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al eliminar curso");
  return data;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "$0.00";
  return `$${x.toFixed(2)}`;
}

function nivelClass(nivel) {
  if (nivel === "Básico") return "nivel-basico";
  if (nivel === "Intermedio") return "nivel-intermedio";
  if (nivel === "Avanzado") return "nivel-avanzado";
  return "";
}

// -------------------- INDEX: CURSOS PÚBLICOS --------------------
function initPublicCursos() {
  if (pageName() !== "index.html" && pageName() !== "") return;

  const grid = document.getElementById("publicCourseGrid");
  const emptyMsg = document.getElementById("emptyCursosPublic");
  const statCursos = document.getElementById("statCursos");
  const filterRow = document.getElementById("filterRow");
  if (!grid) return;

  let allCursos = [];

  function renderPublicCards(cursos) {
    if (!cursos.length) {
      grid.innerHTML = "";
      if (emptyMsg) emptyMsg.hidden = false;
      return;
    }
    if (emptyMsg) emptyMsg.hidden = true;

    grid.innerHTML = cursos.map((c, i) => `
      <div class="courseCard" style="animation-delay:${i * 0.07}s" data-nivel="${escapeHtml(c.nivel)}">
        <span class="nivel-badge ${nivelClass(c.nivel)}">${escapeHtml(c.nivel)}</span>
        <h4>${escapeHtml(c.nombre_curso)}</h4>
        <p>👨‍🏫 ${escapeHtml(c.profesor_curso)}</p>
        <p>⏱ ${c.horas_curso} horas</p>
        <p class="price">${money(c.costo)}</p>
      </div>
    `).join("");
  }

  function applyFilter(nivel) {
    if (nivel === "Todos") {
      renderPublicCards(allCursos);
    } else {
      renderPublicCards(allCursos.filter(c => c.nivel === nivel));
    }
  }

  // Filter buttons
  if (filterRow) {
    filterRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterRow.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.dataset.nivel);
    });
  }

  apiGetCursos()
    .then(data => {
      allCursos = data;
      renderPublicCards(allCursos);
      if (statCursos) statCursos.textContent = allCursos.length;
    })
    .catch(() => {
      if (emptyMsg) emptyMsg.hidden = false;
    });
}

// -------------------- CURSOS ADMIN --------------------
function cursoCardHTML(c, extra = "") {
  return `
    <div class="courseCard" data-id="${c.id}">
      <span class="nivel-badge ${nivelClass(c.nivel)}">${escapeHtml(c.nivel)}</span>
      <h4>${escapeHtml(c.nombre_curso)}</h4>
      <p>👨‍🏫 ${escapeHtml(c.profesor_curso)}</p>
      <p>⏱ ${c.horas_curso} horas</p>
      <p class="price">${money(c.costo)}</p>
      ${extra}
    </div>
  `;
}

function hideAllPanels() {
  ["panelCrear", "panelActualizar", "panelEliminar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  });
}

function initAdminCursos() {
  if (pageName() !== "admin.html") return;

  const gridMain     = document.getElementById("courseGrid");
  const emptyCursos  = document.getElementById("emptyCursos");
  const panelCrear   = document.getElementById("panelCrear");
  const panelAct     = document.getElementById("panelActualizar");
  const panelElim    = document.getElementById("panelEliminar");
  const btnCrear     = document.getElementById("btnCrear");
  const btnActualizar= document.getElementById("btnActualizar");
  const btnEliminar  = document.getElementById("btnEliminar");
  const pickGrid     = document.getElementById("pickGrid");
  const emptyPick    = document.getElementById("emptyPick");
  const deleteGrid   = document.getElementById("deleteGrid");
  const emptyDelete  = document.getElementById("emptyDelete");

  const c_nombre  = document.getElementById("c_nombre");
  const c_profesor= document.getElementById("c_profesor");
  const c_horas   = document.getElementById("c_horas");
  const c_costo   = document.getElementById("c_costo");
  const c_nivel   = document.getElementById("c_nivel");
  const btnGuardar= document.getElementById("btnGuardarCurso");

  const u_id      = document.getElementById("u_id");
  const u_nombre  = document.getElementById("u_nombre");
  const u_profesor= document.getElementById("u_profesor");
  const u_horas   = document.getElementById("u_horas");
  const u_costo   = document.getElementById("u_costo");
  const u_nivel   = document.getElementById("u_nivel");
  const btnUpdate = document.getElementById("btnUpdateCurso");

  let cursosCache = [];

  function renderMainCursos() {
    if (!cursosCache.length) {
      emptyCursos.hidden = false;
      gridMain.innerHTML = "";
      return;
    }
    emptyCursos.hidden = true;
    gridMain.innerHTML = cursosCache.map(c => cursoCardHTML(c)).join("");
  }

  async function refreshAll() {
    cursosCache = await apiGetCursos();
    renderMainCursos();
    renderPick();
    renderDelete();
  }

  function renderPick() {
    if (!pickGrid) return;
    if (!cursosCache.length) { emptyPick.hidden = false; pickGrid.innerHTML = ""; return; }
    emptyPick.hidden = true;
    pickGrid.innerHTML = cursosCache.map(c => cursoCardHTML(c)).join("");
  }

  function renderDelete() {
    if (!deleteGrid) return;
    if (!cursosCache.length) { emptyDelete.hidden = false; deleteGrid.innerHTML = ""; return; }
    emptyDelete.hidden = true;
    deleteGrid.innerHTML = cursosCache.map(c =>
      cursoCardHTML(c, `<button class="trash" data-trash="1" title="Eliminar">🗑</button>`)
    ).join("");
  }

  function showPanel(which) {
    hideAllPanels();
    if (which === "crear")      panelCrear.hidden = false;
    if (which === "actualizar") panelAct.hidden = false;
    if (which === "eliminar")   panelElim.hidden = false;
  }

  btnCrear.addEventListener("click", () => showPanel("crear"));
  btnActualizar.addEventListener("click", () => showPanel("actualizar"));
  btnEliminar.addEventListener("click", () => showPanel("eliminar"));

  btnGuardar.addEventListener("click", async () => {
    const payload = {
      nombre_curso:   c_nombre.value.trim(),
      profesor_curso: c_profesor.value.trim(),
      horas_curso:    Number(c_horas.value),
      costo:          Number(c_costo.value),
      nivel:          c_nivel.value
    };
    if (!payload.nombre_curso || !payload.profesor_curso || !payload.horas_curso || payload.costo === undefined || !payload.nivel) {
      showToast("warning", "Completa todos los campos");
      return;
    }
    try {
      await apiCreateCurso(payload);
      showToast("success", "Curso creado ✅");
      [c_nombre, c_profesor, c_horas, c_costo].forEach(el => el.value = "");
      c_nivel.value = "";
      await refreshAll();
    } catch (e) { showToast("error", e.message || "Error"); }
  });

  pickGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".courseCard");
    if (!card) return;
    const id = Number(card.dataset.id);
    const curso = cursosCache.find(c => c.id === id);
    if (!curso) return;
    [...pickGrid.querySelectorAll(".courseCard")].forEach(x => x.classList.remove("selected"));
    card.classList.add("selected");
    u_id.value      = curso.id;
    u_nombre.value  = curso.nombre_curso;
    u_profesor.value= curso.profesor_curso;
    u_horas.value   = curso.horas_curso;
    u_costo.value   = curso.costo;
    u_nivel.value   = curso.nivel;
    showToast("info", "Curso cargado para editar");
  });

  btnUpdate.addEventListener("click", async () => {
    const id = Number(u_id.value);
    if (!id) { showToast("warning", "Selecciona un curso primero"); return; }
    const payload = {
      nombre_curso:   u_nombre.value.trim(),
      profesor_curso: u_profesor.value.trim(),
      horas_curso:    Number(u_horas.value),
      costo:          Number(u_costo.value),
      nivel:          u_nivel.value
    };
    if (!payload.nombre_curso || !payload.profesor_curso || !payload.horas_curso || !payload.nivel) {
      showToast("warning", "Completa todos los campos");
      return;
    }
    try {
      await apiUpdateCurso(id, payload);
      showToast("success", "Curso actualizado ✏️");
      await refreshAll();
    } catch (e) { showToast("error", e.message || "Error"); }
  });

  deleteGrid.addEventListener("click", async (e) => {
    const trash = e.target.closest("button[data-trash]");
    const card  = e.target.closest(".courseCard");
    if (!card) return;
    const id = Number(card.dataset.id);
    if (!trash) {
      [...deleteGrid.querySelectorAll(".courseCard")].forEach(x => x.classList.remove("selected"));
      card.classList.add("selected");
      return;
    }
    if (!confirm("¿Seguro de eliminar este curso?")) return;
    try {
      await apiDeleteCurso(id);
      showToast("success", "Curso eliminado 🗑️");
      await refreshAll();
    } catch (e) { showToast("error", e.message || "Error"); }
  });

  refreshAll().catch(err => showToast("error", err.message || "Error al cargar"));
}

// -------------------- INIT --------------------
protectRoutes();
initLoginForm();
initLogout();
initPublicCursos();
initAdminCursos();