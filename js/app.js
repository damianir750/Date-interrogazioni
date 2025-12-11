import { api } from './api.js';
import { ui } from './ui.js';

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

    async loadStudents(forceRefresh = false) {
        try {
            this.state.students = await api.getStudents(forceRefresh) || [];
            this.render();
        } catch (error) {
            console.error('Errore caricamento studenti:', error);
        }
    },

    // Optimized Init: Parallel loading
    async loadData() {
        await Promise.all([this.loadSubjects(), this.loadStudents()]);
        this.render();
    },

    render() {
        ui.render(this.state.students, this.state.subjectColors, this.state.searchTerm);
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
            alert("Inserisci il nome dello studente!");
            nameInput.focus();
            return;
        }
        if (!subject) {
            alert("Seleziona una materia!");
            return;
        }

        const finalDate = date || '9999-12-31';

        try {
            await api.addStudent({ name, last_interrogation: finalDate, subject, grades_count });

            nameInput.value = '';
            dateInput.value = '';
            gradesCountInput.value = '0';
            this.loadStudents(true);
        } catch (error) {
            alert('Errore durante il salvataggio!');
            console.error(error);
        }
    },

    async deleteStudent(id) {
        if (!confirm('Sei sicuro di voler eliminare questo studente?')) return;

        // Optimistic Update
        const previousStudents = JSON.parse(JSON.stringify(this.state.students));
        this.state.students = this.state.students.filter(s => s.id !== id);
        this.render();

        try {
            await api.deleteStudent(id);
            this.loadStudents(true);
        } catch (error) {
            console.error('Errore eliminazione:', error);
            // Revert
            this.state.students = previousStudents;
            this.render();
            alert("Errore di connessione. Eliminazione annullata.");
        }
    },

    async incrementGrade(id, currentGrades) {
        // Optimistic Update
        const previousStudents = JSON.parse(JSON.stringify(this.state.students));
        const studentIndex = this.state.students.findIndex(s => s.id === id);
        if (studentIndex !== -1) {
            this.state.students[studentIndex].grades_count = (currentGrades || 0) + 1;
            this.render();
        }

        try {
            await api.updateStudent({ id, grades_count: currentGrades + 1 });
            this.loadStudents(true);
        } catch (error) {
            console.error(error);
            // Revert on error
            this.state.students = previousStudents;
            this.render();
            alert("Errore di connessione. Modifica annullata.");
        }
    },

    async updateStudentName(id, currentName) {
        const newName = prompt("Inserisci il nuovo nome:", currentName);
        if (!newName || newName === currentName) return;

        // Optimistic Update
        const previousStudents = JSON.parse(JSON.stringify(this.state.students));
        const studentIndex = this.state.students.findIndex(s => s.id === id);
        if (studentIndex !== -1) {
            this.state.students[studentIndex].name = newName;
            this.render();
        }

        try {
            await api.updateStudent({ id, name: newName });
            this.loadStudents(true);
        } catch (error) {
            alert('Errore durante l\'aggiornamento del nome');
            console.error(error);
            // Revert
            this.state.students = previousStudents;
            this.render();
        }
    },

    async updateStudentGrades(id, currentGrades) {
        const newGradesStr = prompt("Modifica numero voti:", currentGrades);
        if (newGradesStr === null) return;
        const newGrades = parseInt(newGradesStr);

        if (isNaN(newGrades) || newGrades === currentGrades) return;

        // Optimistic Update
        const previousStudents = JSON.parse(JSON.stringify(this.state.students));
        const studentIndex = this.state.students.findIndex(s => s.id === id);
        if (studentIndex !== -1) {
            this.state.students[studentIndex].grades_count = newGrades;
            this.render();
        }

        try {
            await api.updateStudent({ id, grades_count: newGrades });
            this.loadStudents(true);
        } catch (error) {
            alert('Errore durante l\'aggiornamento voti');
            console.error(error);
            // Revert
            this.state.students = previousStudents;
            this.render();
        }
    },

    async registerInterrogation(id, currentGrades) {
        const today = new Date().toISOString().split('T')[0];
        const newDate = prompt("Inserisci data interrogazione (AAAA-MM-GG):", today);
        if (!newDate) return;

        // Optimistic Update
        const previousStudents = JSON.parse(JSON.stringify(this.state.students));
        const studentIndex = this.state.students.findIndex(s => s.id === id);
        if (studentIndex !== -1) {
            this.state.students[studentIndex].last_interrogation = newDate;
            this.state.students[studentIndex].grades_count = (currentGrades || 0) + 1;
            this.render();
        }

        try {
            await api.updateStudent({
                id,
                last_interrogation: newDate,
                grades_count: (currentGrades || 0) + 1
            });
            this.loadStudents(true);
        } catch (error) {
            alert('Errore durante la registrazione dell\'interrogazione');
            console.error(error);
            // Revert
            this.state.students = previousStudents;
            this.render();
        }
    },

    async addNewSubject() {
        const nameInput = document.getElementById('newSubjectName');
        const colorInput = document.getElementById('newSubjectColor');

        const name = nameInput.value.trim();
        const color = colorInput.value;

        if (!name) return alert('Inserisci il nome della materia');

        try {
            await api.addSubject({ name, color });

            nameInput.value = '';
            this.loadSubjects();
        } catch (error) {
            console.error('Errore aggiunta materia:', error);
        }
    },

    async deleteSubject(name) {
        if (!confirm(`Eliminare la materia "${name}"?`)) return;

        try {
            await api.deleteSubject(name);
            this.loadSubjects();
        } catch (error) {
            alert(error.message);
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

        // Search handler
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }

        // Close modal on backdrop click
        const modal = document.getElementById('subjectsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'subjectsModal') this.closeSubjectsModal();
            });
        }

        await this.loadData();

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
