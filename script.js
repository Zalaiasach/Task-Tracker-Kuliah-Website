// ==========================================
// 1. ELEMEN SELEKSI DOM
// ==========================================
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskCategoryInput = document.getElementById("task-category");
const taskDeadlineInput = document.getElementById("task-deadline");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const totalCountSpan = document.getElementById("total-count");
const completedCountSpan = document.getElementById("completed-count");

const filterButtons = document.querySelectorAll(".filter-btn");

// State data tugas
let tasks = [];
let activeFilter = "all";

// ==========================================
// 2. FUNGSI PEMBARUAN & RENDER DOM
// ==========================================
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.isCompleted).length;

  totalCountSpan.textContent = total;
  completedCountSpan.textContent = completed;
}

function renderTasks() {
  // Kosongkan kontainer daftar sebelum render ulang
  taskList.innerHTML = "";

  // Saring data berdasarkan filter yang aktif
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "pending") return !task.isCompleted;
    if (activeFilter === "completed") return task.isCompleted;
    return true;
  });

  // Tampilkan atau sembunyikan penanda daftar kosong
  if (filteredTasks.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  // Buat node DOM untuk setiap data tugas
  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.isCompleted ? "completed" : ""}`;
    li.dataset.id = task.id;

    // Struktur komponen info tugas
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
    deadlineSpan.textContent = `Deadline: ${task.deadline}`;

    metaDiv.appendChild(badgeSpan);
    metaDiv.appendChild(deadlineSpan);
    taskInfo.appendChild(titleSpan);
    taskInfo.appendChild(metaDiv);

    // Tombol aksi tugas
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

    // Gabungkan seluruh elemen ke dalam <li>
    li.appendChild(taskInfo);
    li.appendChild(taskActions);

    taskList.appendChild(li);
  });

  updateStats();
}

// ==========================================
// 3. EVENT HANDLING
// ==========================================

// Event submit form (Menambah tugas baru)
taskForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Mencegah reload halaman

  const newTask = {
    id: Date.now().toString(),
    title: taskTitleInput.value.trim(),
    category: taskCategoryInput.value,
    deadline: taskDeadlineInput.value,
    isCompleted: false,
  };

  tasks.push(newTask);
  renderTasks();

  // Reset kolom input formulir
  taskForm.reset();
});

// Event Delegation pada taskList (Toggle Status & Hapus)
taskList.addEventListener("click", function (event) {
  const target = event.target;
  const parentLi = target.closest(".task-item");

  if (!parentLi) return;

  const taskId = parentLi.dataset.id;

  // Aksi tombol toggle status
  if (target.classList.contains("btn-toggle")) {
    tasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, isCompleted: !task.isCompleted };
      }
      return task;
    });
    renderTasks();
  }

  // Aksi tombol hapus tugas
  if (target.classList.contains("btn-delete")) {
    tasks = tasks.filter((task) => task.id !== taskId);
    renderTasks();
  }
});

// Event handling filter tugas (Menggunakan forEach pada NodeList)
filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

    activeFilter = this.dataset.filter;
    renderTasks();
  });
});

// Jalankan render awal saat berkas dimuat
renderTasks();