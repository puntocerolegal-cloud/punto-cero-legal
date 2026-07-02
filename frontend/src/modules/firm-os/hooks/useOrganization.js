import { useMemo } from 'react';
import {
  deriveOffices,
  deriveDepartments,
  buildOfficeMetrics,
  buildDepartmentMetrics,
  getOfficesSummary,
  getDepartmentsSummary,
} from '../utils/organizationHelpers';

/**
 * useOrganization — Derive offices and departments from core data
 * Reuses lawyers and cases from useFirmCoreData to create organization structure
 */
export function useOrganization(lawyers = [], cases = []) {
  // Raw office list
  const offices = useMemo(() => {
    return deriveOffices(lawyers);
  }, [lawyers]);

  // Raw department list
  const departments = useMemo(() => {
    return deriveDepartments(lawyers);
  }, [lawyers]);

  // Offices with metrics
  const officesWithMetrics = useMemo(() => {
    return offices.map(office => buildOfficeMetrics(office, lawyers, cases));
  }, [offices, lawyers, cases]);

  // Departments with metrics
  const departmentsWithMetrics = useMemo(() => {
    return departments.map(dept => buildDepartmentMetrics(dept, lawyers, cases));
  }, [departments, lawyers, cases]);

  // Summary statistics
  const officesSummary = useMemo(() => {
    return getOfficesSummary(lawyers, cases);
  }, [lawyers, cases]);

  const departmentsSummary = useMemo(() => {
    return getDepartmentsSummary(lawyers, cases);
  }, [lawyers, cases]);

  return {
    // Raw data
    offices,
    departments,

    // With metrics
    officesWithMetrics,
    departmentsWithMetrics,

    // Summary
    officesSummary,
    departmentsSummary,

    // Convenience
    totalOffices: offices.length,
    totalDepartments: departments.length,
  };
}

export default useOrganization;
