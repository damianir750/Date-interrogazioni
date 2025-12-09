import { createIcons, icons } from 'lucide';

// =====================================================
// APP STATE & UTILITIES
// =====================================================
const app = {
    state: {
        students: [],
        subjects: [],
        subjectColors: {},
        searchTerm: ''
    },

    // Utility: Formatta data
    formatDate(dateString) {
        if (dateString === '9999-12-31') return 'DATA MANCANTE';
        const d = new Date(dateString);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    // Utility: Calcola giorni
    daysSince(dateString) {
        if (dateString === '9999-12-31') return -1;
        const then = new Date(dateString);
        const now = new Date();
        then.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    },

    // Utility: Hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    // =====================================================
    // API CALLS
    // =====================================================
    async loadSubjects() {
        try {
            const res = await fetch('/api/get-subjects');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.state.subjects = await res.json();

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

    async loadStudents() {
        try {
            const res = await fetch('/api/get-students');
            this.state.students = await res.json();
            this.render();
        } catch (error) {
            console.error('Errore caricamento studenti:', error);
        }
    },

    // Optimized Init: Parallel loading
    async loadData() {
        await Promise.all([this.loadSubjects(), this.loadStudents()]);
    },

    async addStudent() {
        const nameInput = document.getElementById('nameInput');
        const dateInput = document.getElementById('dateInput');
        const subjectSelect = document.getElementById('subjectSelect');

        const name = nameInput.value.trim();
        const date = dateInput.value;
        const subject = subjectSelect.value;

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
            await fetch('/api/add-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, last_interrogation: finalDate, subject })
            });

            nameInput.value = '';
            dateInput.value = '';
            this.loadStudents();
        } catch (error) {
            alert('Errore durante il salvataggio!');
            console.error(error);
        }
    },

    async deleteStudent(id) {
        if (!confirm('Sei sicuro di voler eliminare questo studente?')) return;

        try {
            await fetch('/api/delete-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            this.loadStudents();
        } catch (error) {
            console.error('Errore eliminazione:', error);
        }
    },

    async updateStudentName(id, currentName) {
        const newName = prompt("Inserisci il nuovo nome:", currentName);
        if (!newName || newName === currentName) return;

        try {
            const res = await fetch('/api/update-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: newName })
            });

            if (!res.ok) throw new Error('Errore aggiornamento');

            this.loadStudents();
        } catch (error) {
            alert('Errore durante l\'aggiornamento del nome');
            console.error(error);
        }
    },

    async addNewSubject() {
        const nameInput = document.getElementById('newSubjectName');
        const colorInput = document.getElementById('newSubjectColor');

        const name = nameInput.value.trim();
        const color = colorInput.value;

        if (!name) return alert('Inserisci il nome della materia');

        try {
            await fetch('/api/add-subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color })
            });

            nameInput.value = '';
            this.loadSubjects();
        } catch (error) {
            console.error('Errore aggiunta materia:', error);
        }
    },

    async deleteSubject(name) {
        if (!confirm(`Eliminare la materia "${name}"?`)) return;

        try {
            const res = await fetch('/api/delete-subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Errore durante l\'eliminazione');
            }

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
        this.renderSubjectsList();
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
    // RENDERING
    // =====================================================
    updateStats() {
        // ... (stats logic same as before)
        const total = this.state.students.length;
        const alerts = this.state.students.filter(s => this.daysSince(s.last_interrogation) > 14).length;
        const recent = this.state.students.filter(s => {
            const days = this.daysSince(s.last_interrogation);
            return days >= 0 && days <= 14;
        }).length;
        const subjects = new Set(this.state.students.map(s => s.subject)).size;

        const totalEl = document.getElementById('totalStudents');
        if (totalEl) totalEl.textContent = total;

        const alertEl = document.getElementById('alertCount');
        if (alertEl) alertEl.textContent = alerts;

        const recentEl = document.getElementById('recentCount');
        if (recentEl) recentEl.textContent = recent;

        const subjectEl = document.getElementById('subjectCount');
        if (subjectEl) subjectEl.textContent = subjects;

        const now = new Date();
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) lastUpdateEl.textContent = `Ultimo aggiornamento: ${now.toLocaleTimeString('it-IT')}`;
    },

    renderSubjectsList() {
        const container = document.getElementById('subjectsList');
        container.innerHTML = '';

        if (this.state.subjects.length === 0) {
            container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Nessuna materia disponibile</p>';
            return;
        }

        this.state.subjects.forEach(subject => {
            const studentCount = this.state.students.filter(s => s.subject === subject.name).length;
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full" style="background: ${subject.color}"></div>
                    <div>
                        <div class="font-semibold text-gray-800 dark:text-white">${subject.name}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">${studentCount} studenti</div>
                    </div>
                </div>
                <button onclick="app.deleteSubject('${subject.name}')" 
                    class="text-red-500 hover:text-red-700 transition ${studentCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                    title="${studentCount > 0 ? 'Non puoi eliminare materie con studenti' : 'Elimina materia'}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            container.appendChild(div);
        });
        createIcons({ icons });
    },

    render() {
        const container = document.getElementById('subjectsContainer');
        const emptyState = document.getElementById('emptyState');

        // Filter students based on search term
        const filteredStudents = this.state.students.filter(s =>
            s.name.toLowerCase().includes(this.state.searchTerm)
        );

        if (this.state.students.length === 0) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            this.updateStats();
            return;
        }

        emptyState.classList.add('hidden');

        // Raggruppa per materia
        const bySubject = {};
        filteredStudents.forEach(s => {
            if (!bySubject[s.subject]) bySubject[s.subject] = [];
            bySubject[s.subject].push(s);
        });

        // Ordina per giorni
        Object.keys(bySubject).forEach(subject => {
            bySubject[subject].sort((a, b) => this.daysSince(b.last_interrogation) - this.daysSince(a.last_interrogation));
        });

        container.innerHTML = '';

        Object.keys(bySubject).sort().forEach(subject => {
            const color = this.state.subjectColors[subject] || '#6b7280';
            const rgb = this.hexToRgb(color);
            const lightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
            const students = bySubject[subject];
            const urgentCount = students.filter(s => this.daysSince(s.last_interrogation) > 30).length;

            const div = document.createElement('div');
            div.className = 'fade-in';
            div.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-3">
                        <h2 class="text-xl sm:text-2xl font-semibold flex items-center gap-2" style="color: ${color}">
                            <i data-lucide="book-open" class="w-5 h-5"></i>
                            <span>${subject}</span>
                        </h2>
                        <span class="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">${students.length}</span>
                    </div>
                    ${urgentCount > 0 ? `
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-3 py-1 rounded-lg mb-3 flex items-center gap-1">
                        <i data-lucide="alert-triangle" class="w-3 h-3"></i> ${urgentCount} da interrogare urgentemente
                    </div>` : ''}
                    <ul class="space-y-2 list-none p-0 m-0" id="list-${subject.replace(/\s+/g, '-')}"></ul>
                </div>
            `;
            container.appendChild(div);

            const list = document.getElementById(`list-${subject.replace(/\s+/g, '-')}`);
            students.forEach((s, i) => {
                const days = this.daysSince(s.last_interrogation);
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center p-3 rounded-lg shadow-sm slide-in dark:text-gray-200';
                li.style.animationDelay = `${i * 0.05}s`;

                if (days === -1) {
                    li.className += ' pulse-alert';
                    li.style.background = 'rgba(255, 193, 7, 0.2)';
                    li.style.borderLeft = '4px solid #ffc107';
                    li.innerHTML = `
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-medium text-sm sm:text-base">${s.name}</span>
                            <span class="text-xs text-amber-700 dark:text-amber-500 font-semibold">📅 DATA MANCANTE</span>
                            <span class="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">⚠️ Da aggiornare</span>
                        </div>
                        <div class="flex items-center">
                            <button onclick="app.updateStudentName(${s.id}, '${s.name.replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-blue-700 transition ml-2" title="Modifica nome">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.deleteStudent(${s.id})" class="text-red-500 hover:text-red-700 transition ml-2" title="Elimina">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    `;
                } else {
                    const isVeryOld = days > 30;
                    const isOld = days > 14;

                    if (isVeryOld) li.className += ' pulse-alert';
                    li.style.background = lightColor;
                    li.style.borderLeft = `4px solid ${color}`;

                    let badge = '';
                    if (isVeryOld) badge = `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">🔥 ${days}g</span>`;
                    else if (isOld) badge = `<span class="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">⚠️ ${days}g</span>`;
                    else badge = `<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">${days}g</span>`;

                    li.innerHTML = `
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-medium text-sm sm:text-base">${s.name}</span>
                            <span class="text-xs text-gray-600 dark:text-gray-400">${this.formatDate(s.last_interrogation)}</span>
                            ${badge}
                        </div>
                        <div class="flex items-center">
                            <button onclick="app.updateStudentName(${s.id}, '${s.name.replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-blue-700 transition ml-2" title="Modifica nome">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.deleteStudent(${s.id})" class="text-red-500 hover:text-red-700 transition ml-2" title="Elimina">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    `;
                }
                list.appendChild(li);
            });
        });
        createIcons({ icons });
        this.updateStats();
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

        // Auto-refresh ogni 30 secondi
        setInterval(() => this.loadStudents(), 30000);
    }
};

// Expose app to window for inline HTML handlers
window.app = app;

// Start app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
