import React, { useState } from 'react';
import { Modal, Button, Alert, message, Typography, Tag } from 'antd';
import { StudentService } from '../services/api';
import { StudentListItem } from '../types';

const { Text, Title } = Typography;

interface DeleteSelectedStudentsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  selectedStudents: StudentListItem[];
}

const DeleteSelectedStudentsModal: React.FC<DeleteSelectedStudentsModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  selectedStudents
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const studentIds = selectedStudents.map(student => student.id);
      const result = await StudentService.bulkDeleteStudents({
        student_ids: studentIds
      });

      message.success(result.message);
      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error('删除失败:', error);
      message.error(error.response?.data?.error || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
            删除选中的学生
          </Title>
          <Text type="secondary">确认删除以下 {selectedStudents.length} 名学生</Text>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={loading}
          onClick={handleSubmit}
        >
          确认删除
        </Button>
      ]}
      width={600}
    >
      <Alert
        message={`将删除 ${selectedStudents.length} 名选中的学生及其相关数据`}
        description="此操作不可恢复，请确认您要删除这些学生信息。"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <Text strong>选中的学生：</Text>
        <div style={{ marginTop: 8 }}>
          {selectedStudents.map(student => (
            <Tag 
              key={student.id} 
              color="orange" 
              style={{ marginBottom: 4, display: 'inline-block', marginRight: 8 }}
            >
              {student.name} ({student.notification_number})
            </Tag>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteSelectedStudentsModal;
