// Application layer for search - orchestrates domain + data without React

import {
  searchByFields,
  filterByStatus,
  filterByDepartment,
  filterByOffice,
  sortEntities,
  extractUniqueValues,
} from "../domain/searchDomain";

export function buildLawyerSearchViewModel(lawyers = [], searchQuery = "", filters = {}, sortBy = "name") {
  let results = [...lawyers];

  // Search
  if (searchQuery) {
    results = searchByFields(results, searchQuery, ["name", "specialty", "email", "office"]);
  }

  // Filters
  if (filters.status) {
    results = filterByStatus(results, Array.isArray(filters.status) ? filters.status : [filters.status]);
  }

  if (filters.specialty) {
    const specialties = Array.isArray(filters.specialty) ? filters.specialty : [filters.specialty];
    results = results.filter((l) => specialties.includes(l.specialty));
  }

  if (filters.department) {
    results = filterByDepartment(results, Array.isArray(filters.department) ? filters.department : [filters.department]);
  }

  if (filters.office) {
    results = filterByOffice(results, Array.isArray(filters.office) ? filters.office : [filters.office]);
  }

  // Sort
  results = sortEntities(results, sortBy, "asc");

  return {
    results,
    count: results.length,
    filterOptions: {
      status: ["Activo", "Inactivo"],
      specialty: extractUniqueValues(lawyers, "specialty"),
      department: extractUniqueValues(lawyers, "department"),
      office: extractUniqueValues(lawyers, "office"),
    },
  };
}

export function buildDepartmentSearchViewModel(departments = [], searchQuery = "", filters = {}) {
  let results = [...departments];

  if (searchQuery) {
    results = searchByFields(results, searchQuery, ["name", "description"]);
  }

  if (filters.status) {
    results = filterByStatus(results, Array.isArray(filters.status) ? filters.status : [filters.status]);
  }

  results = sortEntities(results, "name", "asc");

  return {
    results,
    count: results.length,
    filterOptions: {
      status: ["Activo", "Inactivo"],
    },
  };
}

export function buildOfficeSearchViewModel(offices = [], searchQuery = "", filters = {}) {
  let results = [...offices];

  if (searchQuery) {
    results = searchByFields(results, searchQuery, ["name", "location", "address"]);
  }

  if (filters.status) {
    results = filterByStatus(results, Array.isArray(filters.status) ? filters.status : [filters.status]);
  }

  results = sortEntities(results, "name", "asc");

  return {
    results,
    count: results.length,
    filterOptions: {
      status: ["Activa", "Inactiva"],
    },
  };
}

export function buildCaseSearchViewModel(cases = [], lawyers = [], searchQuery = "", filters = {}) {
  let results = [...cases];

  if (searchQuery) {
    results = searchByFields(results, searchQuery, ["case_number", "client_name", "case_type"]);
  }

  if (filters.status) {
    results = filterByStatus(results, Array.isArray(filters.status) ? filters.status : [filters.status]);
  }

  if (filters.priority) {
    const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
    results = results.filter((c) => priorities.includes(c.priority));
  }

  results = sortEntities(results, "case_number", "asc");

  return {
    results,
    count: results.length,
    filterOptions: {
      status: ["Open", "In Progress", "Closed"],
      priority: ["High", "Medium", "Low"],
    },
  };
}

export function buildAssignmentSearchViewModel(cases = [], lawyers = [], searchQuery = "", filters = {}) {
  let results = [...cases].filter((c) => !c.lawyer_id || c.assignment_status === "nuevo");

  if (searchQuery) {
    results = searchByFields(results, searchQuery, ["case_number", "client_name"]);
  }

  if (filters.priority) {
    const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
    results = results.filter((c) => priorities.includes(c.priority));
  }

  results = sortEntities(results, "case_number", "asc");

  return {
    results,
    count: results.length,
    availableLawyers: lawyers.filter((l) => l.available !== false && !l.inactive),
    filterOptions: {
      priority: ["High", "Medium", "Low"],
    },
  };
}

export function buildAnalyticsSearchViewModel(lawyers = [], searchQuery = "", filters = {}) {
  let results = [...lawyers];

  if (searchQuery) {
    results = searchByFields(results, searchQuery, ["name", "specialty", "department"]);
  }

  if (filters.department) {
    results = filterByDepartment(results, Array.isArray(filters.department) ? filters.department : [filters.department]);
  }

  results = sortEntities(results, "name", "asc");

  return {
    results,
    count: results.length,
    filterOptions: {
      department: extractUniqueValues(lawyers, "department"),
    },
  };
}
