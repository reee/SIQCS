# 学生信息查询及收集系统 - 后端API

## 项目概述

本项目是一个基于Django REST Framework的学生信息管理系统，主要包含以下功能：

- **学生基础信息管理**：姓名、身份证号、性别、住校情况、身高体重、校服订购、兴趣特长
- **分组信息管理**：通知书编号、分组信息、教师信息、报到地点
- **学生分组分配**：学生与分组的关联管理

## 技术栈

- **后端框架**：Django 5.2.3
- **API框架**：Django REST Framework 3.16.0
- **数据库**：SQLite (开发环境)
- **跨域处理**：django-cors-headers
- **数据过滤**：django-filter
- **环境管理**：python-dotenv

## 项目结构

```
backend/
├── siqcs_backend/          # 主项目配置
│   ├── settings.py         # Django设置
│   ├── urls.py            # 主路由配置
│   └── views.py           # API根视图
├── core/                  # 核心学生信息模块
│   ├── models.py          # 学生信息模型
│   ├── serializers.py     # API序列化器
│   ├── views.py           # API视图
│   ├── admin.py           # 后台管理
│   └── urls.py            # 路由配置
├── groups/                # 分组管理模块
│   ├── models.py          # 分组模型
│   ├── serializers.py     # API序列化器
│   ├── views.py           # API视图
│   ├── admin.py           # 后台管理
│   └── urls.py            # 路由配置
├── fixtures/              # 测试数据
│   └── sample_data.json   # 示例数据
├── manage.py              # Django管理脚本
└── requirements.txt       # Python依赖
```

## 数据模型

### 学生基础信息 (Student)
- 姓名、身份证号
- 性别（自动从身份证号计算）
- 住校情况、身高、体重
- 校服订购意愿
- 兴趣特长描述

### 分组信息 (GroupInfo)
- 通知书编号
- 分组名称、分组教师
- 教师联系方式、报到地点

### 学生分组分配 (StudentGroupAssignment)
- 学生与分组的关联关系
- 分配时间、状态、备注

## API端点

### 学生信息API
- `GET /api/students/` - 获取学生列表
- `POST /api/students/` - 创建学生信息
- `GET /api/students/{id}/` - 获取学生详情
- `PUT /api/students/{id}/` - 更新学生信息
- `DELETE /api/students/{id}/` - 删除学生信息
- `GET /api/students/statistics/` - 获取学生统计信息
- `POST /api/students/bulk_create/` - 批量创建学生
- `GET /api/students/{id}/groups/` - 获取学生分组信息

### 分组信息API
- `GET /api/groups/` - 获取分组列表
- `POST /api/groups/` - 创建分组
- `GET /api/groups/{id}/` - 获取分组详情
- `PUT /api/groups/{id}/` - 更新分组信息
- `DELETE /api/groups/{id}/` - 删除分组
- `GET /api/groups/{id}/students/` - 获取分组学生列表
- `GET /api/groups/statistics/` - 获取分组统计信息
- `POST /api/groups/{id}/assign_student/` - 分配学生到分组
- `DELETE /api/groups/{id}/remove_student/` - 从分组移除学生

### 分配管理API
- `GET /api/assignments/` - 获取分配记录列表
- `POST /api/assignments/` - 创建分配记录
- `POST /api/assignments/bulk_assign/` - 批量分配

## 快速开始

### 1. 环境配置
```bash
# 进入项目目录
cd /home/zzz/SIQCS/backend

# 激活虚拟环境
source ../.venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 数据库设置
```bash
# 应用数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 加载示例数据（可选）
python manage.py loaddata fixtures/sample_data.json
```

### 3. 启动服务器
```bash
python manage.py runserver
```

服务器启动后可访问：
- API根路径：http://127.0.0.1:8000/api/
- 后台管理：http://127.0.0.1:8000/admin/
- 学生API：http://127.0.0.1:8000/api/students/
- 分组API：http://127.0.0.1:8000/api/groups/

## 特性说明

### 智能数据处理
- 自动从身份证号计算性别和年龄
- 自动计算BMI指数
- 数据验证和格式检查

### 搜索和过滤
- 支持按姓名、身份证号搜索学生
- 支持按性别、住校情况等字段过滤
- 支持按分组、教师等字段过滤分组

### 统计分析
- 学生性别分布统计
- 住校情况统计
- 校服订购统计
- 身高体重平均值统计
- 分组学生数量统计

### 批量操作
- 支持批量创建学生信息
- 支持批量分配学生到分组

## 下一步计划

1. **前端开发**：使用React + Ant Design开发用户界面
2. **班级管理模块**：实现学生分班情况查询功能
3. **人脸识别模块**：实现学生人脸信息收集功能
4. **权限管理**：添加用户权限控制
5. **数据导入导出**：Excel文件导入导出功能
