import { createIcons, Trash2, Pencil, AlertTriangle, BookOpen, GraduationCap, Plus, ArrowLeft, Moon, PlusCircle, Search, Settings, X, Check } from 'lucide';
import { utils } from './utils.js';

const icons = { Trash2, Pencil, AlertTriangle, BookOpen, GraduationCap, Plus, ArrowLeft, Moon, PlusCircle, Search, Settings, X, Check };

export const ui = {
    // Aggiorna le statistiche
    updateStats(students) {
        const total = students.length;
        const alerts = students.filter(s => utils.daysSince(s.last_interrogation) > 14).length;
        const recent = students.filter(s => {
            const days = utils.daysSince(s.last_interrogation);
            return days >= 0 && days <= 14;
        }).length;
        const subjects = new Set(students.map(s => s.subject)).size;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('totalStudents', total);
        setVal('alertCount', alerts);
        setVal('recentCount', recent);
        setVal('subjectCount', subjects);

        const now = new Date();
        setVal('lastUpdate', `Ultimo aggiornamento: ${now.toLocaleTimeString('it-IT')}`);
    },

    // Renderizza la lista delle materie nel modale
    renderSubjectsList(subjects, students) {
        const container = document.getElementById('subjectsList');
        if (!container) return;

        container.innerHTML = '';

        if (subjects.length === 0) {
            container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Nessuna materia disponibile</p>';
            return;
        }

        // Pre-calculate student counts for O(1) lookup inside loop
        const studentCounts = {};
        students.forEach(s => {
            studentCounts[s.subject] = (studentCounts[s.subject] || 0) + 1;
        });

        const fragment = document.createDocumentFragment();

        subjects.forEach(subject => {
            const count = studentCounts[subject.name] || 0;
            const safeName = utils.escapeHtml(subject.name);
            const safeNameAttr = utils.escapeAttribute(subject.name);

            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow-sm';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full shadow-inner border border-black/5" style="background: ${subject.color}"></div>
                    <div>
                        <div class="font-semibold text-gray-800 dark:text-white">${safeName}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 font-medium">${count} studenti</div>
                    </div>
                </div>
                <button onclick="app.deleteSubject('${safeNameAttr}')" 
                    class="text-red-500 hover:text-red-700 transition ${count > 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}"
                    ${count > 0 ? 'disabled' : ''}
                    title="${count > 0 ? 'Materia in uso' : 'Elimina materia'}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            fragment.appendChild(div);
        });
        container.appendChild(fragment);
        requestAnimationFrame(() => {
            createIcons({ icons });
        });
    },

    // Renderizza la lista principale
    render(students, subjectColors, searchTerm) {
        const container = document.getElementById('subjectsContainer');
        const emptyState = document.getElementById('emptyState');

        const filteredStudents = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm)
        );

        if (students.length === 0) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            return;
        }

        emptyState.classList.add('hidden');

        // Group by subject
        const bySubject = {};
        filteredStudents.forEach(s => {
            if (!bySubject[s.subject]) bySubject[s.subject] = [];
            bySubject[s.subject].push(s);
        });

        // Sort
        Object.keys(bySubject).forEach(subject => {
            bySubject[subject].sort((a, b) => {
                const gradeDiff = (a.grades_count || 0) - (b.grades_count || 0);
                if (gradeDiff !== 0) return gradeDiff;
                return utils.daysSince(b.last_interrogation) - utils.daysSince(a.last_interrogation);
            });
        });

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        Object.keys(bySubject).sort().forEach(subject => {
            const color = subjectColors[subject] || '#6b7280';
            const subjectStudents = bySubject[subject];
            const urgentCount = subjectStudents.filter(s => utils.daysSince(s.last_interrogation) > 30).length;
            const safeSubject = utils.escapeHtml(subject);

            const div = document.createElement('div');
            div.className = 'fade-in';
            div.innerHTML = `
                <div class="glass-premium rounded-3xl p-6 h-full flex flex-col group hover:scale-[1.02] transition-all duration-500">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-black flex items-center gap-3" style="color: ${color}">
                            <i data-lucide="book-open" class="w-6 h-6"></i>
                            <span>${safeSubject}</span>
                        </h2>
                        <span class="text-sm font-black px-3 py-1 rounded-xl bg-black/5 dark:bg-white/10 theme-text-primary italic">${subjectStudents.length}</span>
                    </div>
                    
                    ${urgentCount > 0 ? `
                    <div class="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold px-4 py-2 rounded-xl mb-4 flex items-center gap-2 animate-pulse">
                        <i data-lucide="alert-triangle" class="w-4 h-4"></i> ${urgentCount} STUDENTI URGENTI
                    </div>` : ''}

                    <ul class="space-y-3 list-none p-0 m-0"></ul>
                </div>
            `;
            fragment.appendChild(div);

            const list = div.querySelector('ul');
            subjectStudents.forEach((s, i) => {
                const days = utils.daysSince(s.last_interrogation);
                const safeName = utils.escapeHtml(s.name);
                const safeNameAttr = utils.escapeAttribute(s.name);
                const gradesCount = s.grades_count || 0;

                const li = document.createElement('li');
                li.className = 'flex flex-col p-4 rounded-2xl glass transition-all hover:bg-white/10 dark:hover:bg-white/5 active:scale-[0.98] cursor-default';
                li.style.animationDelay = `${i * 0.05}s`;

                let statusBadge = '';
                let borderStyle = `border-left: 4px solid ${color}`;

                if (days === -1) {
                    statusBadge = `<span class="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-black uppercase">Mancante</span>`;
                    borderStyle = 'border-left: 4px solid #f59e0b';
                } else if (days > 30) {
                    statusBadge = `<span class="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-black uppercase">${days} giorni</span>`;
                    borderStyle = 'border-left: 4px solid #e11d48';
                } else if (days > 14) {
                    statusBadge = `<span class="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-black uppercase">${days} giorni</span>`;
                } else {
                    statusBadge = `<span class="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-black uppercase">${days} giorni</span>`;
                }

                li.style.cssText += borderStyle;

                li.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-bold theme-text-primary text-base truncate pr-2">${safeName}</span>
                        ${statusBadge}
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold theme-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">🎓 ${gradesCount} voti</span>
                            <span class="text-[10px] font-medium theme-text-secondary italic">${utils.formatDate(s.last_interrogation)}</span>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="app.registerInterrogation(${s.id}, ${gradesCount})" class="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-600 transition-colors" title="Interrogato oggi">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.incrementGrade(${s.id}, ${gradesCount})" class="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-500 transition-colors" title="+1 Voto">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.updateStudentName(${s.id}, '${safeNameAttr}')" class="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-500 transition-colors" title="Modifica">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.deleteStudent(${s.id})" class="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors" title="Elimina">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
                list.appendChild(li);
            });
        });
        container.appendChild(fragment);

        requestAnimationFrame(() => {
            createIcons({ icons });
        });
    }
};
