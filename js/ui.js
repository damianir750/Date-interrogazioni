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

        // Filter students based on search term
        const filteredStudents = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm)
        );

        if (students.length === 0) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            return;
        }

        emptyState.classList.add('hidden');

        // Raggruppa per materia
        const bySubject = {};
        filteredStudents.forEach(s => {
            if (!bySubject[s.subject]) bySubject[s.subject] = [];
            bySubject[s.subject].push(s);
        });

        // Ordina per numero voti (crescente), poi per giorni (decrescente, cioè data più vecchia prima)
        Object.keys(bySubject).forEach(subject => {
            bySubject[subject].sort((a, b) => {
                const gradeDiff = (a.grades_count || 0) - (b.grades_count || 0);
                if (gradeDiff !== 0) return gradeDiff;
                // Se voti uguali, chi non è interrogato da più tempo va prima
                return utils.daysSince(b.last_interrogation) - utils.daysSince(a.last_interrogation);
            });
        });

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        Object.keys(bySubject).sort().forEach(subject => {
            const color = subjectColors[subject] || '#6b7280';
            const rgb = utils.hexToRgb(color);
            const lightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
            const subjectStudents = bySubject[subject];
            const urgentCount = subjectStudents.filter(s => utils.daysSince(s.last_interrogation) > 30).length;
            const safeSubject = utils.escapeHtml(subject);

            const div = document.createElement('div');
            div.className = 'fade-in';
            div.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full border border-gray-100 dark:border-gray-700 flex flex-col justify-start">
                    <div class="flex items-center justify-between mb-3">
                        <h2 class="text-xl sm:text-2xl font-semibold flex items-center gap-2" style="color: ${color}">
                            <i data-lucide="book-open" class="w-5 h-5"></i>
                            <span>${safeSubject}</span>
                        </h2>
                        <span class="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">${subjectStudents.length}</span>
                    </div>
                    ${urgentCount > 0 ? `
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-3 py-1 rounded-lg mb-3 flex items-center gap-1">
                        <i data-lucide="alert-triangle" class="w-3 h-3"></i> ${urgentCount} da interrogare urgentemente
                    </div>` : ''}

                    <ul class="space-y-2 list-none p-0 m-0"></ul>
                </div>
            `;
            fragment.appendChild(div);

            const list = div.querySelector('ul');
            subjectStudents.forEach((s, i) => {
                const days = utils.daysSince(s.last_interrogation);
                const safeName = utils.escapeHtml(s.name);
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center p-3 rounded-lg shadow-sm slide-in dark:text-gray-200';
                li.style.animationDelay = `${i * 0.05}s`;

                // Badge Voti - matches subject color
                const gradesCount = s.grades_count || 0;
                const badgeBgColor = utils.darkenColor(color, 0.2);
                const gradesBadge = `<span class="text-white text-xs px-2 py-1 rounded-full font-bold" style="background-color: ${badgeBgColor};" title="Numero voti">🎓 ${gradesCount}</span>`;

                const safeNameAttr = utils.escapeAttribute(s.name); // For JS calls

                if (days === -1) {
                    li.className += ' pulse-alert';
                    li.style.background = 'rgba(255, 193, 7, 0.2)';
                    li.style.borderLeft = '4px solid #ffc107';
                    li.innerHTML = `
                        <div class="flex w-full gap-3">
                            <div class="flex-1 min-w-0">
                                <span class="font-medium text-sm sm:text-base break-words" title="${safeName}">${safeName}</span>
                                <div class="flex items-center gap-2 mt-1 flex-wrap">
                                    ${gradesBadge}
                                    <span class="text-[10px] sm:text-xs text-amber-700 dark:text-amber-500 font-semibold whitespace-nowrap">📅 MANCANTE</span>
                                    <span class="bg-amber-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">⚠️ Aggiorna</span>
                                </div>
                            </div>
                            <div class="flex items-start flex-shrink-0 gap-0.5 -mt-1">
                                <button onclick="app.registerInterrogation(${s.id}, ${gradesCount})" class="text-teal-600 hover:text-teal-800 transition p-1.5" title="Segna come interrogato">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.updateStudentGrades(${s.id}, ${gradesCount})" class="text-purple-500 hover:text-purple-700 transition p-1.5" title="Modifica numero voti">
                                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.updateStudentName(${s.id}, '${safeNameAttr}')" class="text-blue-500 hover:text-blue-700 transition p-1.5" title="Modifica nome">
                                    <i data-lucide="pencil" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.deleteStudent(${s.id})" class="text-red-500 hover:text-red-700 transition p-1.5" title="Elimina">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
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
                        <div class="flex w-full gap-3">
                            <div class="flex-1 min-w-0">
                                <span class="font-medium text-sm sm:text-base break-words" title="${safeName}">${safeName}</span>
                                <div class="flex items-center gap-2 mt-1 flex-wrap">
                                    ${gradesBadge}
                                    <span class="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">${utils.formatDate(s.last_interrogation)}</span>
                                    ${badge.replace('px-2 py-1', 'px-2 py-0.5')}
                                </div>
                            </div>
                            <div class="flex items-start flex-shrink-0 gap-0.5 -mt-1">
                                <button onclick="app.registerInterrogation(${s.id}, ${gradesCount})" class="text-teal-600 hover:text-teal-800 transition p-1.5" title="Segna come interrogato">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.incrementGrade(${s.id}, ${gradesCount})" class="text-green-500 hover:text-green-700 transition p-1.5" title="Aggiungi voto (+1)">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.updateStudentGrades(${s.id}, ${gradesCount})" class="text-purple-500 hover:text-purple-700 transition p-1.5" title="Modifica numero voti">
                                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.updateStudentName(${s.id}, '${safeNameAttr}')" class="text-blue-500 hover:text-blue-700 transition p-1.5" title="Modifica nome">
                                    <i data-lucide="pencil" class="w-4 h-4"></i>
                                </button>
                                <button onclick="app.deleteStudent(${s.id})" class="text-red-500 hover:text-red-700 transition p-1.5" title="Elimina">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
                list.appendChild(li);
            });
        });
        container.appendChild(fragment);


        // Use requestAnimationFrame to let the browser know we are done modifying DOM
        // before we ask it to calculate layout for icons.
        requestAnimationFrame(() => {
            createIcons({ icons });
        });
    }
};
