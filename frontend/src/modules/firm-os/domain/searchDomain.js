// Pure domain functions for search and filtering - NO React, NO side effects

export function searchByFields(items = [], query = "", fields = []) {
  if (!query || !items.length) return items;

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    if (!item) return false;

    return fields.some((field) => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], item);
      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
}

export function filterByStatus(items = [], statuses = []) {
  if (!statuses.length) return items;

  return items.filter((item) => {
    const status = item.status || (item.inactive ? "inactivo" : "activo");
    return statuses.includes(status);
  });
}

export function filterByDepartment(items = [], departments = []) {
  if (!departments.length) return items;

  return items.filter((item) => {
    const dept = item.department || item.dept;
    return departments.includes(dept);
  });
}

export function filterByOffice(items = [], offices = []) {
  if (!offices.length) return items;

  return items.filter((item) => {
    const office = item.office;
    return offices.includes(office);
  });
}

export function filterBySpecialty(items = [], specialties = []) {
  if (!specialties.length) return items;

  return items.filter((item) => {
    const specialty = item.specialty;
    return specialties.includes(specialty);
  });
}

export function filterByPriority(items = [], priorities = []) {
  if (!priorities.length) return items;

  return items.filter((item) => {
    const priority = item.priority;
    return priorities.includes(priority);
  });
}

export function filterByDateRange(items = [], startDate, endDate, dateField = "created_at") {
  if (!startDate && !endDate) return items;

  return items.filter((item) => {
    const itemDate = new Date(item[dateField]);
    if (!itemDate) return true;

    if (startDate && itemDate < new Date(startDate)) return false;
    if (endDate && itemDate > new Date(endDate)) return false;

    return true;
  });
}

export function sortEntities(items = [], sortBy = "name", order = "asc") {
  if (!sortBy) return items;

  const sorted = [...items].sort((a, b) => {
    const aVal = sortBy.split(".").reduce((obj, key) => obj?.[key], a);
    const bVal = sortBy.split(".").reduce((obj, key) => obj?.[key], b);

    if (typeof aVal === "string") {
      return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number") {
      return order === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  return sorted;
}

export function applyMultipleFilters(items = [], filterFunctions = []) {
  return filterFunctions.reduce((result, filterFn) => filterFn(result), items);
}

export function buildSearchIndex(items = [], fields = []) {
  const index = {};

  items.forEach((item, idx) => {
    fields.forEach((field) => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], item);
      const normalized = String(value || "").toLowerCase();

      if (normalized) {
        index[normalized] = index[normalized] || [];
        if (!index[normalized].includes(idx)) {
          index[normalized].push(idx);
        }
      }
    });
  });

  return index;
}

export function searchUsingIndex(items = [], query = "", searchIndex = {}) {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();
  const indices = new Set();

  Object.keys(searchIndex).forEach((key) => {
    if (key.includes(lowerQuery)) {
      searchIndex[key].forEach((idx) => indices.add(idx));
    }
  });

  return items.filter((_, idx) => indices.has(idx));
}

export function extractUniqueValues(items = [], field = "") {
  const values = new Set();

  items.forEach((item) => {
    const value = field.split(".").reduce((obj, key) => obj?.[key], item);
    if (value !== null && value !== undefined) {
      values.add(value);
    }
  });

  return Array.from(values).sort();
}
