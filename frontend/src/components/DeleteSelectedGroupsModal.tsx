import React, { useState } from 'react';
import { Modal, Button, Alert, message, Typography, Tag } from 'antd';
import { GroupService } from '../services/api';
import { GroupInfo } from '../types';

const { Text, Title } = Typography;

interface DeleteSelectedGroupsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  selectedGroups: GroupInfo[];
}

const DeleteSelectedGroupsModal: React.FC<DeleteSelectedGroupsModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  selectedGroups
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const groupIds = selectedGroups.map(group => group.id);
      const result = await GroupService.bulkDeleteGroups({
        group_ids: groupIds
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
            删除选中的分组
          </Title>
          <Text type="secondary">确认删除以下 {selectedGroups.length} 个分组及其分配记录</Text>
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
        message={`将删除 ${selectedGroups.length} 个选中的分组及其所有学生分配记录`}
        description="此操作不可恢复，请确认您要删除这些分组信息。"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <Text strong>选中的分组：</Text>
        <div style={{ marginTop: 8 }}>
          {selectedGroups.map(group => (
            <Tag 
              key={group.id} 
              color="orange" 
              style={{ marginBottom: 4, display: 'inline-block', marginRight: 8 }}
            >
              {group.group_name} ({group.group_teacher})
            </Tag>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteSelectedGroupsModal;
