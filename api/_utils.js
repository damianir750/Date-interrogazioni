export function requireJson(request) {
  const contentType = request.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    return false;
  }
  return true;
}

export function validateStudent(data) {
  const { name, last_interrogation, subject, grades_count } = data;
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Missing or invalid 'name'");
  } else if (name.length > 100) {
    errors.push("'name' must be 100 characters or less");
  }

  if (!subject || typeof subject !== "string") {
    errors.push("Missing or invalid 'subject'");
  } else if (subject.length > 50) {
    errors.push("'subject' must be 50 characters or less");
  }

  if (last_interrogation) {
    // Semantic date check (prevent rollover like Feb 30 -> March 2)
    const d = new Date(last_interrogation);
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(last_interrogation);
    const iso =
      !isNaN(d.getTime()) && isValidFormat ? d.toISOString().split("T")[0] : "";

    if (isNaN(d.getTime()) || !isValidFormat || iso !== last_interrogation) {
      errors.push(
        "'last_interrogation' must be a valid date in YYYY-MM-DD format",
      );
    } else if (d.getFullYear() < 2000 || d.getFullYear() > 2100) {
      errors.push("'last_interrogation' year must be between 2000 and 2100");
    }
  }

  if (grades_count !== undefined) {
    if (
      typeof grades_count !== "number" ||
      grades_count < 0 ||
      grades_count > 999
    ) {
      errors.push("'grades_count' must be a number between 0 and 999");
    }
  }

  return errors;
}

export function validateSubject(data) {
  const { name, color } = data;
  const errors = [];

  if (!name || typeof name !== "string") {
    errors.push("Missing or invalid 'name'");
  } else if (name.length > 50) {
    errors.push("'name' must be 50 characters or less");
  }

  if (!color || typeof color !== "string") {
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
    if (typeof name !== "string" || name.length > 100) {
      errors.push("'name' must be a string of 100 characters or less");
    }
  }

  if (last_interrogation !== undefined && last_interrogation !== null) {
    const d = new Date(last_interrogation);
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(last_interrogation);
    const iso =
      !isNaN(d.getTime()) && isValidFormat ? d.toISOString().split("T")[0] : "";

    if (isNaN(d.getTime()) || !isValidFormat || iso !== last_interrogation) {
      errors.push(
        "'last_interrogation' must be a valid date in YYYY-MM-DD format",
      );
    }
  }

  if (grades_count !== undefined) {
    if (
      typeof grades_count !== "number" ||
      grades_count < 0 ||
      grades_count > 999
    ) {
      errors.push("'grades_count' must be a number between 0 and 999");
    }
  }

  return errors;
}

export function validateDeleteStudent(data) {
  const { id } = data;
  const errors = [];
  if (!id) {
    errors.push("Missing 'id'");
  }
  return errors;
}

export function validateDeleteSubject(data) {
  const { name } = data;
  const errors = [];
  if (!name || typeof name !== "string") {
    errors.push("Missing or invalid 'name'");
  } else if (name.length > 50) {
    errors.push("'name' must be 50 characters or less");
  }
  return errors;
}

export function parseRequestBody(request) {
  // 10KB payload limit for incoming requests
  const contentLength = request.headers["content-length"];
  if (contentLength && parseInt(contentLength, 10) > 10240) {
    throw new Error("Payload Too Large");
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (e) {
      return null;
    }
  }
  return body;
}
