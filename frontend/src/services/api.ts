import axios from 'axios';
import { 
  Student, 
  StudentListItem, 
  StudentStatistics, 
  ApiResponse, 
  StudentProfileUpdate, 
  ImportResponse,
  StudentFilters,
  GroupInfo,
  GroupFilters,
  GroupStatistics,
  GroupStudentList,
  StudentGroupAssignment,
  PreviewResult,
  DeleteResponse,
  ImportBatchesResponse,
  LoginRequest,
  LoginResponse,
  AuthResponse
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Django后端地址
  timeout: 30000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 在这里可以添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export class StudentService {
  // 获取学生列表
  static async getStudents(params?: {
    page?: number;
    page_size?: number;
    filters?: StudentFilters;
    ordering?: string;
  }): Promise<ApiResponse<StudentListItem>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.page_size) {
      queryParams.append('page_size', params.page_size.toString());
    }
    if (params?.ordering) {
      queryParams.append('ordering', params.ordering);
    }
    
    // 添加过滤器
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/students/?${queryParams.toString()}`);
    return response.data;
  }

  // 获取单个学生详细信息
  static async getStudent(id: number): Promise<Student> {
    const response = await api.get(`/students/${id}/`);
    return response.data;
  }

  // 创建学生
  static async createStudent(student: Partial<Student>): Promise<Student> {
    const response = await api.post('/students/', student);
    return response.data;
  }

  // 更新学生信息
  static async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    const response = await api.put(`/students/${id}/`, student);
    return response.data;
  }

  // 删除学生
  static async deleteStudent(id: number): Promise<void> {
    await api.delete(`/students/${id}/`);
  }

  // 完善学生资料
  static async completeProfile(id: number, profileData: StudentProfileUpdate): Promise<{
    message: string;
    completion_percentage: number;
    info_status: string;
    student: Student;
  }> {
    const response = await api.post(`/students/${id}/complete_profile/`, profileData);
    return response.data;
  }

  // 从Excel导入学生信息
  static async importFromExcel(file: File, batchName?: string): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (batchName) {
      formData.append('batch_name', batchName);
    }

    const response = await api.post('/students/import_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 下载模板
  static async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/students/download_template/', {
      responseType: 'blob',
    });
    return response.data;
  }

  // 获取统计信息
  static async getStatistics(): Promise<StudentStatistics> {
    const response = await api.get('/students/statistics/');
    return response.data;
  }

  // 获取资料不完整的学生列表
  static async getIncompleteProfiles(params?: {
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<StudentListItem>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.page_size) {
      queryParams.append('page_size', params.page_size.toString());
    }
    
    const response = await api.get(`/students/incomplete_profiles/?${queryParams.toString()}`);
    return response.data;
  }

  // 批量创建学生
  static async bulkCreateStudents(students: Partial<Student>[]): Promise<Student[]> {
    const response = await api.post('/students/bulk_create/', students);
    return response.data;
  }

  // 批量删除学生
  static async bulkDeleteStudents(params: {
    student_ids?: number[];
    import_batch?: string;
    delete_all?: boolean;
  }): Promise<DeleteResponse> {
    const response = await api.delete('/students/bulk_delete/', {
      data: params
    });
    return response.data;
  }

  // 获取所有导入批次
  static async getImportBatches(): Promise<ImportBatchesResponse> {
    const response = await api.get('/students/import_batches/');
    return response.data;
  }

  // 通过姓名和身份证后6位查询学生
  static async lookupByNameAndIdSuffix(data: {
    name: string;
    id_suffix: string;
  }): Promise<{
    message: string;
    student: Student;
  }> {
    const response = await api.post('/students/lookup_by_name_and_id_suffix/', data);
    return response.data;
  }

  // 获取学生分组信息
  static async getStudentGroups(studentId: number): Promise<{
    student: Student;
    groups: any[];
  }> {
    const response = await api.get(`/students/${studentId}/groups/`);
    return response.data;
  }
}

// 分组管理API
export const GroupService = {
  // 获取分组列表
  getGroups: (params?: {
    page?: number;
    page_size?: number;
    filters?: GroupFilters;
    ordering?: string;
  }): Promise<ApiResponse<GroupInfo>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.ordering) searchParams.append('ordering', params.ordering);
    
    // 处理过滤器
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return api.get(`/groups/?${searchParams.toString()}`).then(res => res.data);
  },

  // 获取单个分组详情
  getGroup: (id: number): Promise<GroupInfo> => {
    return api.get(`/groups/${id}/`).then(res => res.data);
  },

  // 创建分组
  createGroup: (data: Omit<GroupInfo, 'id' | 'student_count' | 'created_at' | 'updated_at'>): Promise<GroupInfo> => {
    return api.post('/groups/', data).then(res => res.data);
  },

  // 更新分组
  updateGroup: (id: number, data: Partial<GroupInfo>): Promise<GroupInfo> => {
    return api.put(`/groups/${id}/`, data).then(res => res.data);
  },

  // 删除分组
  deleteGroup: (id: number): Promise<void> => {
    return api.delete(`/groups/${id}/`);
  },

  // 获取分组统计
  getGroupStatistics: (): Promise<GroupStatistics> => {
    return api.get('/groups/statistics/').then(res => res.data);
  },

  // 获取分组中的学生列表
  getGroupStudents: (groupId: number): Promise<GroupStudentList> => {
    return api.get(`/groups/${groupId}/students/`).then(res => res.data);
  },

  // 为分组分配学生
  assignStudent: (groupId: number, studentId: number, remarks?: string): Promise<StudentGroupAssignment> => {
    return api.post(`/groups/${groupId}/assign_student/`, {
      student_id: studentId,
      remarks: remarks || ''
    }).then(res => res.data);
  },

  // 从分组中移除学生
  removeStudent: (groupId: number, studentId: number): Promise<void> => {
    return api.delete(`/groups/${groupId}/remove_student/`, {
      data: { student_id: studentId }
    });
  },

  // 导入分组Excel
  importGroupsExcel: (file: File): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/groups/import_excel/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  // 下载分组导入模板
  downloadGroupTemplate: (): Promise<Blob> => {
    return api.get('/groups/download_template/', {
      responseType: 'blob',
    }).then(res => res.data);
  },

  // 导入学生分组分配Excel
  importAssignmentsExcel: (file: File): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/assignments/import_assignments/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  // 下载学生分组分配导入模板
  downloadAssignmentTemplate: (): Promise<Blob> => {
    return api.get('/assignments/download_assignment_template/', {
      responseType: 'blob',
    }).then(res => res.data);
  },

    // 预览学生分组分配Excel
  previewAssignmentsExcel: (file: File): Promise<PreviewResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/assignments/preview_import_assignments/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  // 批量删除分组
  bulkDeleteGroups: (params: {
    group_ids?: number[];
    group_names?: string[];
    delete_all?: boolean;
  }): Promise<DeleteResponse> => {
    return api.delete('/groups/bulk_delete/', {
      data: params
    }).then(res => res.data);
  },
};

// 学生分组分配API
export const AssignmentService = {
  // 获取分配列表
  getAssignments: (params?: {
    page?: number;
    page_size?: number;
    group_name?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<ApiResponse<StudentGroupAssignment>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.group_name) searchParams.append('group_info__group_name', params.group_name);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    return api.get(`/assignments/?${searchParams.toString()}`).then(res => res.data);
  },

  // 批量分配学生
  bulkAssign: (assignments: Array<{
    student: number;
    group_info: number;
    remarks?: string;
  }>): Promise<StudentGroupAssignment[]> => {
    return api.post('/assignments/bulk_assign/', assignments).then(res => res.data);
  },
};

// 认证服务
export const AuthService = {
  // 管理员登录
  login: (credentials: LoginRequest): Promise<LoginResponse> => {
    return api.post('/auth/login/', credentials).then(res => res.data);
  },

  // 管理员登出
  logout: (): Promise<{ message: string }> => {
    return api.post('/auth/logout/').then(res => res.data);
  },

  // 检查认证状态
  checkAuth: (): Promise<AuthResponse> => {
    return api.get('/auth/check/').then(res => res.data);
  },
};

export default api;
