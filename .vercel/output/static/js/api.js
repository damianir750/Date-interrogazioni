/**
 * API Wrapper for Date Interrogazioni App
 */

const BASE_URL = '/api';

const request = async (endpoint, method = 'GET', body = null) => {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    // For delete-subject which might return 400 with message
    if (!res.ok) {
        let errorMessage = `HTTP Error ${res.status}`;
        try {
            const data = await res.json();
            if (data.error) errorMessage = data.error;
        } catch (e) {
            // Ignore json parse error if it fails
        }
        throw new Error(errorMessage);
    }

    // Some endpoints might not return JSON (e.g. 204 No Content, though here we mostly return JSON)
    try {
        return await res.json();
    } catch (e) {
        return null;
    }
};

export const api = {
    getSubjects: () => request('/get-subjects'),

    getStudents: (forceRefresh = false) => {
        const query = forceRefresh ? `?t=${Date.now()}` : '';
        return request(`/get-students${query}`);
    },

    addStudent: (student) => request('/add-student', 'POST', student),

    updateStudent: (data) => request('/update-student', 'POST', data),

    deleteStudent: (id) => request('/delete-student', 'POST', { id }),

    addSubject: (subject) => request('/add-subject', 'POST', subject),

    deleteSubject: (name) => request('/delete-subject', 'POST', { name })
};
