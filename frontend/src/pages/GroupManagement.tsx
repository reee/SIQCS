import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  message,
  Row,
  Col,
  Modal,
  Form,
  Upload,
  Typography,
  Statistic,
  Divider,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { GroupInfo, GroupFilters, GroupStatistics } from '../types';
import { GroupService } from '../services/api';
import GroupFormModal from '../components/GroupFormModal';
import GroupStudentsModal from '../components/GroupStudentsModal';

const { Search } = Input;
const { Title } = Typography;

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<GroupFilters>({});
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
  
  // Modal states
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [studentsModalVisible, setStudentsModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupInfo | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  const [form] = Form.useForm();

  // 加载分组列表
  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GroupService.getGroups({
        page: currentPage,
        page_size: pageSize,
        filters,
        ordering: 'group_name',
      });
      setGroups(response.results);
      setTotal(response.count);
    } catch (error) {
      message.error('加载分组列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await GroupService.getGroupStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  // 处理分组过滤器变化
  const handleFilterChange = (key: keyof GroupFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  // 新建分组
  const handleCreate = () => {
    setEditingGroup(null);
    setFormModalVisible(true);
  };

  // 编辑分组
  const handleEdit = (group: GroupInfo) => {
    setEditingGroup(group);
    setFormModalVisible(true);
  };

  // 删除分组
  const handleDelete = async (id: number) => {
    try {
      await GroupService.deleteGroup(id);
      message.success('删除成功');
      loadGroups();
      loadStatistics();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 查看分组学生
  const handleViewStudents = (groupId: number) => {
    setSelectedGroupId(groupId);
    setStudentsModalVisible(true);
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (editingGroup) {
        await GroupService.updateGroup(editingGroup.id, values);
        message.success('更新成功');
      } else {
        await GroupService.createGroup(values);
        message.success('创建成功');
      }
      setFormModalVisible(false);
      loadGroups();
      loadStatistics();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const blob = await GroupService.downloadGroupTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '分组信息导入模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('下载模板失败');
      console.error(error);
    }
  };

  // 导入Excel
  const handleImportExcel = async (file: File) => {
    setImporting(true);
    try {
      const result = await GroupService.importGroupsExcel(file);
      if (result.success) {
        message.success(`导入成功: ${result.successful_imports} 条记录`);
        if (result.failed_imports && result.failed_imports > 0) {
          message.warning(`${result.failed_imports} 条记录导入失败`);
        }
        setImportModalVisible(false);
        loadGroups();
        loadStatistics();
      } else {
        message.error(result.message || '导入失败');
      }
    } catch (error) {
      message.error('导入失败');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<GroupInfo> = [
    {
      title: '分组名称',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 150,
    },
    {
      title: '分组教师',
      dataIndex: 'group_teacher',
      key: 'group_teacher',
      width: 100,
    },
    {
      title: '联系方式',
      dataIndex: 'teacher_phone',
      key: 'teacher_phone',
      width: 120,
    },
    {
      title: '报到地点',
      dataIndex: 'report_location',
      key: 'report_location',
      ellipsis: true,
    },
    {
      title: '学生人数',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count} 人
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看学生">
            <Button
              type="link"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => handleViewStudents(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个分组吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>分组管理</Title>

      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="分组总数"
                value={statistics.total_groups}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="教师人数"
                value={statistics.total_teachers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已分配学生"
                value={statistics.total_assigned_students}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均分组人数"
                value={statistics.total_groups > 0 ? Math.round(statistics.total_assigned_students / statistics.total_groups) : 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {/* 操作栏 */}
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Search
                placeholder="搜索分组信息"
                allowClear
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
              <Input
                placeholder="按分组名称过滤"
                allowClear
                value={filters.group_name}
                onChange={(e) => handleFilterChange('group_name', e.target.value)}
                style={{ width: 150 }}
              />
              <Input
                placeholder="按教师姓名过滤"
                allowClear
                value={filters.group_teacher}
                onChange={(e) => handleFilterChange('group_teacher', e.target.value)}
                style={{ width: 150 }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                新建分组
              </Button>
              <Button
                icon={<ImportOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                导入Excel
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
              >
                下载模板
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadGroups();
                  loadStatistics();
                }}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 分组表格 */}
        <Table
          columns={columns}
          dataSource={groups}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
        />
      </Card>

      {/* 分组表单弹窗 */}
      <GroupFormModal
        visible={formModalVisible}
        group={editingGroup}
        onCancel={() => setFormModalVisible(false)}
        onSubmit={handleFormSubmit}
      />

      {/* 分组学生弹窗 */}
      <GroupStudentsModal
        visible={studentsModalVisible}
        groupId={selectedGroupId}
        onCancel={() => setStudentsModalVisible(false)}
        onStudentChange={() => {
          loadGroups();
          loadStatistics();
        }}
      />

      {/* 导入Excel弹窗 */}
      <Modal
        title="导入分组信息"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="file"
            label="选择Excel文件"
            rules={[{ required: true, message: '请选择要导入的Excel文件' }]}
          >
            <Upload
              beforeUpload={(file) => {
                if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                  message.error('只支持Excel文件格式');
                  return false;
                }
                handleImportExcel(file);
                return false;
              }}
              showUploadList={false}
              disabled={importing}
            >
              <Button
                icon={<ImportOutlined />}
                loading={importing}
                block
              >
                {importing ? '导入中...' : '选择文件并导入'}
              </Button>
            </Upload>
          </Form.Item>
          <Divider />
          <p style={{ color: '#666' }}>
            支持的文件格式：.xlsx, .xls<br />
            请先下载模板，按照模板格式填写数据后导入。
          </p>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupManagement;
