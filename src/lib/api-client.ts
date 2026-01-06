import { axiosClient } from './axios-client';
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

/**
 * Read-only API client for CF Backend
 * All endpoints return data wrapped in { data, meta, error } envelope
 */
export const apiClient = {
  /**
   * Get paginated list of companies
   * GET /api/companies?page&limit
   */
  async getCompanies(params?: PaginationParams): Promise<ApiResponse<Company[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    const response = await axiosClient.get<ApiResponse<Company[]>>('/companies', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Get a single company by ID
   * GET /api/companies/:id
   */
  async getCompany(id: string): Promise<ApiResponse<Company>> {
    const response = await axiosClient.get<ApiResponse<Company>>(`/companies/${id}`);
    return response.data;
  },

  /**
   * Get contacts for a specific company
   * GET /api/companies/:companyId/contacts?page&limit
   */
  async getCompanyContacts(params: CompanyContactsParams): Promise<ApiResponse<Contact[]>> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    const response = await axiosClient.get<ApiResponse<Contact[]>>(
      `/companies/${params.companyId}/contacts`,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Get handbooks for a specific company
   * GET /api/companies/:companyId/handbooks?page&limit
   */
  async getCompanyHandbooks(params: CompanyHandbooksParams): Promise<ApiResponse<Handbook[]>> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    const response = await axiosClient.get<ApiResponse<Handbook[]>>(
      `/companies/${params.companyId}/handbooks`,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Get pages for a specific handbook (for sidebar tree)
   * GET /api/handbooks/:handbookId/pages?page&limit&langcode=da
   */
  async getHandbookPages(params: HandbookPagesParams): Promise<ApiResponse<HandbookPage[]>> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    queryParams.langcode = params.langcode || 'da';

    const response = await axiosClient.get<ApiResponse<HandbookPage[]>>(
      `/handbooks/${params.handbookId}/pages`,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Get page content by ID
   * GET /api/pages/:pageId?langcode=da
   */
  async getPageContent(params: PageContentParams): Promise<ApiResponse<Page>> {
    const queryParams: Record<string, string> = {};
    queryParams.langcode = params.langcode || 'da';

    const response = await axiosClient.get<ApiResponse<Page>>(`/pages/${params.pageId}`, {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Get paginated list of employees
   * GET /api/employees?page&limit&companyId
   */
  async getEmployees(params?: EmployeesParams): Promise<ApiResponse<Employee[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.companyId) queryParams.companyId = params.companyId;

    const response = await axiosClient.get<ApiResponse<Employee[]>>('/employees', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Get a single employee by ID
   * GET /api/employees/:id
   */
  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    const response = await axiosClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return response.data;
  },
};

