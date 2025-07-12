import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Spin,
  Button,
  Space,
  Card,
  Progress,
  message,
} from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { Student } from '../types';
import { StudentService } from '../services/api';

interface StudentDetailModalProps {
  visible: boolean;
  studentId: number | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  visible,
  studentId,
  onClose,
  onEdit,
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载学生详情
  const loadStudentDetail = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const data = await StudentService.getStudent(studentId);
      setStudent(data);
    } catch (error) {
      message.error('加载学生详情失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (visible && studentId) {
      loadStudentDetail();
    }
  }, [visible, studentId, loadStudentDetail]);

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

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const handleEdit = () => {
    if (student) {
      onEdit(student);
      onClose();
    }
  };

  return (
    <Modal
      title="学生详细信息"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={handleEdit}>
          编辑
        </Button>,
        <Button key="refresh" icon={<ReloadOutlined />} onClick={loadStudentDetail}>
          刷新
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {student && (
          <div>
            {/* 基础信息卡片 */}
            <Card title="基础信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="姓名">{student.name}</Descriptions.Item>
                <Descriptions.Item label="通知书编号">
                  {student.notification_number}
                </Descriptions.Item>
                <Descriptions.Item label="身份证号">
                  {student.id_card_number}
                </Descriptions.Item>
                <Descriptions.Item label="性别">{student.gender_display}</Descriptions.Item>
                <Descriptions.Item label="年龄">
                  {student.age ? `${student.age}岁` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="信息状态" span={2}>
                  <Space>
                    <Tag color={getStatusColor(student.info_status)}>
                      {student.info_status_display}
                    </Tag>
                    <Progress
                      percent={student.completion_percentage}
                      size="small"
                      style={{ width: 200 }}
                    />
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 扩展信息卡片 */}
            <Card title="扩展信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="住校情况">
                  {student.residence_status_display}
                </Descriptions.Item>
                <Descriptions.Item label="校服订购">
                  {student.uniform_purchase === true ? (
                    <Tag color="green">已订购</Tag>
                  ) : student.uniform_purchase === false ? (
                    <Tag color="red">未订购</Tag>
                  ) : (
                    <Tag>未填写</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="身高">
                  {student.height ? `${student.height}cm` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="体重">
                  {student.weight ? `${student.weight}kg` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="BMI指数">
                  {student.bmi ? student.bmi : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="兴趣特长" span={2}>
                  {student.interests_talents || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 联系信息卡片 */}
            <Card title="联系信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="手机号码">
                  {student.phone_number || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱地址">
                  {student.email || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 系统信息卡片 */}
            <Card title="系统信息">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="导入批次">
                  {student.import_batch || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="导入行号">
                  {student.import_row_number || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {formatDate(student.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {formatDate(student.updated_at)}
                </Descriptions.Item>
                <Descriptions.Item label="资料完成时间" span={2}>
                  {formatDate(student.profile_completed_at)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default StudentDetailModal;
