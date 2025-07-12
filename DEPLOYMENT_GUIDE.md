# 学生信息收集及查询系统 - 完整部署指南

## 系统概述

这是一个完整的学生信息管理系统，包含Django后端API和React前端界面。系统支持学生信息的导入、管理、查询和统计分析。

## 系统架构

```
SIQCS/
├── backend/          # Django后端
│   ├── core/         # 核心应用
│   ├── groups/       # 分组管理
│   ├── utils/        # 工具类
│   └── siqcs_backend/ # 项目配置
└── frontend/         # React前端
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── types/
    └── public/
```

## 功能模块

### 1. 后端功能 (Django)
- **学生信息管理API**
  - 学生CRUD操作
  - Excel批量导入
  - 资料完善接口
  - 统计数据API

- **数据模型**
  - 学生基础信息（姓名、身份证号）
  - 扩展信息（住校、身高体重、校服、兴趣特长）
  - 联系信息（手机、邮箱）
  - 状态管理（导入状态、完成度）

### 2. 前端功能 (React)
- **管理员界面**
  - 数据统计仪表板
  - 学生信息管理
  - Excel导入功能
  - 搜索和过滤

- **学生界面**
  - 身份查询验证
  - 个人资料完善
  - 进度实时显示

## 部署步骤

### 前置要求
- Python 3.8+
- Node.js 16+
- Django 4.2+
- React 18+

### 1. 后端部署

```bash
# 1. 进入后端目录
cd /home/zzz/SIQCS/backend

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 数据库迁移
python manage.py makemigrations
python manage.py migrate

# 5. 创建超级用户（可选）
python manage.py createsuperuser

# 6. 启动开发服务器
python manage.py runserver
```

后端服务将在 http://localhost:8000 启动

### 2. 前端部署

```bash
# 1. 进入前端目录
cd /home/zzz/SIQCS/frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm start
```

前端服务将在 http://localhost:3000 启动

### 3. 生产环境部署

#### 后端生产部署
```bash
# 1. 安装生产依赖
pip install gunicorn

# 2. 配置环境变量
export DJANGO_SETTINGS_MODULE=siqcs_backend.settings
export DEBUG=False

# 3. 收集静态文件
python manage.py collectstatic

# 4. 使用Gunicorn启动
gunicorn siqcs_backend.wsgi:application --bind 0.0.0.0:8000
```

#### 前端生产部署
```bash
# 1. 构建生产版本
npm run build

# 2. 部署到Web服务器
# 将build目录内容部署到Nginx/Apache等Web服务器
```

## 配置说明

### 后端配置
- **数据库**：默认使用SQLite，可在`settings.py`中配置MySQL/PostgreSQL
- **CORS**：已配置允许前端访问，可在`settings.py`中调整
- **文件上传**：支持Excel文件上传，大小限制可调整

### 前端配置
- **API地址**：在`src/services/api.ts`中配置后端地址
- **路由**：使用React Router进行页面路由管理
- **UI主题**：基于Ant Design，可通过ConfigProvider定制

## 使用指南

### 管理员操作流程

1. **系统初始化**
   - 访问 http://localhost:3000
   - 进入管理员界面

2. **学生数据导入**
   - 点击"下载模板"获取Excel模板
   - 填入学生基础信息（姓名、身份证号）
   - 上传Excel文件进行批量导入

3. **数据管理**
   - 在"学生管理"页面查看、编辑学生信息
   - 使用搜索和过滤功能快速定位
   - 查看"数据统计"了解整体情况

### 学生操作流程

1. **信息查询**
   - 访问 http://localhost:3000/lookup
   - 输入姓名和身份证号码进行身份验证

2. **资料完善**
   - 验证成功后点击"完善我的资料"
   - 依次填写住校情况、身高体重、校服订购、兴趣特长等信息
   - 选填联系方式（手机号、邮箱）

3. **提交保存**
   - 确认信息无误后点击"保存资料"
   - 系统会实时显示完成进度

## API接口文档

### 主要接口

| 方法 | 路径 | 功能 | 参数 |
|------|------|------|------|
| GET | /api/students/ | 获取学生列表 | page, page_size, filters |
| POST | /api/students/ | 创建学生 | 学生信息 |
| GET | /api/students/{id}/ | 获取学生详情 | id |
| PUT | /api/students/{id}/ | 更新学生信息 | id, 学生信息 |
| POST | /api/students/import_excel/ | Excel导入 | file, batch_name |
| GET | /api/students/download_template/ | 下载模板 | - |
| GET | /api/students/statistics/ | 获取统计数据 | - |
| POST | /api/students/{id}/complete_profile/ | 完善资料 | id, 资料信息 |

### 数据格式

#### 学生信息对象
```json
{
  "id": 1,
  "name": "张三",
  "id_card_number": "110101199001011234",
  "gender": "M",
  "gender_display": "男",
  "residence_status": "RESIDENT",
  "height": 175,
  "weight": 65,
  "uniform_purchase": true,
  "interests_talents": "篮球、编程",
  "phone_number": "13800138000",
  "email": "zhangsan@email.com",
  "info_status": "COMPLETE",
  "completion_percentage": 100,
  "age": 24,
  "bmi": 21.22,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 数据字典

### 性别选项
- M: 男
- F: 女

### 住校状态
- RESIDENT: 住校
- NON_RESIDENT: 不住校
- UNKNOWN: 未填写

### 信息状态
- IMPORTED: 已导入（仅有基础信息）
- PARTIAL: 部分完成（填写了部分扩展信息）
- COMPLETE: 信息完整（所有必填信息已填写）

## 注意事项

### 数据安全
- 身份证号码在前端显示时进行了脱敏处理
- 支持数据备份和恢复
- 建议定期备份数据库

### 性能优化
- 使用分页加载减少单次数据量
- 前端实现了虚拟滚动（如需要）
- 后端使用了数据库索引优化查询

### 扩展性
- 支持添加新的学生信息字段
- 可扩展分组管理功能
- 支持多角色权限管理

## 故障排除

### 常见问题

1. **后端启动失败**
   - 检查Python版本和依赖
   - 确认数据库连接正常
   - 查看错误日志

2. **前端无法连接后端**
   - 确认后端服务正常运行
   - 检查CORS配置
   - 验证API地址配置

3. **Excel导入失败**
   - 确认文件格式正确
   - 检查数据格式是否符合要求
   - 查看后端错误日志

4. **页面加载缓慢**
   - 检查网络连接
   - 优化数据查询
   - 考虑添加缓存

## 维护建议

1. **定期备份**
   - 每日备份数据库
   - 备份用户上传的文件

2. **性能监控**
   - 监控API响应时间
   - 观察数据库查询性能
   - 跟踪用户操作日志

3. **安全更新**
   - 定期更新依赖包
   - 检查安全漏洞
   - 更新系统补丁

## 联系支持

如有技术问题或功能建议，请通过以下方式联系：
- 系统管理员
- 技术支持团队
- 项目维护者

---

## 版本信息
- 系统版本：v1.0.0
- 最后更新：2024年
- 技术栈：Django 4.2 + React 18 + Ant Design 5
