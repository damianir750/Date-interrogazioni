/**
 * API Wrapper for Date Interrogazioni App
 */

const BASE_URL = '/api';

const getAuthCode = () => localStorage.getItem('auth_code') || '';

const request = async (endpoint, method = 'GET', body = null, signal = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-auth-code': getAuthCode()
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    if (signal) {
        options.signal = signal;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    // Handle unauthorized — redirect to login (but not for verify-code which is the login endpoint itself)
    if (res.status === 401 && !endpoint.includes('verify-code')) {
        localStorage.removeItem('auth_code');
        window.dispatchEvent(new Event('auth-expired'));
        throw new Error('Non autorizzato');
    }

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
    getSubjects: (signal = null) => request('/get-subjects', 'GET', null, signal),

    getStudents: (forceRefresh = false, signal = null) => {
        const query = forceRefresh ? `?t=${Date.now()}` : '';
        return request(`/get-students${query}`, 'GET', null, signal);
    },

    addStudent: (student) => request('/add-student', 'POST', student),

    updateStudent: (data) => request('/update-student', 'POST', data),

    deleteStudent: (id) => request('/delete-student', 'POST', { id }),

    addSubject: (subject) => request('/add-subject', 'POST', subject),

    deleteSubject: (name) => request('/delete-subject', 'POST', { name }),

    verifyCode: (code) => request('/verify-code', 'POST', { code })
};
