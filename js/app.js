import { api } from "./api.js";
import { ui } from "./ui.js";
import { utils } from "./utils.js";

// =====================================================
// APP STATE
// =====================================================
export const app = {
  state: {
    students: [],
    subjects: [],
    subjectColors: {},
    searchTerm: "",
  },

  _loadStudentsController: null, // Keep track of pending requests for loadStudents

  // =====================================================
  // CONTROLLER METHODS
  // =====================================================
  async loadSubjects() {
    const CACHE_KEY = "cache_subjects";
    const TIME_KEY = "cache_subjects_time";
    const CACHE_DURATION = 60 * 60 * 1000; // 1 ora

    // 1. Try to load from cache first
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(TIME_KEY);
    const isFresh =
      cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATION;

    if (cached) {
      try {
        this.state.subjects = JSON.parse(cached);
        this.state.subjects.forEach(
          (s) => (this.state.subjectColors[s.name] = s.color),
        );
        this.updateSubjectSelect();
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(TIME_KEY);
      }
    }

    // 2. Fetch from server ONLY if cache is stale or missing
    if (!isFresh || !this.state.subjects.length) {
      try {
        this.state.subjects = await api.getSubjects();
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.state.subjects));
        localStorage.setItem(TIME_KEY, Date.now().toString());

        this.state.subjectColors = {};
        this.state.subjects.forEach(
          (s) => (this.state.subjectColors[s.name] = s.color),
        );
        this.updateSubjectSelect();
      } catch (error) {
        console.error("Errore caricamento materie:", error);
        // No fallback to hardcoded subjects: show error if nothing exists
        if (!this.state.subjects.length) {
          ui.showToast("Errore nel caricamento delle materie", "error");
        }
      }
    }
  },

  updateSubjectSelect() {
    const select = document.getElementById("subjectSelect");
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Seleziona materia...</option>';
      this.state.subjects.forEach((s) => {
        const option = document.createElement("option");
        option.value = s.name;
        option.textContent = s.name;
        select.appendChild(option);
      });
      select.value = currentValue;
    }
  },

  async loadStudents(forceRefresh = false, skipRender = false) {
    const CACHE_KEY = "cache_students";

    // 1. Initial load from cache if state is empty
    if (!this.state.students.length && !forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          this.state.students = JSON.parse(cached);
          if (!skipRender) {
            ui.updateStats(this.state.students);
            this.render();
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }

    // Abort previous pending request to prevent race conditions
    if (this._loadStudentsController) {
      this._loadStudentsController.abort();
    }
    this._loadStudentsController = new AbortController();
    const signal = this._loadStudentsController.signal;

    try {
      const oldDataStr = JSON.stringify(this.state.students || []);
      const newData = (await api.getStudents(forceRefresh, signal)) || [];

      // Normalize date formats from database immediately
      newData.forEach((student) => {
        student.last_interrogation = utils.normalizeDate(
          student.last_interrogation,
        );
      });

      const newDataStr = JSON.stringify(newData);
      this.state.students = newData;

      // Persist to cache
      localStorage.setItem(CACHE_KEY, newDataStr);

      // Only trigger a full DOM refresh if the data ACTUALLY changed or if forced
      if (!skipRender && (forceRefresh || oldDataStr !== newDataStr)) {
        ui.updateStats(this.state.students);
        this.render();
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Errore caricamento studenti:", error);
      ui.showToast(error.message || "Errore di sincronizzazione", "error");
    }
  },

  // Optimized Init: Parallel loading with a minimum delay for satisfying UX
  async loadData() {
    // Quick fetch subjects and students first to know exact skeleton count
    await Promise.all([this.loadSubjects(), this.loadStudents(false, true)]);

    // Calculate exact student counts per subject
    const studentCounts = {};
    this.state.subjects.forEach((s) => (studentCounts[s.name] = 0));
    this.state.students.forEach((s) => {
      if (studentCounts[s.subject] !== undefined) studentCounts[s.subject]++;
      else studentCounts[s.subject] = 1;
    });

    // Render EXACT number of subjects and exactly the correct number of student rows per subject
    ui.renderSkeletons(this.state.subjects, studentCounts);

    // Ensure skeletons show for at least 800ms to avoid jarring flashes on fast network
    const minimumWait = new Promise((resolve) => setTimeout(resolve, 800));
    await minimumWait;

    ui.updateStats(this.state.students);
    this.render();
  },

  render() {
    ui.render(
      this.state.students,
      this.state.subjectColors,
      this.state.searchTerm,
    );
  },

  // Helper for optimistic UI updates
  async optimisticUpdate(
    actionFn,
    apiFn,
    errorMsg = "Errore di connessione. Modifica annullata.",
  ) {
    // 1. Apply local change
    actionFn();
    ui.updateStats(this.state.students);
    this.render();

    try {
      // 2. Call API
      await apiFn();
      // Optional: Reload to sync server state (can receive args to decide)
    } catch (error) {
      console.error(error);
      // 3. Re-sync on error (safer than reverting to potentially stale state)
      this.loadStudents(true);
      ui.showToast(errorMsg, "error");
    }
  },

  async addStudent() {
    const nameInput = document.getElementById("nameInput");
    const dateInput = document.getElementById("dateInput");
    const subjectSelect = document.getElementById("subjectSelect");
    const gradesCountInput = document.getElementById("gradesCountInput");

    const name = nameInput.value.trim();
    const date = dateInput.value;
    const subject = subjectSelect.value;
    const grades_count = parseInt(gradesCountInput.value) || 0;

    if (!name) {
      ui.showToast("Inserisci il nome dello studente!", "error");
      nameInput.focus();
      return;
    }
    if (!subject) {
      ui.showToast("Seleziona una materia!", "error");
      return;
    }

    const finalDate = date || "9999-12-31";

    try {
      const newStudent = await api.addStudent({
        name,
        last_interrogation: finalDate,
        subject,
        grades_count,
      });

      // Normalize date format from database
      newStudent.last_interrogation = utils.normalizeDate(
        newStudent.last_interrogation,
      );

      nameInput.value = "";
      dateInput.value = "";
      gradesCountInput.value = "0";

      this.state.students.push(newStudent);
      ui.updateStats(this.state.students);
      ui.showToast("Studente salvato con successo!", "success");
      this.render();
    } catch (error) {
      ui.showToast("Errore durante il salvataggio!", "error");
      console.error(error);
    }
  },

  async deleteStudent(id) {
    if (
      !(await ui.confirmDialog(
        "Sei sicuro di voler eliminare questo studente?",
      ))
    )
      return;

    await this.optimisticUpdate(
      () => {
        this.state.students = this.state.students.filter((s) => s.id !== id);
      },
      () => api.deleteStudent(id),
      "Errore di connessione. Eliminazione annullata.",
    );
  },

  async incrementGrade(id, currentGrades) {
    await this.optimisticUpdate(
      () => {
        const s = this.state.students.find((s) => s.id === id);
        if (s) s.grades_count = (currentGrades || 0) + 1;
      },
      () => api.updateStudent({ id, grades_count: currentGrades + 1 }),
    );
  },

  async updateStudentName(id, currentName) {
    const newName = await ui.promptDialog(
      "Inserisci il nuovo nome:",
      currentName,
    );
    if (!newName || newName === currentName) return;

    await this.optimisticUpdate(
      () => {
        const s = this.state.students.find((s) => s.id === id);
        if (s) s.name = newName;
      },
      () => api.updateStudent({ id, name: newName }),
      "Errore durante l'aggiornamento del nome",
    );
  },

  async updateStudentGrades(id, currentGrades) {
    const newGradesStr = await ui.promptDialog(
      "Modifica numero voti:",
      currentGrades,
    );
    if (newGradesStr === null) return;
    const newGrades = parseInt(newGradesStr);

    if (isNaN(newGrades) || newGrades < 0 || newGrades === currentGrades)
      return;

    await this.optimisticUpdate(
      () => {
        const s = this.state.students.find((s) => s.id === id);
        if (s) s.grades_count = newGrades;
      },
      () => api.updateStudent({ id, grades_count: newGrades }),
      "Errore durante l'aggiornamento voti",
    );
  },

  async registerInterrogation(id, currentGrades) {
    const today = new Date().toISOString().split("T")[0];
    const newDate = await ui.promptDialog(
      "Inserisci data interrogazione (AAAA-MM-GG):",
      today,
    );
    if (!newDate) return;

    // Simple Regex Validation YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      ui.showToast("Formato data non valido! Usa AAAA-MM-GG", "error");
      return;
    }

    await this.optimisticUpdate(
      () => {
        const s = this.state.students.find((s) => s.id === id);
        if (s) {
          s.last_interrogation = newDate; // Already in YYYY-MM-DD format
          s.grades_count = (currentGrades || 0) + 1;
        }
      },
      () =>
        api.updateStudent({
          id,
          last_interrogation: newDate,
          grades_count: (currentGrades || 0) + 1,
        }),
      "Errore durante la registrazione dell'interrogazione",
    );
  },

  async addNewSubject() {
    const nameInput = document.getElementById("newSubjectName");
    const colorInput = document.getElementById("newSubjectColor");

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) return ui.showToast("Inserisci il nome della materia", "error");

    try {
      const newSubject = await api.addSubject({ name, color });

      nameInput.value = "";

      // Optimization: Update local state instead of re-fetching
      this.state.subjects.push(newSubject);
      this.state.subjectColors[newSubject.name] = newSubject.color;
      localStorage.setItem(
        "cache_subjects",
        JSON.stringify(this.state.subjects),
      );
      localStorage.setItem("cache_subjects_time", Date.now().toString());

      // Update Select
      const select = document.getElementById("subjectSelect");
      if (select) {
        const option = document.createElement("option");
        option.value = newSubject.name;
        option.textContent = newSubject.name;
        select.appendChild(option);
      }

      // If modal is open, re-render list
      const modal = document.getElementById("subjectsModal");
      if (modal && !modal.classList.contains("hidden")) {
        ui.renderSubjectsList(this.state.subjects, this.state.students);
      }
    } catch (error) {
      ui.showToast("Errore aggiunta materia", "error");
      console.error("Errore aggiunta materia:", error);
    }
  },

  async deleteSubject(name) {
    if (!(await ui.confirmDialog(`Eliminare la materia "${name}"?`))) return;

    try {
      await api.deleteSubject(name);

      // Optimization: Local update
      this.state.subjects = this.state.subjects.filter((s) => s.name !== name);
      delete this.state.subjectColors[name];
      localStorage.setItem(
        "cache_subjects",
        JSON.stringify(this.state.subjects),
      );
      localStorage.setItem("cache_subjects_time", Date.now().toString());

      // Update Select
      const select = document.getElementById("subjectSelect");
      if (select) {
        const option = Array.from(select.options).find((o) => o.value === name);
        if (option) option.remove();
      }

      // Update modal list if open
      const modal = document.getElementById("subjectsModal");
      if (modal && !modal.classList.contains("hidden")) {
        ui.renderSubjectsList(this.state.subjects, this.state.students);
      }
      ui.showToast(`Materia "${name}" eliminata`, "success");
    } catch (error) {
      ui.showToast(error.message || "Errore eliminazione", "error");
    }
  },

  // =====================================================
  // UI HELPERS
  // =====================================================
  setToday() {
    document.getElementById("dateInput").valueAsDate = new Date();
  },

  setYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    document.getElementById("dateInput").valueAsDate = yesterday;
  },

  setLastWeek() {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    document.getElementById("dateInput").valueAsDate = lastWeek;
  },

  openSubjectsModal() {
    const modal = document.getElementById("subjectsModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    ui.renderSubjectsList(this.state.subjects, this.state.students);
  },

  closeSubjectsModal() {
    const modal = document.getElementById("subjectsModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  handleSearch(e) {
    this.state.searchTerm = e.target.value.toLowerCase();
    this.render();
  },

  // =====================================================
  // AUTH
  // =====================================================
  showLogin() {
    const loginScreen = document.getElementById("loginScreen");
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
      loginScreen.classList.add("flex");
      const input = document.getElementById("authCodeInput");
      if (input) {
        input.focus();
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") this.submitLogin();
        });
      }
    }
  },

  hideLogin() {
    const loginScreen = document.getElementById("loginScreen");
    if (loginScreen) {
      loginScreen.classList.add("hidden");
      loginScreen.classList.remove("flex");
    }
  },

  async submitLogin() {
    const input = document.getElementById("authCodeInput");
    const errorEl = document.getElementById("authError");
    const btn = document.getElementById("authSubmitBtn");
    if (!input) return;

    const code = input.value.trim();
    if (!code) {
      errorEl?.classList.remove("hidden");
      return;
    }

    // Disable button during request
    if (btn) btn.disabled = true;

    try {
      // No longer need to store code in localStorage
      await api.verifyCode(code);

      // Success - Set a flag that we are logged in (not the sensitive code)
      localStorage.setItem("is_logged_in", "true");
      localStorage.setItem("login_time", Date.now().toString());

      errorEl?.classList.add("hidden");
      this.hideLogin();
      await this.loadData();
    } catch (error) {
      localStorage.removeItem("is_logged_in");
      if (errorEl) {
        errorEl.textContent = error.message || "Codice errato, riprova";
        errorEl.classList.remove("hidden");
      }
      input.value = "";
      input.focus();
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  checkAuth() {
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
    if (!isLoggedIn) return false;

    // Session expiration check (Client side defense-in-depth)
    const loginTime = localStorage.getItem("login_time");
    const MAX_SESSION = 7 * 24 * 60 * 60 * 1000; // 7 days (matching cookie)

    if (!loginTime || Date.now() - parseInt(loginTime) > MAX_SESSION) {
      localStorage.removeItem("is_logged_in");
      localStorage.removeItem("login_time");
      return false;
    }
    return true;
  },

  // =====================================================
  // INITIALIZATION
  // =====================================================
  async init() {
    this.setupEventListeners();

    if (!this.checkAuth()) {
      this.showLogin();
      return;
    }

    try {
      await this.loadData();
    } catch (error) {
      console.error("Critical Init Error:", error);
      ui.showToast("Errore di caricamento iniziale", "error");
    }

    // Smart Polling
    setInterval(() => {
      if (!document.hidden && this.checkAuth()) {
        this.loadStudents();
      }
    }, 30000);
  },

  setupEventListeners() {
    // Auth
    document
      .getElementById("authSubmitBtn")
      ?.addEventListener("click", () => this.submitLogin());
    document
      .getElementById("authCodeInput")
      ?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.submitLogin();
      });

    // Student Management
    document
      .getElementById("addStudentBtn")
      ?.addEventListener("click", () => this.addStudent());
    document.getElementById("nameInput")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addStudent();
    });

    // Date Shortcuts
    document
      .getElementById("setTodayBtn")
      ?.addEventListener("click", () => this.setToday());
    document
      .getElementById("setYesterdayBtn")
      ?.addEventListener("click", () => this.setYesterday());
    document
      .getElementById("setLastWeekBtn")
      ?.addEventListener("click", () => this.setLastWeek());

    // Modal Management
    document
      .getElementById("openSubjectsModalBtn")
      ?.addEventListener("click", () => this.openSubjectsModal());
    document
      .getElementById("closeSubjectsModalBtn")
      ?.addEventListener("click", () => this.closeSubjectsModal());
    document
      .getElementById("addNewSubjectBtn")
      ?.addEventListener("click", () => this.addNewSubject());

    // Backdrop click to close modal
    const modal = document.getElementById("subjectsModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.id === "subjectsModal") this.closeSubjectsModal();
      });
    }

    // Search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        utils.debounce((e) => {
          this.state.searchTerm = e.target.value;
          this.render();
        }, 300),
      );
    }

    // Global Event Listeners
    window.addEventListener("auth-expired", () => this.showLogin());
  },
};

// Export globally for UI callbacks
window.app = app;

// Start app when resources are fully loaded
window.addEventListener("load", () => {
  app.init();
});
