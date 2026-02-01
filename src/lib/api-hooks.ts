import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api-client';
import type {
  ApiResponse,
  Company,
  Contact,
  Handbook,
  HandbookPage,
  Employee,
  Page,
  PaginationParams,
  CompanyContactsParams,
  CompanyHandbooksParams,
  HandbookPagesParams,
  PageContentParams,
  EmployeesParams,
} from './api-types';

interface UseApiState<T> {
  data: T | null;
  meta: ApiResponse<T>['meta'];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching companies list
 */
export const useCompanies = (params?: PaginationParams): UseApiState<Company[]> => {
  const [data, setData] = useState<Company[] | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Company[]>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCompanies(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch companies'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching a single company
 */
export const useCompany = (id: string | null): UseApiState<Company> => {
  const [data, setData] = useState<Company | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Company>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCompany(id);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch company'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching company contacts
 */
export const useCompanyContacts = (
  params: CompanyContactsParams | null
): UseApiState<Contact[]> => {
  const [data, setData] = useState<Contact[] | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Contact[]>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!params) {
      setData(null);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCompanyContacts(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.companyId, params?.page, params?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching company handbooks
 */
export const useCompanyHandbooks = (
  params: CompanyHandbooksParams | null
): UseApiState<Handbook[]> => {
  const [data, setData] = useState<Handbook[] | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Handbook[]>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!params) {
      setData(null);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCompanyHandbooks(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch handbooks'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.companyId, params?.page, params?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching handbook pages (sidebar tree)
 */
export const useHandbookPages = (
  params: HandbookPagesParams | null
): UseApiState<HandbookPage[]> => {
  const [data, setData] = useState<HandbookPage[] | null>(null);
  const [meta, setMeta] = useState<ApiResponse<HandbookPage[]>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!params) {
      setData(null);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getHandbookPages(params);
      // response is ApiResponse<HandbookPage[]>
      // response.data is the HandbookPage[] array
      // response.meta is the pagination metadata
      setData(Array.isArray(response.data) ? response.data : []);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch handbook pages'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.handbookId, params?.page, params?.limit, params?.langcode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching page content
 */
export const usePageContent = (
  params: PageContentParams | null
): UseApiState<Page> => {
  const [data, setData] = useState<Page | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Page>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!params) {
      setData(null);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPageContent(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch page content'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.pageId, params?.langcode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching employees list
 */
export const useEmployees = (params?: EmployeesParams): UseApiState<Employee[]> => {
  const [data, setData] = useState<Employee[] | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Employee[]>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployees(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employees'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.companyId, params?.page, params?.limit, params?.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching all employees (all pages; use when backend caps limit per request).
 */
export const useEmployeesAll = (params?: { companyId?: string }): UseApiState<Employee[]> => {
  const [data, setData] = useState<Employee[] | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Employee[]>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployeesAll(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employees'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [params?.companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching a single employee
 */
export const useEmployee = (id: string | null): UseApiState<Employee> => {
  const [data, setData] = useState<Employee | null>(null);
  const [meta, setMeta] = useState<ApiResponse<Employee>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      setMeta(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployee(id);
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employee'));
      setData(null);
      setMeta(undefined);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, error, refetch: fetchData };
};

