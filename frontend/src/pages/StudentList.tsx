import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Progress,
  message,
  Row,
  Col,
  Modal,
  Form,
  Upload,
  Typography,
  Divider,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { StudentListItem, StudentFilters } from '../types';
import { StudentService } from '../services/api';
import StudentDetailModal from '../components/StudentDetailModal';
import StudentFormModal from '../components/StudentFormModal';
import StudentBulkDeleteModal from '../components/StudentBulkDeleteModal';
import DeleteSelectedStudentsModal from '../components/DeleteSelectedStudentsModal';

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<StudentFilters>({});
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
  const [deleteSelectedModalVisible, setDeleteSelectedModalVisible] = useState(false);

  const [form] = Form.useForm();

  // 加载学生列表
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await StudentService.getStudents({
        page: currentPage,
        page_size: pageSize,
        filters,
        ordering: '-created_at',
      });
      setStudents(response.results);
      setTotal(response.count);
    } catch (error) {
      message.error('加载学生列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    document.title = '学生管理';
    loadStudents();
  }, [loadStudents]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  // 处理过滤器变化
  const handleFilterChange = (key: keyof StudentFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  // 清空过滤器
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // 查看详情
  const handleViewDetail = (student: StudentListItem) => {
    setSelectedStudentId(student.id);
    setDetailModalVisible(true);
  };

  // 编辑学生
  const handleEdit = (student: StudentListItem) => {
    setEditingStudent(student);
    setFormModalVisible(true);
  };

  // 新增学生
  const handleAdd = () => {
    setEditingStudent(null);
    setFormModalVisible(true);
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const blob = await StudentService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '学生信息导入模板.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('模板下载成功');
    } catch (error) {
      message.error('模板下载失败');
      console.error(error);
    }
  };

  // 处理Excel导入
  const handleImport = async (values: { file: any; batch_name?: string }) => {
    if (!values.file?.file) {
      message.error('请选择要导入的文件');
      return;
    }

    setImporting(true);
    try {
      const result = await StudentService.importFromExcel(
        values.file.file,
        values.batch_name
      );
      
      message.success(`导入成功！${result.message}`);
      setImportModalVisible(false);
      form.resetFields();
      loadStudents();
    } catch (error: any) {
      message.error(`导入失败：${error.response?.data?.error || error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // 删除单个学生
  const handleDelete = async (studentId: number) => {
    try {
      await StudentService.deleteStudent(studentId);
      message.success('删除成功');
      loadStudents();
      // 如果删除的是当前选中的学生，清空选择
      setSelectedRowKeys(prev => prev.filter(key => key !== studentId));
    } catch (error: any) {
      message.error(`删除失败：${error.response?.data?.error || error.message}`);
    }
  };

  // 批量删除成功后的回调
  const handleBulkDeleteSuccess = () => {
    setSelectedRowKeys([]);
    loadStudents();
  };

  // 获取选中的学生信息
  const getSelectedStudents = () => {
    return students.filter(student => selectedRowKeys.includes(student.id));
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    preserveSelectedRowKeys: true,
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'IMPORTED':
        return 'default';
      default:
        return 'default';
    }
  };

  // 表格列定义
  const columns: ColumnsType<StudentListItem> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
    },
    {
      title: '通知书编号',
      dataIndex: 'notification_number',
      key: 'notification_number',
      width: 120,
    },
    {
      title: '身份证号',
      dataIndex: 'id_card_number',
      key: 'id_card_number',
      width: 180,
      render: (text) => text.replace(/^(.{6}).*(.{4})$/, '$1****$2'),
    },
    {
      title: '性别',
      dataIndex: 'gender_display',
      key: 'gender_display',
      width: 80,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (age) => age ? `${age}岁` : '-',
    },
    {
      title: '住校情况',
      dataIndex: 'residence_status_display',
      key: 'residence_status_display',
      width: 100,
    },
    {
      title: '校服订购',
      dataIndex: 'uniform_purchase',
      key: 'uniform_purchase',
      width: 100,
      render: (value) => {
        if (value === true) return <Tag color="green">已订购</Tag>;
        if (value === false) return <Tag color="red">未订购</Tag>;
        return <Tag>未填写</Tag>;
      },
    },
    {
      title: '信息状态',
      dataIndex: 'info_status',
      key: 'info_status',
      width: 120,
      render: (status, record) => (
        <Tag color={getStatusColor(status)}>
          {record.info_status_display}
        </Tag>
      ),
    },
    {
      title: '完成度',
      dataIndex: 'completion_percentage',
      key: 'completion_percentage',
      width: 120,
      render: (percentage) => (
        <Progress
          percent={percentage}
          size="small"
          status={percentage === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '导入批次',
      dataIndex: 'import_batch',
      key: 'import_batch',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这名学生吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
            okType="danger"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>学生信息管理</Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                新增学生
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
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteSelectedModalVisible(true)}
                disabled={selectedRowKeys.length === 0}
              >
                删除选中 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
              </Button>
              <Button
                danger
                onClick={() => setBulkDeleteModalVisible(true)}
              >
                批量删除
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadStudents}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* 搜索和过滤器 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Search
              placeholder="搜索学生姓名、身份证号..."
              onSearch={handleSearch}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="性别"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('gender', value)}
              value={filters.gender}
            >
              <Option value="M">男</Option>
              <Option value="F">女</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="住校情况"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('residence_status', value)}
              value={filters.residence_status}
            >
              <Option value="RESIDENT">住校</Option>
              <Option value="NON_RESIDENT">不住校</Option>
              <Option value="UNKNOWN">未填写</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="信息状态"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('info_status', value)}
              value={filters.info_status}
            >
              <Option value="IMPORTED">已导入</Option>
              <Option value="PARTIAL">部分完成</Option>
              <Option value="COMPLETE">信息完整</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="校服订购"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('uniform_purchase', value)}
              value={filters.uniform_purchase}
            >
              <Option value={true}>已订购</Option>
              <Option value={false}>未订购</Option>
            </Select>
          </Col>
          <Col span={2}>
            <Button onClick={clearFilters}>清空</Button>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: setCurrentPage,
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
        />
      </Card>

      {/* 学生详情弹窗 */}
      <StudentDetailModal
        visible={detailModalVisible}
        studentId={selectedStudentId}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedStudentId(null);
        }}
        onEdit={(student) => {
          setEditingStudent(student);
          setFormModalVisible(true);
        }}
      />

      {/* 学生表单弹窗 */}
      <StudentFormModal
        visible={formModalVisible}
        student={editingStudent}
        onClose={() => {
          setFormModalVisible(false);
          setEditingStudent(null);
        }}
        onSuccess={() => {
          loadStudents();
          setFormModalVisible(false);
          setEditingStudent(null);
        }}
      />

      {/* Excel导入弹窗 */}
      <Modal
        title="导入学生信息"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleImport}
        >
          <Form.Item
            name="batch_name"
            label="导入批次名称"
            rules={[{ required: true, message: '请输入导入批次名称' }]}
          >
            <Input placeholder="例如：2024年秋季新生" />
          </Form.Item>
          
          <Form.Item
            name="file"
            label="选择Excel文件"
            rules={[{ required: true, message: '请选择要导入的Excel文件' }]}
          >
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<ImportOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={importing}
              >
                开始导入
              </Button>
              <Button onClick={() => setImportModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量删除模态框 */}
      <StudentBulkDeleteModal
        visible={bulkDeleteModalVisible}
        onCancel={() => setBulkDeleteModalVisible(false)}
        onSuccess={handleBulkDeleteSuccess}
      />

      {/* 删除选中学生模态框 */}
      <DeleteSelectedStudentsModal
        visible={deleteSelectedModalVisible}
        onCancel={() => setDeleteSelectedModalVisible(false)}
        onSuccess={handleBulkDeleteSuccess}
        selectedStudents={getSelectedStudents()}
      />
    </div>
  );
};

export default StudentList;
