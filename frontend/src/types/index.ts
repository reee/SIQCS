// 学生信息类型定义
export interface Student {
  id: number;
  name: string;
  id_card_number: string;
  notification_number: string;
  gender: 'M' | 'F';
  gender_display: string;
  residence_status: 'RESIDENT' | 'NON_RESIDENT' | 'UNKNOWN';
  residence_status_display: string;
  height?: number;
  weight?: number;
  uniform_purchase?: boolean;
  interests_talents: string;
  phone_number: string;
  email: string;
  info_status: 'IMPORTED' | 'PARTIAL' | 'COMPLETE';
  info_status_display: string;
  completion_percentage: number;
  import_batch: string;
  import_row_number?: number;
  age?: number;
  bmi?: number;
  created_at: string;
  updated_at: string;
  profile_completed_at?: string;
}

// 学生列表项类型（简化版）
export interface StudentListItem {
  id: number;
  name: string;
  id_card_number: string;
  notification_number: string;
  gender_display: string;
  residence_status_display: string;
  age?: number;
  uniform_purchase?: boolean;
  info_status: 'IMPORTED' | 'PARTIAL' | 'COMPLETE';
  info_status_display: string;
  completion_percentage: number;
  import_batch: string;
}

// 学生统计信息类型
export interface StudentStatistics {
  total_students: number;
  gender_distribution: {
    male: number;
    female: number;
  };
  residence_distribution: {
    resident: number;
    non_resident: number;
    unknown: number;
  };
  uniform_purchase: {
    purchased: number;
    not_purchased: number;
    unknown: number;
  };
  info_completion: {
    IMPORTED: number;
    PARTIAL: number;
    COMPLETE: number;
  };
  physical_stats: {
    average_height: number;
    average_weight: number;
    height_count: number;
    weight_count: number;
  };
  import_batches: number;
}

// API响应类型
export interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// 学生资料更新类型
export interface StudentProfileUpdate {
  residence_status?: 'RESIDENT' | 'NON_RESIDENT' | 'UNKNOWN';
  height?: number;
  weight?: number;
  uniform_purchase?: boolean;
  interests_talents?: string;
  phone_number?: string;
  email?: string;
}

// 文件上传响应类型
export interface ImportResponse {
  success: boolean;
  message: string;
  total_rows?: number;
  successful_imports?: number;
  failed_imports?: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

// 表格过滤器类型
export interface StudentFilters {
  gender?: 'M' | 'F';
  residence_status?: 'RESIDENT' | 'NON_RESIDENT' | 'UNKNOWN';
  uniform_purchase?: boolean;
  info_status?: 'IMPORTED' | 'PARTIAL' | 'COMPLETE';
  search?: string;
}

// 分组信息类型
export interface GroupInfo {
  id: number;
  group_name: string;
  group_teacher: string;
  teacher_phone: string;
  report_location: string;
  student_count: number;
  created_at: string;
  updated_at: string;
}

// 学生分组分配类型
export interface StudentGroupAssignment {
  id: number;
  student: number;
  student_info: StudentListItem;
  group_info: number;
  group_info_detail: GroupInfo;
  assigned_at: string;
  is_active: boolean;
  remarks: string;
}

// 分组统计信息类型
export interface GroupStatistics {
  total_groups: number;
  total_teachers: number;
  total_assigned_students: number;
  group_details: Array<{
    group_name: string;
    group_teacher: string;
    student_count: number;
    report_location: string;
  }>;
}

// 分组学生列表类型
export interface GroupStudentList {
  id: number;
  group_name: string;
  group_teacher: string;
  teacher_phone: string;
  report_location: string;
  students: Array<{
    assignment_id: number;
    student: StudentListItem;
    assigned_at: string;
    remarks: string;
  }>;
}

// 分组过滤器类型
export interface GroupFilters {
  group_name?: string;
  group_teacher?: string;
  search?: string;
}
