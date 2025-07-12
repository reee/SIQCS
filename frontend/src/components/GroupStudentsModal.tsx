import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Tag,
  message,
  Popconfirm,
  Select,
  Typography,
  Row,
  Col,
  Divider,
  Card,
} from 'antd';
import {
  UserAddOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { GroupStudentList, StudentListItem } from '../types';
import { GroupService, StudentService } from '../services/api';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface GroupStudentsModalProps {
  visible: boolean;
  groupId: number | null;
  onCancel: () => void;
  onStudentChange: () => void;
}

const GroupStudentsModal: React.FC<GroupStudentsModalProps> = ({
  visible,
  groupId,
  onCancel,
  onStudentChange,
}) => {
  const [groupData, setGroupData] = useState<GroupStudentList | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');

  // 加载分组学生数据
  const loadGroupData = useCallback(async () => {
    if (!groupId || !visible) return;
    
    setLoading(true);
    try {
      const data = await GroupService.getGroupStudents(groupId);
      setGroupData(data);
    } catch (error) {
      message.error('加载分组学生数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [groupId, visible]);

  // 搜索可分配的学生
  const searchAvailableStudents = async (searchText: string) => {
    if (!searchText.trim()) {
      setAvailableStudents([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await StudentService.getStudents({
        page: 1,
        page_size: 50,
        filters: { search: searchText },
      });
      setAvailableStudents(response.results);
    } catch (error) {
      message.error('搜索学生失败');
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  // 分配学生到分组
  const handleAssignStudent = async () => {
    if (!groupId || !selectedStudentId) {
      message.error('请选择要分配的学生');
      return;
    }

    setAddingStudent(true);
    try {
      await GroupService.assignStudent(groupId, selectedStudentId, remarks);
      message.success('学生分配成功');
      setSelectedStudentId(null);
      setRemarks('');
      setAvailableStudents([]);
      loadGroupData();
      onStudentChange();
    } catch (error: any) {
      message.error(error?.response?.data?.error || '分配失败');
      console.error(error);
    } finally {
      setAddingStudent(false);
    }
  };

  // 从分组中移除学生
  const handleRemoveStudent = async (studentId: number) => {
    if (!groupId) return;

    try {
      await GroupService.removeStudent(groupId, studentId);
      message.success('学生已从分组中移除');
      loadGroupData();
      onStudentChange();
    } catch (error: any) {
      message.error(error?.response?.data?.error || '移除失败');
      console.error(error);
    }
  };

  // 学生表格列定义
  const columns: ColumnsType<any> = [
    {
      title: '姓名',
      dataIndex: ['student', 'name'],
      key: 'name',
      width: 100,
    },
    {
      title: '身份证号',
      dataIndex: ['student', 'id_card_number'],
      key: 'id_card_number',
      width: 180,
      render: (text) => (
        <Text copyable>{text}</Text>
      ),
    },
    {
      title: '性别',
      dataIndex: ['student', 'gender_display'],
      key: 'gender',
      width: 80,
    },
    {
      title: '住校情况',
      dataIndex: ['student', 'residence_status_display'],
      key: 'residence_status',
      width: 100,
      render: (text, record) => {
        const status = record.student.residence_status;
        const color = status === 'RESIDENT' ? 'green' : 
                     status === 'NON_RESIDENT' ? 'orange' : 'default';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '信息状态',
      dataIndex: ['student', 'info_status_display'],
      key: 'info_status',
      width: 100,
      render: (text, record) => {
        const status = record.student.info_status;
        const color = status === 'COMPLETE' ? 'success' : 
                     status === 'PARTIAL' ? 'warning' : 'default';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '分配时间',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      width: 150,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="确定要将该学生从分组中移除吗？"
          onConfirm={() => handleRemoveStudent(record.student.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={groupData ? `分组学生管理 - ${groupData.group_name}` : '分组学生管理'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
      destroyOnClose
    >
      {groupData && (
        <>
          {/* 分组信息 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Text strong>分组教师:</Text> {groupData.group_teacher}
              </Col>
              <Col span={8}>
                <Text strong>联系方式:</Text> {groupData.teacher_phone}
              </Col>
              <Col span={8}>
                <Text strong>学生人数:</Text> {groupData.students.length} 人
              </Col>
              <Col span={24}>
                <Text strong>报到地点:</Text> {groupData.report_location}
              </Col>
            </Row>
          </Card>

          {/* 添加学生 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[8, 8]} align="middle">
              <Col span={8}>
                <Search
                  placeholder="搜索学生 (姓名/身份证号)"
                  loading={searchLoading}
                  onSearch={searchAvailableStudents}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="选择学生"
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  loading={searchLoading}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {availableStudents.map(student => (
                    <Option key={student.id} value={student.id}>
                      {student.name} - {student.id_card_number}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Input
                  placeholder="备注信息"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Col>
              <Col span={4}>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleAssignStudent}
                  loading={addingStudent}
                  disabled={!selectedStudentId}
                  block
                >
                  分配
                </Button>
              </Col>
            </Row>
          </Card>

          <Divider style={{ margin: '16px 0' }} />

          {/* 学生列表 */}
          <Table
            columns={columns}
            dataSource={groupData.students}
            rowKey="assignment_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            scroll={{ x: 1000 }}
          />
        </>
      )}
    </Modal>
  );
};

export default GroupStudentsModal;
