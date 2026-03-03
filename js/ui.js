import { createIcons, Trash2, Pencil, AlertTriangle, BookOpen, GraduationCap, Plus, ArrowLeft, Moon, PlusCircle, Search, Settings, X, Check } from 'lucide';
import { utils } from './utils.js';

const icons = { Trash2, Pencil, AlertTriangle, BookOpen, GraduationCap, Plus, ArrowLeft, Moon, PlusCircle, Search, Settings, X, Check };

export const ui = {
    // Componente Toast per notifiche moderne
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-purple-500'
        };
        const icons = {
            success: 'check-circle',
            error: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 z-[100] transform transition-all duration-300 translate-y-10 opacity-0`;

        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
            <span class="font-medium">${utils.escapeHtml(message)}</span>
        `;

        document.body.appendChild(toast);

        // Render lucide icon for the toast
        import('lucide').then(({ createIcons, CheckCircle, AlertTriangle, Info }) => {
            createIcons({
                nameAttr: 'data-lucide',
                attrs: { class: "lucide" },
                icons: { CheckCircle, AlertTriangle, Info }
            });
        });

        // Intro animation
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        // Outro animation & removal
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Dialoghi Asincroni Moderni per rimpiazzare window.confirm e window.prompt
    async confirmDialog(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200';

            const dialog = document.createElement('div');
            dialog.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform duration-200 border border-gray-100 dark:border-gray-700';
            dialog.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Conferma</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6">${utils.escapeHtml(message)}</p>
                <div class="flex justify-end gap-3">
                    <button id="cancelBtn" class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Annulla</button>
                    <button id="confirmBtn" class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition">Conferma</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Intro
            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                dialog.classList.remove('scale-95');
            });

            const close = (result) => {
                overlay.classList.add('opacity-0');
                dialog.classList.add('scale-95');
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            };

            overlay.querySelector('#cancelBtn').onclick = () => close(false);
            overlay.querySelector('#confirmBtn').onclick = () => close(true);
            overlay.onclick = (e) => { if (e.target === overlay) close(false); };
        });
    },

    async promptDialog(title, defaultValue = '') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200';

            const dialog = document.createElement('div');
            dialog.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform duration-200 border border-gray-100 dark:border-gray-700';
            dialog.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${utils.escapeHtml(title)}</h3>
                <input type="text" id="promptInput" value="${utils.escapeHtml(String(defaultValue))}" 
                    class="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none mb-6">
                <div class="flex justify-end gap-3">
                    <button id="cancelBtn" class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Annulla</button>
                    <button id="confirmBtn" class="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg transition">Salva</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const input = overlay.querySelector('#promptInput');

            // Intro
            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                dialog.classList.remove('scale-95');
                input.focus();
                input.select();
            });

            const close = (result) => {
                overlay.classList.add('opacity-0');
                dialog.classList.add('scale-95');
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            };

            overlay.querySelector('#cancelBtn').onclick = () => close(null);
            overlay.querySelector('#confirmBtn').onclick = () => close(input.value);
            input.onkeypress = (e) => { if (e.key === 'Enter') close(input.value); };
            overlay.onclick = (e) => { if (e.target === overlay) close(null); };
        });
    },

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
        requestAnimationFrame(() => createIcons({ icons }));
    },

    // Renderizza i loader (skeleton screens)
    renderSkeletons(subjects = [], studentCounts = {}) {
        const container = document.getElementById('subjectsContainer');
        if (!container) return;

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        // Fallback safety if no subjects exist yet (e.g. fresh DB)
        const subjectsToRender = subjects.length > 0 ? subjects : [{ name: 'Caricamento...', color: '#e5e7eb' }, { name: '...', color: '#e5e7eb' }];

        subjectsToRender.forEach((subject, i) => {
            const count = (studentCounts && studentCounts[subject.name]) ? studentCounts[subject.name] : 1;

            const div = document.createElement('div');
            // Use same container classes as real cards
            div.className = 'fade-in';
            div.style.animationDelay = `${i * 0.1}s`;

            // Build exact inner list
            let listHTML = '<ul class="space-y-2 list-none p-0 m-0">';
            for (let j = 0; j < count; j++) {
                listHTML += `
                    <li class="flex justify-between items-center p-3 rounded-lg shadow-sm dark:bg-gray-700/20 ${j > 0 ? 'opacity-70' : ''}">
                        <div class="flex w-full gap-3">
                            <div class="flex-1 min-w-0">
                                <span class="font-medium text-sm sm:text-base break-words skeleton text-transparent rounded ${j % 2 === 0 ? 'w-1/2' : 'w-3/4'} inline-block">Nome Studente</span>
                                <div class="flex items-center gap-2 mt-1 flex-wrap">
                                    <span class="text-transparent text-xs px-2 py-1 rounded-full font-bold skeleton">🎓 0</span>
                                    <span class="text-transparent text-[10px] sm:text-xs whitespace-nowrap skeleton rounded">00/00/0000</span>
                                    <span class="text-transparent text-xs px-2 py-0.5 rounded-full font-bold skeleton">00g</span>
                                </div>
                            </div>
                            <div class="flex items-start flex-shrink-0 gap-0.5 -mt-1 opacity-50">
                                <button class="p-1.5 invisible"><i data-lucide="check" class="w-4 h-4 skeleton rounded-sm"></i></button>
                                <button class="p-1.5 invisible"><i data-lucide="plus" class="w-4 h-4 skeleton rounded-sm"></i></button>
                                <button class="p-1.5 invisible"><i data-lucide="graduation-cap" class="w-4 h-4 skeleton rounded-sm"></i></button>
                                <button class="p-1.5 invisible"><i data-lucide="pencil" class="w-4 h-4 skeleton rounded-sm"></i></button>
                                <button class="p-1.5 invisible"><i data-lucide="trash-2" class="w-4 h-4 skeleton rounded-sm"></i></button>
                            </div>
                        </div>
                    </li>
                `;
            }
            listHTML += '</ul>';

            div.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full border border-gray-100 dark:border-gray-700 flex flex-col justify-start">
                    <div class="flex items-center justify-between mb-3">
                        <div class="h-8 w-1/2 skeleton rounded-lg"></div>
                        <div class="h-6 w-8 skeleton rounded-full"></div>
                    </div>
                    ${listHTML}
                </div>
            `;
            fragment.appendChild(div);
        });

        container.appendChild(fragment);
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

        Object.keys(bySubject).sort().forEach((subject, groupIndex) => {
            const color = subjectColors[subject] || '#6b7280';
            const rgb = utils.hexToRgb(color);
            const lightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
            const subjectStudents = bySubject[subject];
            const urgentCount = subjectStudents.filter(s => utils.daysSince(s.last_interrogation) > 30).length;
            const safeSubject = utils.escapeHtml(subject);

            const div = document.createElement('div');
            // Check if this is a first render (container was empty) to apply animation, otherwise keep it static to prevent "shock"
            if (container.children.length === 0) {
                div.className = 'fade-in';
                div.style.animationDelay = `${groupIndex * 0.1}s`;
            }

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

                // Only slide in if it's initial render
                if (container.children.length === 0) {
                    li.className = 'flex justify-between items-center p-3 rounded-lg shadow-sm slide-in dark:text-gray-200';
                    li.style.animationDelay = `${(groupIndex * 0.1) + (i * 0.05)}s`;
                } else {
                    li.className = 'flex justify-between items-center p-3 rounded-lg shadow-sm dark:text-gray-200';
                }

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

        // Optimization: Single call to createIcons for the whole container
        requestAnimationFrame(() => createIcons({ icons }));
    }
};
