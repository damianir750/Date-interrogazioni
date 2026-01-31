
export function validateStudent(data) {
    const { name, last_interrogation, subject, grades_count } = data;
    const errors = [];

    if (!name || typeof name !== 'string') {
        errors.push("Missing or invalid 'name'");
    } else if (name.length > 100) {
        errors.push("'name' must be 100 characters or less");
    }

    if (!subject || typeof subject !== 'string') {
        errors.push("Missing or invalid 'subject'");
    } else if (subject.length > 50) {
        errors.push("'subject' must be 50 characters or less");
    }

    if (last_interrogation) {
        // Simple YYYY-MM-DD check
        if (!/^\d{4}-\d{2}-\d{2}$/.test(last_interrogation)) {
            errors.push("'last_interrogation' must be in YYYY-MM-DD format");
        }
    }

    if (grades_count !== undefined && (typeof grades_count !== 'number' || grades_count < 0)) {
        errors.push("'grades_count' must be a non-negative number");
    }

    return errors;
}

export function validateSubject(data) {
    const { name, color } = data;
    const errors = [];

    if (!name || typeof name !== 'string') {
        errors.push("Missing or invalid 'name'");
    } else if (name.length > 50) {
        errors.push("'name' must be 50 characters or less");
    }

    if (!color || typeof color !== 'string') {
        errors.push("Missing or invalid 'color'");
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        errors.push("'color' must be a valid hex code (e.g. #FF0000)");
    }

    return errors;
}

export function validateUpdateStudent(data) {
    const { id, name, grades_count, last_interrogation } = data;
    const errors = [];

    if (!id) {
        errors.push("Missing 'id'");
    }

    if (name !== undefined) {
        if (typeof name !== 'string' || name.length > 100) {
            errors.push("'name' must be a string of 100 characters or less");
        }
    }

    if (last_interrogation !== undefined && last_interrogation !== null) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(last_interrogation)) {
            errors.push("'last_interrogation' must be in YYYY-MM-DD format");
        }
    }

    if (grades_count !== undefined && (typeof grades_count !== 'number' || grades_count < 0)) {
        errors.push("'grades_count' must be a non-negative number");
    }

    return errors;
}
