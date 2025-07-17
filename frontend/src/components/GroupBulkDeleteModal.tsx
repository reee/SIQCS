import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, Alert, message, Divider, Typography, Transfer } from 'antd';
import { GroupService } from '../services/api';
import { GroupInfo } from '../types';

const { Option } = Select;
const { Text, Title } = Typography;

interface GroupBulkDeleteModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  // 不再接收选中的分组ID，只处理自定义选择和全部删除
}

interface TransferItem {
  key: string;
  title: string;
  description: string;
  disabled?: boolean;
}

const GroupBulkDeleteModal: React.FC<GroupBulkDeleteModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [deleteType, setDeleteType] = useState<'custom' | 'all'>('custom');
  const [transferTargetKeys, setTransferTargetKeys] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadGroups();
      // 默认选择自定义删除
      setDeleteType('custom');
    }
  }, [visible]);

  const loadGroups = async () => {
    try {
      const response = await GroupService.getGroups({ page_size: 1000 });
      setGroups(response.results);
    } catch (error) {
      console.error('获取分组列表失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let params: any = {};

      switch (deleteType) {
        case 'custom':
          if (transferTargetKeys.length === 0) {
            message.error('请选择要删除的分组');
            return;
          }
          params.group_ids = transferTargetKeys.map(key => parseInt(key));
          break;
        case 'all':
          if (!values.confirmDeleteAll) {
            message.error('请确认删除所有分组');
            return;
          }
          params.delete_all = true;
          break;
      }

      const result = await GroupService.bulkDeleteGroups(params);
      message.success(result.message);
      form.resetFields();
      setTransferTargetKeys([]);
      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error('删除失败:', error);
      message.error(error.response?.data?.error || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const getDeleteTypeOptions = () => {
    const options = [];
    
    options.push(
      <Option key="custom" value="custom">
        自定义选择分组
      </Option>
    );
    
    options.push(
      <Option key="all" value="all">
        删除所有分组
      </Option>
    );
    
    return options;
  };

  const getTransferData = (): TransferItem[] => {
    return groups.map(group => ({
      key: group.id.toString(),
      title: group.group_name,
      description: `${group.group_teacher} | ${group.student_count || 0}名学生`
    }));
  };

  const renderDeleteContent = () => {
    switch (deleteType) {
      case 'custom':
        return (
          <>
            <Alert
              message="请选择要删除的分组，将同时删除相关的学生分配记录"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Transfer
              dataSource={getTransferData()}
              titles={['可选分组', '要删除的分组']}
              targetKeys={transferTargetKeys}
              onChange={(targetKeys) => setTransferTargetKeys(targetKeys as string[])}
              render={item => item.title}
              listStyle={{
                width: 250,
                height: 300,
              }}
            />
          </>
        );
      
      case 'all':
        return (
          <>
            <Alert
              message="⚠️ 危险操作：将删除系统中的所有分组信息！"
              description="此操作将永久删除所有分组数据和学生分配记录，且无法恢复。请务必确认您了解此操作的后果。"
              type="error"
              showIcon
            />
            <Form.Item
              name="confirmDeleteAll"
              valuePropName="checked"
              rules={[
                { 
                  validator: (_, value) => 
                    value ? Promise.resolve() : Promise.reject('请确认删除所有分组')
                }
              ]}
            >
              <Checkbox>
                我确认删除所有分组信息和分配记录，并了解此操作不可恢复
              </Checkbox>
            </Form.Item>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
            批量删除分组
          </Title>
          <Text type="secondary">请谨慎操作，删除后无法恢复</Text>
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
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="删除方式"
          required
        >
          <Select
            value={deleteType}
            onChange={setDeleteType}
            placeholder="请选择删除方式"
          >
            {getDeleteTypeOptions()}
          </Select>
        </Form.Item>

        <Divider />

        {renderDeleteContent()}
      </Form>
    </Modal>
  );
};

export default GroupBulkDeleteModal;
