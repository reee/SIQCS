# 学生信息收集及查询系统 - 前端

这是一个基于React + TypeScript + Ant Design开发的学生信息管理系统前端应用。

## 功能特性

### 🎯 核心功能
- **学生信息管理**: 学生基础信息的增删改查
- **Excel导入**: 批量导入学生信息，支持错误检查和报告
- **学生资料完善**: 学生自助完善个人信息
- **数据统计**: 多维度统计分析和可视化展示
- **学生查询**: 公开查询页面，支持身份证号和通知书编号查询
- **分组管理**: 创建和管理学生分组，支持批量导入和分配
- **分组分配**: 灵活的学生分组分配和管理功能

### 📊 数据统计
- 学生总数、性别分布、住校情况统计
- 信息完整度、校服订购情况分析
- 身体指标统计（平均身高、体重）
- 分组统计（分组数量、教师数量、分配情况）
- 完成率和填写率的可视化展示

### 👥 分组功能
- **分组信息管理**: 创建、编辑、删除分组信息
- **学生分配**: 将学生分配到不同分组
- **分组查看**: 查看每个分组的学生列表
- **Excel导入**: 批量导入分组信息
- **模板下载**: 提供标准的导入模板

## 技术栈

- **框架**: React 19 + TypeScript
- **UI库**: Ant Design 5
- **路由**: React Router DOM 7
- **HTTP客户端**: Axios
- **构建工具**: Create React App
- **状态管理**: React Hooks

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```
访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── GroupFormModal.tsx        # 分组表单弹窗
│   ├── GroupStudentsModal.tsx    # 分组学生管理弹窗
│   ├── StudentDetailModal.tsx    # 学生详情弹窗
│   └── StudentFormModal.tsx      # 学生表单弹窗
├── pages/              # 页面组件
│   ├── Dashboard.tsx            # 数据统计页面
│   ├── GroupManagement.tsx     # 分组管理页面
│   ├── StudentList.tsx         # 学生列表页面
│   ├── StudentLookup.tsx       # 学生查询页面
│   └── StudentProfile.tsx      # 学生资料页面
├── services/           # API服务
│   └── api.ts                   # API接口定义
├── types/              # 类型定义
│   └── index.ts                 # 全局类型定义
├── App.tsx             # 主应用组件
└── index.tsx           # 应用入口
```

## 页面功能

### 数据统计 (`/dashboard`)
- 学生信息统计概览
- 性别、住校、信息完整度分布
- 分组统计信息
- 各类进度指标可视化

### 学生管理 (`/students`)
- 学生列表展示和分页
- 高级搜索和过滤
- 新增、编辑、删除学生
- Excel导入/导出功能

### 分组管理 (`/groups`)
- 分组列表管理
- 创建、编辑、删除分组
- 分组学生分配和管理
- Excel批量导入分组信息

### 学生查询 (`/lookup`)
- 公开查询页面
- 支持身份证号和通知书编号查询
- 独立布局，适合公开访问

### 学生资料 (`/students/:id/profile`)
- 学生个人信息完善
- 住校情况、身体指标录入
- 兴趣爱好和联系方式更新

## API集成

系统与Django后端API完全集成，支持：
- RESTful API调用
- 文件上传下载
- 错误处理和用户反馈
- 数据分页和过滤

## 部署说明

1. 构建生产版本：`npm run build`
2. 将`build`目录部署到Web服务器
3. 配置反向代理指向后端API（通常是Django服务器）

详细部署说明请参考项目根目录的`DEPLOYMENT_GUIDE.md`。

## 开发指南

### 添加新页面
1. 在`src/pages/`创建新组件
2. 在`src/App.tsx`添加路由配置
3. 如需菜单项，更新`menuItems`配置

### 添加新API
1. 在`src/types/index.ts`定义相关类型
2. 在`src/services/api.ts`添加API方法
3. 在组件中使用新API

### 样式定制
- 全局样式：`src/App.css`
- 组件样式：使用Ant Design的`style`属性
- 主题定制：修改Ant Design主题配置
