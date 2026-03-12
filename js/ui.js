import { createIcons, Trash2, Pencil, AlertTriangle, BookOpen, GraduationCap, Plus, ArrowLeft, Moon, PlusCircle, Search, Settings, X, Check, CheckCircle, Info } from 'lucide';
import { utils } from './utils.js';

const icons = { Trash2, Pencil, AlertTriangle, BookOpen, GraduationCap, Plus, ArrowLeft, Moon, PlusCircle, Search, Settings, X, Check, CheckCircle, Info };

// Validates hex color to prevent CSS injection
const safeColor = (color) => /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#6b7280';

export const ui = {
    // Componente Toast per notifiche moderne
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-purple-500'
        };
        const iconsMap = {
            success: 'CheckCircle',
            error: 'AlertTriangle',
            info: 'Info'
        };

        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 z-[100] transform transition-all duration-300 translate-y-10 opacity-0`;

        toast.innerHTML = `
            <i data-lucide="${iconsMap[type]}" class="w-5 h-5"></i>
            <span class="font-medium">${utils.escapeHtml(message)}</span>
        `;

        document.body.appendChild(toast);

        // Render lucide icon for the toast using already available icons or quick render
        createIcons({
            icons,
            nameAttr: 'data-lucide',
            attrs: { class: "lucide" }
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
            overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'confirmTitle');

            const dialog = document.createElement('div');
            dialog.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform duration-200 border border-gray-100 dark:border-gray-700';
            dialog.innerHTML = `
            <h3 id="confirmTitle" class="text-xl font-bold text-gray-800 dark:text-white mb-4">Conferma</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">${utils.escapeHtml(message)}</p>
            <div class="flex justify-end gap-3">
                <button id="cancelBtn" class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition" aria-label="Annulla">Annulla</button>
                <button id="confirmBtn" class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition" aria-label="Conferma eliminazione">Conferma</button>
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

            // Trap focus or handle Escape
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    window.removeEventListener('keydown', handleEsc);
                }
            };
            window.addEventListener('keydown', handleEsc);
        });
    },

    async promptDialog(title, defaultValue = '') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-200';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'promptTitle');

            const dialog = document.createElement('div');
            dialog.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform duration-200 border border-gray-100 dark:border-gray-700';
            dialog.innerHTML = `
            <h3 id="promptTitle" class="text-xl font-bold text-gray-800 dark:text-white mb-4">${utils.escapeHtml(title)}</h3>
            <input type="text" id="promptInput" value="${utils.escapeHtml(String(defaultValue))}" 
                class="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none mb-6"
                aria-label="${utils.escapeHtml(title)}">
            <div class="flex justify-end gap-3">
                <button id="cancelBtn" class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition" aria-label="Annulla">Annulla</button>
                <button id="confirmBtn" class="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg transition" aria-label="Salva modifiche">Salva</button>
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

            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(null);
                    window.removeEventListener('keydown', handleEsc);
                }
            };
            window.addEventListener('keydown', handleEsc);
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
            const p = document.createElement('p');
            p.className = 'text-gray-500 dark:text-gray-400 text-center py-4';
            p.textContent = 'Nessuna materia disponibile';
            container.appendChild(p);
            return;
        }

        const studentCounts = {};
        students.forEach(s => {
            studentCounts[s.subject] = (studentCounts[s.subject] || 0) + 1;
        });

        const fragment = document.createDocumentFragment();

        subjects.forEach(subject => {
            const count = studentCounts[subject.name] || 0;
            
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition shadow-sm';
            
            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'flex items-center gap-3';
            
            const colorDot = document.createElement('div');
            colorDot.className = 'w-8 h-8 rounded-full shadow-inner border border-black/5';
            colorDot.style.backgroundColor = safeColor(subject.color);
            
            const textContent = document.createElement('div');
            const nameDiv = document.createElement('div');
            nameDiv.className = 'font-semibold text-gray-800 dark:text-white';
            nameDiv.textContent = subject.name;
            
            const countDiv = document.createElement('div');
            countDiv.className = 'text-xs text-gray-500 dark:text-gray-400 font-medium';
            countDiv.textContent = `${count} studenti`;
            
            textContent.appendChild(nameDiv);
            textContent.appendChild(countDiv);
            infoWrapper.appendChild(colorDot);
            infoWrapper.appendChild(textContent);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = `text-red-500 hover:text-red-700 transition ${count > 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`;
            if (count > 0) {
                deleteBtn.disabled = true;
                deleteBtn.title = 'Materia in uso';
            } else {
                deleteBtn.title = 'Elimina materia';
                deleteBtn.addEventListener('click', () => app.deleteSubject(subject.name));
            }
            
            const trashIcon = document.createElement('i');
            trashIcon.setAttribute('data-lucide', 'trash-2');
            trashIcon.className = 'w-4 h-4';
            deleteBtn.appendChild(trashIcon);
            
            div.appendChild(infoWrapper);
            div.appendChild(deleteBtn);
            fragment.appendChild(div);
        });

        container.appendChild(fragment);
        requestAnimationFrame(() => createIcons({ icons, nameAttr: 'data-lucide' }));
    },

    // Renderizza i loader (skeleton screens)
    renderSkeletons(subjects = [], studentCounts = {}) {
        const container = document.getElementById('subjectsContainer');
        if (!container) return;

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        // Fallback safety if no subjects exist yet (e.g. fresh DB)
        const subjectsToRender = subjects.length > 0 ? subjects : [
            { name: 'Caricamento...', color: '#e5e7eb' }, 
            { name: '...', color: '#e5e7eb' }
        ];

        subjectsToRender.forEach((subject, i) => {
            const count = (studentCounts && studentCounts[subject.name]) ? studentCounts[subject.name] : 1;

            const card = document.createElement('div');
            card.className = 'fade-in';
            card.style.animationDelay = `${i * 0.1}s`;

            const cardInner = document.createElement('div');
            cardInner.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full border border-gray-100 dark:border-gray-700 flex flex-col justify-start';

            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-3';
            const skeletonTitle = document.createElement('div');
            skeletonTitle.className = 'h-8 w-1/2 skeleton rounded-lg';
            const skeletonBadge = document.createElement('div');
            skeletonBadge.className = 'h-6 w-8 skeleton rounded-full';
            header.appendChild(skeletonTitle);
            header.appendChild(skeletonBadge);
            cardInner.appendChild(header);

            const list = document.createElement('ul');
            list.className = 'space-y-2 list-none p-0 m-0';

            for (let j = 0; j < count; j++) {
                const li = document.createElement('li');
                li.className = `flex justify-between items-center p-3 rounded-lg shadow-sm dark:bg-gray-700/20 ${j > 0 ? 'opacity-70' : ''}`;
                
                const wrapper = document.createElement('div');
                wrapper.className = 'flex w-full gap-3';
                
                const content = document.createElement('div');
                content.className = 'flex-1 min-w-0';
                
                const sName = document.createElement('span');
                sName.className = `font-medium text-sm sm:text-base break-words skeleton text-transparent rounded ${j % 2 === 0 ? 'w-1/2' : 'w-3/4'} inline-block`;
                sName.textContent = 'Nome Studente';
                
                const sMeta = document.createElement('div');
                sMeta.className = 'flex items-center gap-2 mt-1 flex-wrap';
                
                ['🎓 0', '00/00/0000', '00g'].forEach((text, k) => {
                    const span = document.createElement('span');
                    span.className = 'text-transparent text-xs px-2 py-0.5 rounded-full skeleton';
                    span.textContent = text;
                    sMeta.appendChild(span);
                });
                
                content.appendChild(sName);
                content.appendChild(sMeta);
                wrapper.appendChild(content);

                const actions = document.createElement('div');
                actions.className = 'flex items-start flex-shrink-0 gap-0.5 -mt-1 opacity-50';
                for(let k=0; k<5; k++) {
                   const b = document.createElement('div');
                   b.className = 'w-8 h-8 skeleton rounded-sm m-0.5';
                   actions.appendChild(b);
                }
                wrapper.appendChild(actions);
                
                li.appendChild(wrapper);
                list.appendChild(li);
            }

            cardInner.appendChild(list);
            card.appendChild(cardInner);
            fragment.appendChild(card);
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

        const wasEmpty = container.children.length === 0;
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        Object.keys(bySubject).sort().forEach((subject, groupIndex) => {
            const color = safeColor(subjectColors[subject] || '#6b7280');
            const rgb = utils.hexToRgb(color);
            const lightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
            const subjectStudents = bySubject[subject];
            const urgentCount = subjectStudents.filter(s => utils.daysSince(s.last_interrogation) > 30).length;

            const card = document.createElement('div');
            if (wasEmpty) {
                card.className = 'fade-in';
                card.style.animationDelay = `${groupIndex * 0.1}s`;
            }
            
            const cardInner = document.createElement('div');
            cardInner.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full border border-gray-100 dark:border-gray-700 flex flex-col justify-start';
            
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-3';
            
            const title = document.createElement('h2');
            title.className = 'text-xl sm:text-2xl font-semibold flex items-center gap-2';
            title.style.color = color;
            
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'book-open');
            icon.className = 'w-5 h-5';
            
            const nameText = document.createElement('span');
            nameText.textContent = subject; // textContent is safe
            
            title.appendChild(icon);
            title.appendChild(nameText);
            
            const badge = document.createElement('span');
            badge.className = 'text-sm font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
            badge.textContent = subjectStudents.length;
            
            header.appendChild(title);
            header.appendChild(badge);
            cardInner.appendChild(header);

            if (urgentCount > 0) {
                const alert = document.createElement('div');
                alert.className = 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-3 py-1 rounded-lg mb-3 flex items-center gap-1';
                
                const warnIcon = document.createElement('i');
                warnIcon.setAttribute('data-lucide', 'alert-triangle');
                warnIcon.className = 'w-3 h-3';
                
                const alertText = document.createTextNode(` ${urgentCount} da interrogare urgentemente`);
                
                alert.appendChild(warnIcon);
                alert.appendChild(alertText);
                cardInner.appendChild(alert);
            }

            const list = document.createElement('ul');
            list.className = 'space-y-2 list-none p-0 m-0';
            
            subjectStudents.forEach((s, i) => {
                const li = this.createStudentElement(s, i, color, lightColor, searchTerm, groupIndex, list.children.length === 0);
                list.appendChild(li);
            });
            
            cardInner.appendChild(list);
            card.appendChild(cardInner);
            fragment.appendChild(card);
        });
        container.appendChild(fragment);

        requestAnimationFrame(() => createIcons({ icons, nameAttr: 'data-lucide' }));
    },

    createStudentElement(s, i, color, lightColor, searchTerm, groupIndex, isInitialRender) {
        const days = utils.daysSince(s.last_interrogation);
        const li = document.createElement('li');

        // Animation logic
        if (isInitialRender) {
            li.className = 'flex justify-between items-center p-3 rounded-lg shadow-sm slide-in dark:text-gray-200';
            li.style.animationDelay = `${(groupIndex * 0.1) + (i * 0.05)}s`;
        } else {
            li.className = 'flex justify-between items-center p-3 rounded-lg shadow-sm dark:text-gray-200 transition-all';
        }

        const gradesCount = s.grades_count || 0;
        const badgeBgColor = utils.darkenColor(color, 0.2);

        // Styling for state
        if (days === -1) {
            li.className += ' pulse-alert';
            li.style.background = 'rgba(255, 193, 7, 0.2)';
            li.style.borderLeft = '4px solid #ffc107';
        } else {
            if (days > 30) li.className += ' pulse-alert';
            li.style.background = lightColor;
            li.style.borderLeft = `4px solid ${color}`;
        }

        // Structure
        const mainWraper = document.createElement('div');
        mainWraper.className = 'flex w-full gap-3';

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-1 min-w-0';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium text-sm sm:text-base break-words';
        nameSpan.title = s.name;
        // Use highlightSearch only if searchTerm exists, it returns HTML so we use innerHTML for HIGHLIGHTING only
        // Search term is already escaped inside highlightSearch.
        nameSpan.innerHTML = utils.highlightSearch(s.name, searchTerm);
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'flex items-center gap-2 mt-1 flex-wrap';

        // Grades Badge
        const gBadge = document.createElement('span');
        gBadge.className = 'text-white text-xs px-2 py-1 rounded-full font-bold';
        gBadge.style.backgroundColor = badgeBgColor;
        gBadge.title = 'Numero voti';
        gBadge.textContent = `🎓 ${gradesCount}`;

        // Date Info
        const dateInfo = document.createElement('span');
        if (days === -1) {
            dateInfo.className = 'text-[10px] sm:text-xs text-amber-700 dark:text-amber-500 font-semibold whitespace-nowrap';
            dateInfo.textContent = '📅 MANCANTE';
        } else {
            dateInfo.className = 'text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap';
            dateInfo.textContent = utils.formatDate(s.last_interrogation);
        }

        // Status Badge
        const statusBadge = document.createElement('span');
        statusBadge.className = 'text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap';
        if (days === -1) {
            statusBadge.className += ' bg-amber-500 text-white';
            statusBadge.textContent = '⚠️ Aggiorna';
        } else if (days > 30) {
            statusBadge.className += ' bg-red-500 text-white';
            statusBadge.textContent = `🔥 ${days}g`;
        } else if (days > 14) {
            statusBadge.className += ' bg-orange-500 text-white';
            statusBadge.textContent = `⚠️ ${days}g`;
        } else {
            statusBadge.className += ' bg-green-500 text-white';
            statusBadge.textContent = `${days}g`;
        }

        metaDiv.appendChild(gBadge);
        metaDiv.appendChild(dateInfo);
        metaDiv.appendChild(statusBadge);
        
        contentDiv.appendChild(nameSpan);
        contentDiv.appendChild(metaDiv);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-start flex-shrink-0 gap-0.5 -mt-1';

        const createBtn = (iconName, colorClass, title, onClick) => {
            const btn = document.createElement('button');
            btn.className = `${colorClass} transition p-1.5`;
            btn.title = title;
            btn.setAttribute('aria-label', `${title} ${s.name}`);
            btn.addEventListener('click', onClick);
            
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', iconName);
            icon.className = 'w-4 h-4';
            btn.appendChild(icon);
            return btn;
        };

        actionsDiv.appendChild(createBtn('check', 'text-teal-600 hover:text-teal-800', 'Segna come interrogato', () => app.registerInterrogation(s.id, gradesCount)));
        
        if (days !== -1) {
            actionsDiv.appendChild(createBtn('plus', 'text-green-500 hover:text-green-700', 'Aggiungi voto (+1)', () => app.incrementGrade(s.id, gradesCount)));
        }
        
        actionsDiv.appendChild(createBtn('graduation-cap', 'text-purple-500 hover:text-purple-700', 'Modifica numero voti', () => app.updateStudentGrades(s.id, gradesCount)));
        actionsDiv.appendChild(createBtn('pencil', 'text-blue-500 hover:text-blue-700', 'Modifica nome', () => app.updateStudentName(s.id, s.name)));
        actionsDiv.appendChild(createBtn('trash-2', 'text-red-500 hover:text-red-700', 'Elimina', () => app.deleteStudent(s.id)));

        mainWraper.appendChild(contentDiv);
        mainWraper.appendChild(actionsDiv);
        li.appendChild(mainWraper);

        return li;
    },

    initLucide() {
        requestAnimationFrame(() => createIcons({ icons, nameAttr: 'data-lucide' }));
    }
};
