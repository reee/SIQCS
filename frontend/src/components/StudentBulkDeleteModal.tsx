import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, Alert, message, Divider, Typography, Tag } from 'antd';
import { StudentService } from '../services/api';
import { ImportBatch } from '../types';

const { Option } = Select;
const { Text, Title } = Typography;

interface StudentBulkDeleteModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  // 不再接收选中的学生ID，只处理批次删除和全部删除
}

const StudentBulkDeleteModal: React.FC<StudentBulkDeleteModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [deleteType, setDeleteType] = useState<'batch' | 'all'>('batch');

  useEffect(() => {
    if (visible) {
      loadBatches();
      // 默认选择按批次删除
      setDeleteType('batch');
    }
  }, [visible]);

  const loadBatches = async () => {
    try {
      const response = await StudentService.getImportBatches();
      setBatches(response.batches);
    } catch (error) {
      console.error('获取批次列表失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let params: any = {};

      switch (deleteType) {
        case 'batch':
          if (!values.import_batch) {
            message.error('请选择要删除的批次');
            return;
          }
          params.import_batch = values.import_batch;
          break;
        case 'all':
          if (!values.confirmDeleteAll) {
            message.error('请确认删除所有学生');
            return;
          }
          params.delete_all = true;
          break;
      }

      const result = await StudentService.bulkDeleteStudents(params);
      message.success(result.message);
      form.resetFields();
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
      <Option key="batch" value="batch">
        按批次删除
      </Option>
    );
    
    options.push(
      <Option key="all" value="all">
        删除所有学生
      </Option>
    );
    
    return options;
  };

  const renderDeleteContent = () => {
    switch (deleteType) {
      case 'batch':
        return (
          <>
            <Form.Item
              name="import_batch"
              label="选择批次"
              rules={[{ required: true, message: '请选择要删除的批次' }]}
            >
              <Select placeholder="请选择要删除的批次">
                {batches.map(batch => (
                  <Option key={batch.batch_name} value={batch.batch_name}>
                    {batch.batch_name} 
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {batch.student_count}名学生
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Alert
              message="将删除选中批次中的所有学生，此操作不可恢复"
              type="warning"
              showIcon
            />
          </>
        );
      
      case 'all':
        return (
          <>
            <Alert
              message="⚠️ 危险操作：将删除系统中的所有学生信息！"
              description="此操作将永久删除所有学生数据，包括分组分配信息，且无法恢复。请务必确认您了解此操作的后果。"
              type="error"
              showIcon
            />
            <Form.Item
              name="confirmDeleteAll"
              valuePropName="checked"
              rules={[
                { 
                  validator: (_, value) => 
                    value ? Promise.resolve() : Promise.reject('请确认删除所有学生')
                }
              ]}
            >
              <Checkbox>
                我确认删除所有学生信息，并了解此操作不可恢复
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
            批量删除学生
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
      width={600}
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

export default StudentBulkDeleteModal;
