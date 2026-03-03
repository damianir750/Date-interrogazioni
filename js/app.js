import { api } from './api.js';
import { ui } from './ui.js';
import { utils } from './utils.js';

// =====================================================
// APP STATE
// =====================================================
const app = {
    state: {
        students: [],
        subjects: [],
        subjectColors: {},
        searchTerm: ''
    },

    // =====================================================
    // CONTROLLER METHODS
    // =====================================================
    async loadSubjects() {
        try {
            this.state.subjects = await api.getSubjects();
            this.state.subjectColors = {};

            const select = document.getElementById('subjectSelect');
            if (select) {
                select.innerHTML = '<option value="">Seleziona materia...</option>';
                this.state.subjects.forEach(s => {
                    this.state.subjectColors[s.name] = s.color;
                    const option = document.createElement('option');
                    option.value = s.name;
                    option.textContent = s.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Errore caricamento materie:', error);
            // Fallback
            const fallback = [
                { name: 'Italiano', color: '#9b5de5' },
                { name: 'Storia', color: '#ff7b00' },
                { name: 'Matematica', color: '#06d6a0' }
            ];
            this.state.subjects = fallback;
            fallback.forEach(s => this.state.subjectColors[s.name] = s.color);

            const select = document.getElementById('subjectSelect');
            if (select) {
                select.innerHTML = '<option value="">Seleziona materia...</option>';
                fallback.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.name;
                    option.textContent = s.name;
                    select.appendChild(option);
                });
            }
        }
    },

    async loadStudents(forceRefresh = false, skipRender = false) {
        try {
            this.state.students = await api.getStudents(forceRefresh) || [];

            // Normalize date formats from database
            this.state.students.forEach(student => {
                student.last_interrogation = utils.normalizeDate(student.last_interrogation);
            });

            if (!skipRender) {
                ui.updateStats(this.state.students);
                this.render();
            }
        } catch (error) {
            console.error('Errore caricamento constuenti:', error);
        }
    },

    // Optimized Init: Parallel loading with a minimum delay for satisfying UX
    async loadData() {
        // Quick fetch subjects and students first to know exact skeleton count
        await Promise.all([
            this.loadSubjects(),
            this.loadStudents(false, true)
        ]);

        // Calculate exact student counts per subject
        const studentCounts = {};
        this.state.subjects.forEach(s => studentCounts[s.name] = 0);
        this.state.students.forEach(s => {
            if (studentCounts[s.subject] !== undefined) studentCounts[s.subject]++;
            else studentCounts[s.subject] = 1;
        });

        // Render EXACT number of subjects and exactly the correct number of student rows per subject
        ui.renderSkeletons(this.state.subjects, studentCounts);

        // Ensure skeletons show for at least 800ms to avoid jarring flashes on fast network
        const minimumWait = new Promise(resolve => setTimeout(resolve, 800));
        await minimumWait;

        ui.updateStats(this.state.students);
        this.render();
    },

    render() {
        ui.render(this.state.students, this.state.subjectColors, this.state.searchTerm);
    },

    // Helper for optimistic UI updates
    async optimisticUpdate(actionFn, apiFn, errorMsg = "Errore di connessione. Modifica annullata.") {
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
            ui.showToast(errorMsg, 'error');
        }
    },

    async addStudent() {
        const nameInput = document.getElementById('nameInput');
        const dateInput = document.getElementById('dateInput');
        const subjectSelect = document.getElementById('subjectSelect');
        const gradesCountInput = document.getElementById('gradesCountInput');

        const name = nameInput.value.trim();
        const date = dateInput.value;
        const subject = subjectSelect.value;
        const grades_count = parseInt(gradesCountInput.value) || 0;

        if (!name) {
            ui.showToast("Inserisci il nome dello studente!", 'error');
            nameInput.focus();
            return;
        }
        if (!subject) {
            ui.showToast("Seleziona una materia!", 'error');
            return;
        }

        const finalDate = date || '9999-12-31';

        try {
            const newStudent = await api.addStudent({ name, last_interrogation: finalDate, subject, grades_count });

            // Normalize date format from database
            newStudent.last_interrogation = utils.normalizeDate(newStudent.last_interrogation);

            nameInput.value = '';
            dateInput.value = '';
            gradesCountInput.value = '0';

            this.state.students.push(newStudent);
            ui.updateStats(this.state.students);
            ui.showToast('Studente salvato con successo!', 'success');
            this.render();
        } catch (error) {
            ui.showToast('Errore durante il salvataggio!', 'error');
            console.error(error);
        }
    },

    async deleteStudent(id) {
        if (!await ui.confirmDialog('Sei sicuro di voler eliminare questo studente?')) return;

        await this.optimisticUpdate(
            () => { this.state.students = this.state.students.filter(s => s.id !== id); },
            () => api.deleteStudent(id),
            "Errore di connessione. Eliminazione annullata."
        );
    },

    async incrementGrade(id, currentGrades) {
        await this.optimisticUpdate(
            () => {
                const s = this.state.students.find(s => s.id === id);
                if (s) s.grades_count = (currentGrades || 0) + 1;
            },
            () => api.updateStudent({ id, grades_count: currentGrades + 1 })
        );
    },

    async updateStudentName(id, currentName) {
        const newName = await ui.promptDialog("Inserisci il nuovo nome:", currentName);
        if (!newName || newName === currentName) return;

        await this.optimisticUpdate(
            () => {
                const s = this.state.students.find(s => s.id === id);
                if (s) s.name = newName;
            },
            async () => {
                await api.updateStudent({ id, name: newName });
                this.loadStudents(true); // Reload to ensure sync
            },
            "Errore durante l'aggiornamento del nome"
        );
    },

    async updateStudentGrades(id, currentGrades) {
        const newGradesStr = await ui.promptDialog("Modifica numero voti:", currentGrades);
        if (newGradesStr === null) return;
        const newGrades = parseInt(newGradesStr);

        if (isNaN(newGrades) || newGrades < 0 || newGrades === currentGrades) return;

        await this.optimisticUpdate(
            () => {
                const s = this.state.students.find(s => s.id === id);
                if (s) s.grades_count = newGrades;
            },
            async () => {
                await api.updateStudent({ id, grades_count: newGrades });
                this.loadStudents(true);
            },
            "Errore durante l'aggiornamento voti"
        );
    },

    async registerInterrogation(id, currentGrades) {
        const today = new Date().toISOString().split('T')[0];
        const newDate = await ui.promptDialog("Inserisci data interrogazione (AAAA-MM-GG):", today);
        if (!newDate) return;

        // Simple Regex Validation YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            ui.showToast("Formato data non valido! Usa AAAA-MM-GG", 'error');
            return;
        }

        await this.optimisticUpdate(
            () => {
                const s = this.state.students.find(s => s.id === id);
                if (s) {
                    s.last_interrogation = newDate; // Already in YYYY-MM-DD format
                    s.grades_count = (currentGrades || 0) + 1;
                }
            },
            async () => {
                await api.updateStudent({
                    id,
                    last_interrogation: newDate,
                    grades_count: (currentGrades || 0) + 1
                });
                this.loadStudents(true);
            },
            "Errore durante la registrazione dell'interrogazione"
        );
    },

    async addNewSubject() {
        const nameInput = document.getElementById('newSubjectName');
        const colorInput = document.getElementById('newSubjectColor');

        const name = nameInput.value.trim();
        const color = colorInput.value;

        if (!name) return ui.showToast('Inserisci il nome della materia', 'error');

        try {
            const newSubject = await api.addSubject({ name, color });

            nameInput.value = '';

            // Optimization: Update local state instead of re-fetching
            this.state.subjects.push(newSubject);
            this.state.subjectColors[newSubject.name] = newSubject.color;

            // Update Select
            const select = document.getElementById('subjectSelect');
            if (select) {
                const option = document.createElement('option');
                option.value = newSubject.name;
                option.textContent = newSubject.name;
                select.appendChild(option);
            }

            // If modal is open, re-render list
            const modal = document.getElementById('subjectsModal');
            if (modal && !modal.classList.contains('hidden')) {
                ui.renderSubjectsList(this.state.subjects, this.state.students);
            }
        } catch (error) {
            ui.showToast("Errore aggiunta materia", 'error');
            console.error('Errore aggiunta materia:', error);
        }
    },

    async deleteSubject(name) {
        if (!await ui.confirmDialog(`Eliminare la materia "${name}"?`)) return;

        try {
            await api.deleteSubject(name);

            // Optimization: Local update
            this.state.subjects = this.state.subjects.filter(s => s.name !== name);
            delete this.state.subjectColors[name];

            // Update Select
            const select = document.getElementById('subjectSelect');
            if (select) {
                const option = Array.from(select.options).find(o => o.value === name);
                if (option) option.remove();
            }

            // Update modal list if open
            const modal = document.getElementById('subjectsModal');
            if (modal && !modal.classList.contains('hidden')) {
                ui.renderSubjectsList(this.state.subjects, this.state.students);
            }
            ui.showToast(`Materia "${name}" eliminata`, 'success');
        } catch (error) {
            ui.showToast(error.message || "Errore eliminazione", 'error');
        }
    },

    // =====================================================
    // UI HELPERS
    // =====================================================
    setToday() {
        document.getElementById('dateInput').valueAsDate = new Date();
    },

    setYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        document.getElementById('dateInput').valueAsDate = yesterday;
    },

    setLastWeek() {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        document.getElementById('dateInput').valueAsDate = lastWeek;
    },

    openSubjectsModal() {
        const modal = document.getElementById('subjectsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        ui.renderSubjectsList(this.state.subjects, this.state.students);
    },

    closeSubjectsModal() {
        const modal = document.getElementById('subjectsModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    handleSearch(e) {
        this.state.searchTerm = e.target.value.toLowerCase();
        this.render();
    },

    // =====================================================
    // INIT
    // =====================================================
    async init() {
        this.setToday();

        // Enter key handler
        const nameInput = document.getElementById('nameInput');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addStudent();
            });
        }

        // Search handler - Debounced
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => this.handleSearch(e), 300));
        }

        // Close modal on backdrop click
        const modal = document.getElementById('subjectsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'subjectsModal') this.closeSubjectsModal();
            });
        }

        try {
            await this.loadData();
        } catch (error) {
            console.error("Critical Init Error:", error);
            document.body.innerHTML = `
                <div class="min-h-screen flex items-center justify-center text-gray-800 dark:text-gray-200">
                    <div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl max-w-md">
                        <h2 class="text-xl font-bold mb-2">Errore di Caricamento</h2>
                        <button onclick="window.location.reload()" class="bg-purple-600 px-4 py-2 rounded text-white mt-4">Riprova</button>
                    </div>
                </div>`;
            // Re-run icons just in case
            import('lucide').then(({ createIcons, AlertTriangle }) => {
                createIcons({ icons: { AlertTriangle } });
            });
        }

        // Smart Polling: Auto-refresh only when tab is visible
        setInterval(() => {
            if (!document.hidden) {
                this.loadStudents();
            }
        }, 30000);
    }
};

// Expose app to window for inline HTML handlers
window.app = app;

// Start app when resources are fully loaded to avoid layout warnings
window.addEventListener('load', () => {
    app.init();
});
