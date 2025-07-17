# 群组管理Excel导入功能说明

## 功能概述

已成功为群组管理功能添加了Excel文件导入功能，支持两种类型的导入：

### 1. 分组信息导入
- **用途**: 导入分组基础信息（分组名称、教师、联系方式、报到地点等）
- **API端点**: `POST /api/groups/import_excel/`
- **模板下载**: `GET /api/groups/download_template/`

### 2. 学生分组分配导入 ⭐ **新增功能**
- **用途**: 导入学生与分组的对应关系
- **API端点**: `POST /api/assignments/import_assignments/`
- **模板下载**: `GET /api/assignments/download_assignment_template/`

## 技术实现

### 后端实现

#### 1. 模型调整
- **学生模型**: 添加了 `notification_number` 字段（通知书编号）
- **分组模型**: 移除了 `notification_number` 字段
- 通知书编号现在属于学生，实现1对1关系

#### 2. 新增服务类
```python
# backend/core/services.py
class StudentGroupAssignmentImportService:
    """学生分组分配导入服务"""
    
    def import_assignments_from_excel(self, file_path):
        """从Excel文件导入学生分组分配信息"""
        # 支持通过通知书编号和分组名称进行匹配
        # 自动创建分配关系
        # 处理重复分配和错误情况

class ExcelTemplateGenerator:
    """Excel模板生成器"""
    
    @staticmethod
    def generate_assignment_template(file_path):
        """生成学生分组分配导入模板"""
        # 包含通知书编号、分组名称、备注等字段
```

#### 3. API端点
```python
# backend/groups/views.py
class StudentGroupAssignmentViewSet(viewsets.ModelViewSet):
    
    @action(detail=False, methods=['post'])
    def import_assignments(self, request):
        """导入学生分组分配信息"""
    
    @action(detail=False, methods=['get'])
    def download_assignment_template(self, request):
        """下载学生分组分配模板"""
```

### 前端实现

#### 1. 类型定义更新
```typescript
// frontend/src/types/index.ts
export interface Student {
  notification_number: string; // 新增通知书编号
  // ...其他字段
}

export interface GroupInfo {
  // 移除 notification_number 字段
  group_name: string;
  // ...其他字段
}

export interface ImportResponse {
  success_count?: number; // 新增字段
  skip_count?: number;    // 新增字段
  // ...其他字段
}
```

#### 2. API服务更新
```typescript
// frontend/src/services/api.ts
export const GroupService = {
  // 下载学生分组分配模板
  downloadAssignmentTemplate: (): Promise<Blob> => {
    return api.get('/assignments/download_assignment_template/', {
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
}
```

#### 3. UI界面更新
- **分组管理页面**: 添加了双模板下载和导入功能
- **学生列表**: 显示通知书编号列
- **学生表单**: 添加通知书编号输入字段
- **学生详情**: 显示通知书编号信息

## 使用流程

### 分组信息导入流程
1. 访问分组管理页面
2. 点击"导入Excel" → "下载分组信息模板"
3. 填写分组基础信息（分组名称、教师、联系方式、报到地点）
4. 点击"导入分组信息"上传填写好的Excel文件

### 学生分组分配导入流程
1. 确保系统中已有学生信息和分组信息
2. 访问分组管理页面
3. 点击"导入Excel" → "下载分配关系模板"
4. 填写学生分组分配信息：
   - 通知书编号（关联学生）
   - 分组名称（关联分组）
   - 备注（可选）
5. 点击"导入分配关系"上传填写好的Excel文件

## 数据验证

### 学生分组分配导入验证
- ✅ 通知书编号必须存在于系统中
- ✅ 分组名称必须存在于系统中
- ✅ 同一学生不能重复分配到同一分组
- ✅ 自动跳过已存在的分配关系
- ✅ 详细的错误信息反馈

## 数据库迁移

已完成的迁移：
- `core.0003_student_notification_number`: 为学生模型添加通知书编号字段
- `groups.0002_alter_groupinfo_options_and_more`: 从分组模型移除通知书编号字段

## API测试状态

### ✅ 已测试通过
- `GET /api/groups/download_template/` - 分组信息模板下载
- `GET /api/assignments/download_assignment_template/` - 学生分组分配模板下载
- `GET /api/students/` - 学生列表（包含通知书编号）
- `GET /api/groups/` - 分组列表（移除通知书编号）

### 🔄 待测试
- `POST /api/assignments/import_assignments/` - 学生分组分配导入
- 前端完整流程测试

## 文件结构

### 后端文件
- `backend/core/models.py` - 学生模型更新
- `backend/groups/models.py` - 分组模型更新
- `backend/core/services.py` - 新增导入服务
- `backend/groups/views.py` - 新增API端点
- `backend/core/admin.py` - 管理界面更新
- `backend/groups/admin.py` - 管理界面更新

### 前端文件
- `frontend/src/types/index.ts` - 类型定义更新
- `frontend/src/services/api.ts` - API服务更新
- `frontend/src/pages/GroupManagement.tsx` - 分组管理页面更新
- `frontend/src/pages/StudentList.tsx` - 学生列表更新
- `frontend/src/components/StudentFormModal.tsx` - 学生表单更新
- `frontend/src/components/StudentDetailModal.tsx` - 学生详情更新
- `frontend/src/components/GroupStudentsModal.tsx` - 分组学生管理更新

## 状态总结

- ✅ 后端API开发完成
- ✅ 前端组件更新完成
- ✅ 类型定义更新完成
- ✅ 数据库迁移完成
- ✅ 前端构建测试通过
- 🔄 完整功能流程测试待进行

该功能已基本完成开发，可以进行完整的端到端测试。
