import { describe, it, expect, vi, beforeEach } from 'vitest';

// MUST be before imports
vi.mock('../js/ui.js', () => ({
    ui: {
        showToast: vi.fn(),
        updateStats: vi.fn(),
        render: vi.fn(),
        confirmDialog: vi.fn(),
        promptDialog: vi.fn(),
        renderSkeletons: vi.fn()
    }
}));

vi.mock('../js/api.js', () => ({
    api: {
        getSubjects: vi.fn(),
        getStudents: vi.fn(),
        verifyCode: vi.fn(),
        addStudent: vi.fn(),
        updateStudent: vi.fn(),
        deleteStudent: vi.fn(),
        addSubject: vi.fn(),
        deleteSubject: vi.fn()
    }
}));

// Mock window.prompt
vi.stubGlobal('prompt', vi.fn());

import { app } from '../js/app.js';
import { api } from '../js/api.js';
import { ui } from '../js/ui.js';

describe('App Controller Logic', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // Reset state
        app.state.students = [];
        app.state.subjects = [];
        app.state.subjectColors = {};
        app.state.searchTerm = '';
        
        // Mock localStorage
        vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
        vi.spyOn(localStorage, 'setItem');
        vi.spyOn(localStorage, 'removeItem');

        // Setup DOM
        document.body.innerHTML = `
            <div id="subjectsContainer"></div>
            <div id="statsStudents"></div>
            <div id="alertCount"></div>
            <div id="subjectCount"></div>
            <div id="recentCount"></div>
            <div id="totalStudents"></div>
            <div id="emptyState" class="hidden"></div>
            <input id="searchInput" />
            <select id="subjectSelect"></select>
            <input id="authCodeInput" value="1234">
            <input id="newSubjectName" />
            <input id="newSubjectColor" />
            <input id="nameInput" />
            <input id="dateInput" />
            <input id="gradesCountInput" />
            <button id="authSubmitBtn"></button>
            <div id="loginScreen" class="hidden"></div>
            <div id="subjectsModal" class="hidden">
                 <div id="subjectsList"></div>
                 <button id="addNewSubjectBtn"></button>
            </div>
        `;
        
        // Internal mocks
        vi.spyOn(app, 'hideLogin').mockImplementation(() => {});

        // Default external mocks
        api.getSubjects.mockResolvedValue([]);
        api.getStudents.mockResolvedValue([]);
        api.verifyCode.mockResolvedValue({ success: true });
        api.addStudent.mockResolvedValue({});
        api.updateStudent.mockResolvedValue({ success: true });
        api.deleteStudent.mockResolvedValue({ success: true });
        ui.confirmDialog.mockResolvedValue(true);
        ui.promptDialog.mockResolvedValue('Test');
    });

    describe('Auth flow', () => {
        it('submitLogin handles success', async () => {
            api.verifyCode.mockResolvedValue({ success: true });
            await app.submitLogin();
            expect(api.verifyCode).toHaveBeenCalledWith('1234');
            expect(app.hideLogin).toHaveBeenCalled();
            expect(localStorage.setItem).toHaveBeenCalledWith('is_logged_in', 'true');
        });

        it('checkAuth validates session correctly', () => {
            localStorage.getItem.mockImplementation((key) => {
                if (key === 'is_logged_in') return 'true';
                if (key === 'login_time') return Date.now().toString();
                return null;
            });
            expect(app.checkAuth()).toBe(true);
        });
    });

    describe('Student operations', () => {
        it('deleteStudent works on confirmation (optimistic)', async () => {
            app.state.students = [{ id: 1, name: 'Mario Rossi' }];
            ui.confirmDialog.mockResolvedValue(true);
            api.deleteStudent.mockResolvedValue({ success: true });

            await app.deleteStudent(1);

            expect(ui.confirmDialog).toHaveBeenCalled();
            expect(api.deleteStudent).toHaveBeenCalledWith(1);
            expect(app.state.students.length).toBe(0);
        });

        it('updateStudentName prompts and updates (optimistic)', async () => {
            ui.promptDialog.mockResolvedValue('Mario R.');
            api.updateStudent.mockResolvedValue({ success: true });
            
            await app.updateStudentName(1, 'Mario Rossi');
            
            expect(ui.promptDialog).toHaveBeenCalled();
            expect(api.updateStudent).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mario R.' }));
        });
    });

    describe('Search and Filter', () => {
        it('handleSearch updates state and re-renders', () => {
            vi.spyOn(app, 'render').mockImplementation(() => {});
            app.handleSearch({ target: { value: 'mario' } });
            expect(app.state.searchTerm).toBe('mario');
            expect(app.render).toHaveBeenCalled();
        });

        it('render calls ui.render with current state', () => {
            app.state.students = [{ name: 'A' }];
            app.state.subjectColors = { 'Test': '#fff' };
            app.state.searchTerm = 'a';
            app.render();
            expect(ui.render).toHaveBeenCalledWith(app.state.students, app.state.subjectColors, 'a');
        });
    });

    describe('Student more operations', () => {
        it('registerInterrogation prompts for date and updates (optimistic)', async () => {
            ui.promptDialog.mockResolvedValue('2024-03-12');
            api.updateStudent.mockResolvedValue({ success: true });
            app.state.students = [{ id: 1, name: 'M', grades_count: 2 }];
            
            await app.registerInterrogation(1, 2);
            
            expect(ui.promptDialog).toHaveBeenCalled();
            expect(api.updateStudent).toHaveBeenCalledWith(expect.objectContaining({ last_interrogation: '2024-03-12', grades_count: 3 }));
            expect(app.state.students[0].last_interrogation).toBe('2024-03-12');
        });

        it('registerInterrogation rejects invalid date format', async () => {
            ui.promptDialog.mockResolvedValue('invalid-date');
            await app.registerInterrogation(1, 2);
            expect(ui.showToast).toHaveBeenCalledWith(expect.stringContaining('Formato data non valido'), 'error');
        });
    });

    describe('Subject Management', () => {
        it('addNewSubject works and updates state', async () => {
            api.addSubject.mockResolvedValue({ name: 'History', color: '#ff00ff' });
            
            const nameInput = document.getElementById('newSubjectName');
            const colorInput = document.getElementById('newSubjectColor');
            expect(nameInput).not.toBeNull();
            
            nameInput.value = 'History';
            colorInput.value = '#ff00ff';
            
            await app.addNewSubject();
            
            expect(api.addSubject).toHaveBeenCalled();
            expect(app.state.subjects).toContainEqual({ name: 'History', color: '#ff00ff' });
        });

        it('deleteSubject works after confirmation', async () => {
            ui.confirmDialog.mockResolvedValue(true);
            api.deleteSubject.mockResolvedValue({ success: true });
            app.state.subjects = [{ name: 'Math', color: '#f00' }];
            
            await app.deleteSubject('Math');
            
            expect(api.deleteSubject).toHaveBeenCalledWith('Math');
            expect(app.state.subjects.length).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('loadData handles API failures gracefully', async () => {
            api.getSubjects.mockRejectedValue(new Error('API Down'));
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            await app.loadData();
            
            expect(ui.showToast).toHaveBeenCalledWith(expect.stringContaining('Errore'), 'error');
        });
    });
});
