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
import { GroupInfo, GroupFilters, GroupStatistics, PreviewResult } from '../types';
import { GroupService } from '../services/api';
import GroupFormModal from '../components/GroupFormModal';
import GroupStudentsModal from '../components/GroupStudentsModal';
import AssignmentPreviewModal from '../components/AssignmentPreviewModal';
import GroupBulkDeleteModal from '../components/GroupBulkDeleteModal';
import DeleteSelectedGroupsModal from '../components/DeleteSelectedGroupsModal';

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
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
  const [deleteSelectedModalVisible, setDeleteSelectedModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupInfo | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
    document.title = '分组管理';
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
      // 如果删除的是当前选中的分组，清空选择
      setSelectedRowKeys(prev => prev.filter(key => key !== id));
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 批量删除成功后的回调
  const handleBulkDeleteSuccess = () => {
    setSelectedRowKeys([]);
    loadGroups();
    loadStatistics();
  };

  // 获取选中的分组信息
  const getSelectedGroups = () => {
    return groups.filter(group => selectedRowKeys.includes(group.id));
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    preserveSelectedRowKeys: true,
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

  // 下载学生分组分配模板
  const handleDownloadAssignmentTemplate = async () => {
    try {
      const blob = await GroupService.downloadAssignmentTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '学生分组分配导入模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('下载模板失败');
      console.error(error);
    }
  };

  // 处理Excel文件上传，先预览
  const handleImportAssignments = async (file: File) => {
    setPreviewLoading(true);
    setUploadedFile(file);
    
    try {
      const result = await GroupService.previewAssignmentsExcel(file);
      
      if (result.success) {
        setPreviewData(result);
        setPreviewModalVisible(true);
      } else {
        Modal.error({
          title: '文件预览失败',
          content: (
            <div>
              <p><strong>错误原因：</strong>{result.error}</p>
              <p>请检查Excel文件格式和内容是否正确。</p>
            </div>
          ),
          width: 600,
        });
      }
    } catch (error: any) {
      console.error('预览失败:', error);
      Modal.error({
        title: '预览失败',
        content: (
          <div>
            <p>请检查以下项目：</p>
            <ul>
              <li>Excel文件格式是否正确（.xlsx 或 .xls）</li>
              <li>文件是否包含必需的列（通知书编号、分组名称）</li>
              <li>网络连接是否正常</li>
            </ul>
            <p><strong>技术错误：</strong>{error.response?.data?.error || error.message}</p>
          </div>
        ),
        width: 600,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!uploadedFile) {
      message.error('没有找到上传的文件');
      return;
    }

    setImporting(true);
    try {
      const result = await GroupService.importAssignmentsExcel(uploadedFile);
      
      if (result.success) {
        message.success(result.message || `导入完成: 成功 ${result.success_count} 条记录`);
        
        // 显示警告信息（如跳过的记录）
        if (result.warnings && result.warnings.length > 0) {
          Modal.info({
            title: '导入提醒',
            content: (
              <div>
                <p>以下是导入过程中的提醒信息：</p>
                <ul style={{ maxHeight: 300, overflow: 'auto' }}>
                  {result.warnings.map((warning: string, index: number) => (
                    <li key={index} style={{ marginBottom: 4 }}>{warning}</li>
                  ))}
                </ul>
              </div>
            ),
            width: 600,
          });
        }
        
        // 显示错误信息
        if (result.errors && result.errors.length > 0) {
          Modal.error({
            title: `导入错误 (${result.errors.length} 条)`,
            content: (
              <div>
                <p>以下记录导入失败，请检查数据格式：</p>
                <ul style={{ maxHeight: 300, overflow: 'auto' }}>
                  {result.errors.map((error: string, index: number) => (
                    <li key={index} style={{ marginBottom: 4, color: '#ff4d4f' }}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
            width: 700,
          });
        }
        
        setPreviewModalVisible(false);
        setPreviewData(null);
        setUploadedFile(null);
        loadGroups();
        loadStatistics();
      } else {
        Modal.error({
          title: '导入失败',
          content: (
            <div>
              <p><strong>错误原因：</strong>{result.error}</p>
              {result.errors && result.errors.length > 0 && (
                <div>
                  <p><strong>详细错误：</strong></p>
                  <ul style={{ maxHeight: 200, overflow: 'auto' }}>
                    {result.errors.map((error: string, index: number) => (
                      <li key={index} style={{ marginBottom: 4 }}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
          width: 600,
        });
      }
    } catch (error: any) {
      console.error('导入失败:', error);
      Modal.error({
        title: '导入失败',
        content: (
          <div>
            <p>导入过程中发生错误，请重试或联系管理员。</p>
            <p><strong>技术错误：</strong>{error.response?.data?.error || error.message}</p>
          </div>
        ),
        width: 600,
      });
    } finally {
      setImporting(false);
    }
  };

  // 取消预览
  const handleCancelPreview = () => {
    setPreviewModalVisible(false);
    setPreviewData(null);
    setUploadedFile(null);
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
          rowSelection={rowSelection}
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
        title="导入Excel"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Row gutter={[16, 16]}>
          {/* 导入分组信息 */}
          <Col span={12}>
            <Card title="导入分组信息" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  block
                >
                  下载分组信息模板
                </Button>
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
                    type="primary"
                  >
                    {importing ? '导入中...' : '导入分组信息'}
                  </Button>
                </Upload>
              </Space>
            </Card>
          </Col>

          {/* 导入学生分组分配 */}
          <Col span={12}>
            <Card title="导入学生分组分配" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadAssignmentTemplate}
                  block
                >
                  下载分配关系模板
                </Button>
                <Upload
                  beforeUpload={(file) => {
                    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                      message.error('只支持Excel文件格式');
                      return false;
                    }
                    handleImportAssignments(file);
                    return false;
                  }}
                  showUploadList={false}
                  disabled={previewLoading || importing}
                >
                  <Button
                    icon={<ImportOutlined />}
                    loading={previewLoading || importing}
                    block
                    type="primary"
                  >
                    {previewLoading ? '预览中...' : importing ? '导入中...' : '导入分配关系'}
                  </Button>
                </Upload>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />
        
        <div style={{ color: '#666', fontSize: '12px' }}>
          <p><strong>分组信息导入说明：</strong></p>
          <ul>
            <li>用于导入分组基础信息（分组名称、教师、联系方式、报到地点等）</li>
            <li>支持的文件格式：.xlsx, .xls</li>
          </ul>
          
          <p><strong>学生分组分配导入说明：</strong></p>
          <ul>
            <li>用于导入学生与分组的对应关系</li>
            <li>请确保学生和分组信息已存在于系统中</li>
            <li>通过学生通知书编号和分组名称进行匹配</li>
          </ul>
        </div>
      </Modal>

      {/* 分配预览模态框 */}
      <AssignmentPreviewModal
        visible={previewModalVisible}
        previewData={previewData}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelPreview}
        loading={importing}
      />

      {/* 批量删除模态框 */}
      <GroupBulkDeleteModal
        visible={bulkDeleteModalVisible}
        onCancel={() => setBulkDeleteModalVisible(false)}
        onSuccess={handleBulkDeleteSuccess}
      />

      {/* 删除选中分组模态框 */}
      <DeleteSelectedGroupsModal
        visible={deleteSelectedModalVisible}
        onCancel={() => setDeleteSelectedModalVisible(false)}
        onSuccess={handleBulkDeleteSuccess}
        selectedGroups={getSelectedGroups()}
      />
    </div>
  );
};

export default GroupManagement;
