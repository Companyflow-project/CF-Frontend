import { axiosClient } from './axios-client';
import type {
  ApiResponse,
  Company,
  Contact,
  Department,
  Handbook,
  HandbookPage,
  HandbookDetail,
  Employee,
  Page,
  User,
  PaginationParams,
  CompanyContactsParams,
  CompanyHandbooksParams,
  HandbookPagesParams,
  PageContentParams,
  EmployeesParams,
  DepartmentsParams,
  ContactsListParams,
  HandbooksListParams,
  LimitOffsetParams,
  HealthData,
  AuthLoginData,
  AuthMeData,
} from './api-types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

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
    const queryParams: Record<string, string> = {
      page: String(params?.page ?? DEFAULT_PAGE),
      limit: String(params?.limit ?? DEFAULT_LIMIT),
    };

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
    const queryParams: Record<string, string> = {
      page: String(params.page ?? DEFAULT_PAGE),
      limit: String(params.limit ?? DEFAULT_LIMIT),
    };

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
    const queryParams: Record<string, string> = {
      page: String(params.page ?? DEFAULT_PAGE),
      limit: String(params.limit ?? DEFAULT_LIMIT),
    };

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
    const queryParams: Record<string, string> = {
      page: String(params.page ?? DEFAULT_PAGE),
      limit: String(params.limit ?? DEFAULT_LIMIT),
      langcode: params.langcode || 'da',
    };

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
    const queryParams: Record<string, string> = {
      page: String(params?.page ?? DEFAULT_PAGE),
      limit: String(params?.limit ?? DEFAULT_LIMIT),
    };
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

  /**
   * Fetch all employees by requesting all pages (backend may cap limit per request).
   */
  async getEmployeesAll(params?: { companyId?: string }): Promise<ApiResponse<Employee[]>> {
    const limit = 500;
    let page = 1;
    let all: Employee[] = [];
    let meta: ApiResponse<Employee[]>['meta'];
    while (true) {
      const res = await this.getEmployees({
        ...params,
        page,
        limit,
      });
      all = all.concat(res.data);
      meta = res.meta;
      const total = meta?.total ?? all.length;
      if (all.length >= total) break;
      page += 1;
    }
    return { data: all, meta: meta ?? undefined, error: null };
  },

  /** GET /api/health */
  async getHealth(): Promise<ApiResponse<HealthData>> {
    const response = await axiosClient.get<ApiResponse<HealthData>>('/health');
    return response.data;
  },

  /** GET /api/departments?companyId&page&limit */
  async getDepartments(params?: DepartmentsParams): Promise<ApiResponse<Department[]>> {
    const queryParams: Record<string, string> = {
      page: String(params?.page ?? DEFAULT_PAGE),
      limit: String(params?.limit ?? DEFAULT_LIMIT),
    };
    if (params?.companyId) queryParams.companyId = params.companyId;
    const response = await axiosClient.get<ApiResponse<Department[]>>('/departments', {
      params: queryParams,
    });
    return response.data;
  },

  /** GET /api/departments/:id */
  async getDepartment(id: string): Promise<ApiResponse<Department>> {
    const response = await axiosClient.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data;
  },

  /** GET /api/contacts?companyId&page&limit */
  async getContacts(params?: ContactsListParams): Promise<ApiResponse<Contact[]>> {
    const queryParams: Record<string, string> = {
      page: String(params?.page ?? DEFAULT_PAGE),
      limit: String(params?.limit ?? DEFAULT_LIMIT),
    };
    if (params?.companyId) queryParams.companyId = params.companyId;
    const response = await axiosClient.get<ApiResponse<Contact[]>>('/contacts', {
      params: queryParams,
    });
    return response.data;
  },

  /** GET /api/contacts/:id */
  async getContact(id: string): Promise<ApiResponse<Contact>> {
    const response = await axiosClient.get<ApiResponse<Contact>>(`/contacts/${id}`);
    return response.data;
  },

  /** GET /api/handbooks?companyId&page&limit */
  async getHandbooks(params?: HandbooksListParams): Promise<ApiResponse<Handbook[]>> {
    const queryParams: Record<string, string> = {
      page: String(params?.page ?? DEFAULT_PAGE),
      limit: String(params?.limit ?? DEFAULT_LIMIT),
    };
    if (params?.companyId) queryParams.companyId = params.companyId;
    const response = await axiosClient.get<ApiResponse<Handbook[]>>('/handbooks', {
      params: queryParams,
    });
    return response.data;
  },

  /** GET /api/handbooks/:id?detail&langcode */
  async getHandbook(
    id: string,
    opts?: { detail?: boolean; langcode?: string }
  ): Promise<ApiResponse<HandbookDetail>> {
    const queryParams: Record<string, string> = {};
    if (opts?.detail !== undefined) queryParams.detail = String(opts.detail);
    if (opts?.langcode) queryParams.langcode = opts.langcode;
    const response = await axiosClient.get<ApiResponse<HandbookDetail>>(`/handbooks/${id}`, {
      params: queryParams,
    });
    return response.data;
  },

  /** POST /api/auth/login */
  async postAuthLogin(body: { email: string; password: string }): Promise<ApiResponse<AuthLoginData>> {
    const response = await axiosClient.post<ApiResponse<AuthLoginData>>('/auth/login', body);
    return response.data;
  },

  /** GET /api/auth/me (requires Bearer token) */
  async getAuthMe(): Promise<ApiResponse<AuthMeData>> {
    const response = await axiosClient.get<ApiResponse<AuthMeData>>('/auth/me');
    return response.data;
  },

  /** GET /api/pages?limit&offset */
  async getPages(params?: LimitOffsetParams): Promise<ApiResponse<Page[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.offset) queryParams.offset = String(params.offset);
    const response = await axiosClient.get<ApiResponse<Page[]>>('/pages', { params: queryParams });
    return response.data;
  },

  /** GET /api/users?limit&offset */
  async getUsers(params?: LimitOffsetParams): Promise<ApiResponse<User[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.offset) queryParams.offset = String(params.offset);
    const response = await axiosClient.get<ApiResponse<User[]>>('/users', { params: queryParams });
    return response.data;
  },
};

