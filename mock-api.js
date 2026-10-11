// Simulasi Penyimpanan REST API di LocalStorage
(function () {
  let mode = "normal"; // "normal", "lambat", "offline"

  // Inisialisasi data awal jika kosong
  if (!localStorage.getItem("__mock_tugas")) {
    const initialTasks = [
      { id: "1", title: "Lab 10 event delegation", category: "Pemrograman Web", deadline: "2026-10-08", isCompleted: false },
      { id: "2", title: "Ringkasan materi async/await", category: "Pemrograman Web", deadline: "2026-10-10", isCompleted: false }
    ];
    localStorage.setItem("__mock_tugas", JSON.stringify(initialTasks));
  }

  const courses = ["Pemrograman Web", "Basis Data", "Jaringan Komputer", "Sistem Operasi", "Struktur Data"];

  const getTasks = () => JSON.parse(localStorage.getItem("__mock_tugas") || "[]");
  const saveTasks = (tasks) => localStorage.setItem("__mock_tugas", JSON.stringify(tasks));

  // Simpan fetch bawaan
  const originalFetch = window.fetch;

  window.fetch = async function (url, options = {}) {
    if (typeof url === "string" && url.startsWith("/api/")) {
      // 06: Simulasi mode offline
      if (mode === "offline") {
        throw new TypeError("Failed to fetch: Network is offline");
      }

      // Simulasi delay (mode lambat = 2500ms, normal = 300ms)
      const delayTime = mode === "lambat" ? 2500 : 300;
      await new Promise((r) => setTimeout(r, delayTime));

      const method = (options.method || "GET").toUpperCase();

      // GET /api/mata-kuliah
      if (url === "/api/mata-kuliah" && method === "GET") {
        return new Response(JSON.stringify(courses), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // GET /api/tugas
      if (url === "/api/tugas" && method === "GET") {
        return new Response(JSON.stringify(getTasks()), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // POST /api/tugas
      if (url === "/api/tugas" && method === "POST") {
        const body = JSON.parse(options.body || "{}");
        if (!body.title || body.title.trim().length < 3) {
          return new Response(
            JSON.stringify({ message: "Judul tugas minimal 3 karakter." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!body.category || !body.deadline) {
          return new Response(
            JSON.stringify({ message: "Mata kuliah dan tenggat waktu wajib diisi." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const currentTasks = getTasks();
        const newTask = {
          id: Date.now().toString(),
          title: body.title.trim(),
          category: body.category,
          deadline: body.deadline,
          isCompleted: false
        };
        currentTasks.unshift(newTask);
        saveTasks(currentTasks);

        return new Response(JSON.stringify(newTask), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      }

      // PATCH /api/tugas/:id
      if (url.startsWith("/api/tugas/") && method === "PATCH") {
        const id = url.split("/")[3];
        const body = JSON.parse(options.body || "{}");
        const currentTasks = getTasks();
        const taskIndex = currentTasks.findIndex((t) => t.id === id);

        if (taskIndex === -1) {
          return new Response(JSON.stringify({ message: "Tugas tidak ditemukan." }), { status: 404 });
        }

        currentTasks[taskIndex] = { ...currentTasks[taskIndex], ...body };
        saveTasks(currentTasks);

        return new Response(JSON.stringify(currentTasks[taskIndex]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // DELETE /api/tugas/:id (Status 204)
      if (url.startsWith("/api/tugas/") && method === "DELETE") {
        const id = url.split("/")[3];
        let currentTasks = getTasks();
        currentTasks = currentTasks.filter((t) => t.id !== id);
        saveTasks(currentTasks);

        return new Response(null, { status: 204 });
      }
    }

    return originalFetch.apply(this, arguments);
  };

  // Expose kontrol __API.setMode() untuk pengujian console
  window.__API = {
    setMode: function (newMode) {
      if (["normal", "lambat", "offline"].includes(newMode)) {
        mode = newMode;
        console.log(`[Mock API] Mode diubah ke: ${newMode}`);
      } else {
        console.warn("[Mock API] Mode yang valid: 'normal', 'lambat', 'offline'");
      }
    }
  };
})();