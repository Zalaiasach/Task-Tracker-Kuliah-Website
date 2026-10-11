// ==========================================
// 1. ELEMEN DOM & STATE
// ==========================================
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskCategorySelect = document.getElementById("task-category");
const taskDeadlineInput = document.getElementById("task-deadline");
const btnSubmit = document.getElementById("btn-submit");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const serverErrorBox = document.getElementById("server-error");
const serverErrorMsg = document.getElementById("server-error-msg");
const formErrorBox = document.getElementById("form-error");
const btnRetry = document.getElementById("btn-retry");

const totalCountSpan = document.getElementById("total-count");
const pendingCountSpan = document.getElementById("pending-count");
const completedCountSpan = document.getElementById("completed-count");
const filterButtons = document.querySelectorAll(".filter-btn");
const taskSearchInput = document.getElementById("task-search");

let tasks = [];
let activeFilter = "all";
let searchQuery = "";

// ==========================================
// 2. HELPER api() (Prasyarat 04)
// ==========================================
async function api(url, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.message) errorMsg = errorData.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  // Jika status 204 No Content, jangan parse JSON
  if (res.status === 204) return null;

  return res.json();
}

// ==========================================
// 3. RENDER DOM & UPDATE STATS
// ==========================================
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.isCompleted).length;
  const pending = total - completed;

  totalCountSpan.textContent = total;
  pendingCountSpan.textContent = pending;
  completedCountSpan.textContent = completed;
}

function render() {
  taskList.innerHTML = "";

  // Filter status dan pencarian
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "pending" && !task.isCompleted) ||
      (activeFilter === "completed" && task.isCompleted);

    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (filteredTasks.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.isCompleted ? "completed" : ""}`;
    li.dataset.id = task.id;

    // Info Tugas
    const taskInfo = document.createElement("div");
    taskInfo.className = "task-info";

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-text";
    titleSpan.textContent = task.title;

    const metaDiv = document.createElement("div");
    metaDiv.className = "task-meta";

    const badgeSpan = document.createElement("span");
    badgeSpan.className = "task-badge";
    badgeSpan.textContent = task.category;

    const deadlineSpan = document.createElement("span");
    deadlineSpan.textContent = `deadline: ${task.deadline}`;

    metaDiv.appendChild(badgeSpan);
    metaDiv.appendChild(deadlineSpan);
    taskInfo.appendChild(titleSpan);
    taskInfo.appendChild(metaDiv);

    // Tombol Aksi
    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-action btn-toggle";
    toggleBtn.textContent = task.isCompleted ? "Batal" : "Selesai";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-action btn-delete";
    deleteBtn.textContent = "Hapus";

    taskActions.appendChild(toggleBtn);
    taskActions.appendChild(deleteBtn);

    li.appendChild(taskInfo);
    li.appendChild(taskActions);
    taskList.appendChild(li);
  });

  updateStats();
}

// ==========================================
// 4. PEMUATAN DATA AWAL (Prasyarat 01 & 05: Promise.all)
// ==========================================
async function loadInitialData() {
  loadingState.style.display = "block";
  serverErrorBox.style.display = "none";
  taskList.innerHTML = "";
  emptyState.style.display = "none";

  try {
    const [courses, fetchedTasks] = await Promise.all([
      api("/api/mata-kuliah"),
      api("/api/tugas")
    ]);

    // Isi opsi mata kuliah pada select
    taskCategorySelect.innerHTML = `<option value="" disabled selected>Pilih Mata Kuliah</option>`;
    courses.forEach((course) => {
      const opt = document.createElement("option");
      opt.value = course;
      opt.textContent = course;
      taskCategorySelect.appendChild(opt);
    });

    tasks = fetchedTasks;
    render();
  } catch (error) {
    serverErrorMsg.textContent = error.message || "Gagal memuat data dari server.";
    serverErrorBox.style.display = "block";
  } finally {
    loadingState.style.display = "none";
  }
}

// ==========================================
// 5. EVENT HANDLERS
// ==========================================

// Form Submission (Prasyarat 02: POST /api/tugas)
taskForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  formErrorBox.style.display = "none";

  const payload = {
    title: taskTitleInput.value.trim(),
    category: taskCategorySelect.value,
    deadline: taskDeadlineInput.value
  };

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Menyimpan...";

  try {
    const newTask = await api("/api/tugas", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    tasks.unshift(newTask);
    render();
    taskForm.reset();
  } catch (error) {
    formErrorBox.textContent = error.message;
    formErrorBox.style.display = "block";
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Tambah Tugas";
  }
});

// Event Delegation (Prasyarat 03 & Bonus Optimistic Update)
taskList.addEventListener("click", async function (e) {
  const target = e.target;
  const parentLi = target.closest(".task-item");
  if (!parentLi) return;

  const taskId = parentLi.dataset.id;
  const originalTask = tasks.find((t) => t.id === taskId);
  if (!originalTask) return;

  // Toggle Selesai (PATCH)
  if (target.classList.contains("btn-toggle")) {
    const previousState = originalTask.isCompleted;
    const nextState = !previousState;

    // Optimistic Update: ubah state lokal terlebih dahulu
    tasks = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: nextState } : t));
    render();

    try {
      const updated = await api(`/api/tugas/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted: nextState })
      });
      // Sinkronisasi data respon resmi server
      tasks = tasks.map((t) => (t.id === taskId ? updated : t));
      render();
    } catch (error) {
      alert(`Gagal memperbarui status: ${error.message}. Perubahan dibatalkan.`);
      // Rollback jika server gagal
      tasks = tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: previousState } : t));
      render();
    }
  }

  // Hapus Tugas (DELETE)
  if (target.classList.contains("btn-delete")) {
    const previousTasks = [...tasks];

    // Optimistic Update: hapus langsung dari UI
    tasks = tasks.filter((t) => t.id !== taskId);
    render();

    try {
      await api(`/api/tugas/${taskId}`, { method: "DELETE" });
    } catch (error) {
      alert(`Gagal menghapus tugas: ${error.message}. Tugas dikembalikan.`);
      // Rollback jika server gagal
      tasks = previousTasks;
      render();
    }
  }
});

// Tombol Retry jika Fetch Gagal
btnRetry.addEventListener("click", loadInitialData);

// Filter Status Button
filterButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    filterButtons.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    activeFilter = this.dataset.filter;
    render();
  });
});

// Bonus: Debounce untuk Fitur Pencarian
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

taskSearchInput.addEventListener(
  "input",
  debounce(function (e) {
    searchQuery = e.target.value.trim();
    render();
  }, 300)
);

// Pemuatan data pertama kali
loadInitialData();