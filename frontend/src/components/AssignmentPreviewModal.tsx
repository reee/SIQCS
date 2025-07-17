import React, { useState } from 'react';
import {
  Modal,
  Table,
  Button,
  Tag,
  Alert,
  Typography,
  Descriptions,
  Card,
  Row,
  Col,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PreviewRecord, PreviewResult } from '../types';

const { Title, Text } = Typography;

interface AssignmentPreviewModalProps {
  visible: boolean;
  previewData: PreviewResult | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({
  visible,
  previewData,
  loading,
  onCancel,
  onConfirm,
}) => {
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return <Tag icon={<CheckCircleOutlined />} color="success">可导入</Tag>;
      case 'warning':
        return <Tag icon={<ExclamationCircleOutlined />} color="warning">将跳过</Tag>;
      case 'error':
        return <Tag icon={<CloseCircleOutlined />} color="error">导入失败</Tag>;
      default:
        return <Tag icon={<InfoCircleOutlined />}>未知</Tag>;
    }
  };

  // 表格列定义
  const columns: ColumnsType<PreviewRecord> = [
    {
      title: '行号',
      dataIndex: 'row_number',
      key: 'row_number',
      width: 60,
      align: 'center',
    },
    {
      title: '通知书编号',
      dataIndex: 'notification_number',
      key: 'notification_number',
      width: 120,
    },
    {
      title: '学生姓名',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 100,
      render: (name) => name || <Text type="secondary">未找到</Text>,
    },
    {
      title: '分组名称',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 100,
      render: (remarks) => remarks || <Text type="secondary">无</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '说明',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message, record) => (
        <Text type={record.status === 'error' ? 'danger' : record.status === 'warning' ? 'warning' : 'secondary'}>
          {message}
        </Text>
      ),
    },
  ];

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      await onConfirm();
      message.success('导入完成！');
    } catch (error) {
      console.error('导入失败:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!previewData) {
    return null;
  }

  const { summary } = previewData;

  return (
    <Modal
      title="学生分组分配导入预览"
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={confirmLoading}
          onClick={handleConfirm}
          disabled={previewData.valid_count === 0}
        >
          确认导入 ({previewData.valid_count} 条记录)
        </Button>,
      ]}
      destroyOnClose
    >
      {/* 概要信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={5}>导入概要</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="总记录数">{previewData.total_rows}</Descriptions.Item>
              <Descriptions.Item label="可导入">{previewData.valid_count}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={6}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="警告">{previewData.warning_count}</Descriptions.Item>
              <Descriptions.Item label="错误">{previewData.error_count}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="新分配">{summary.new_assignments}</Descriptions.Item>
              <Descriptions.Item label="重复分配">{summary.duplicate_assignments}</Descriptions.Item>
              <Descriptions.Item label="冲突分配">{summary.conflicting_assignments}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* 提示信息 */}
      {previewData.error_count > 0 && (
        <Alert
          message="发现错误记录"
          description={`有 ${previewData.error_count} 条记录存在错误，无法导入。请检查Excel文件中的数据。`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {previewData.warning_count > 0 && (
        <Alert
          message="发现警告记录"
          description={`有 ${previewData.warning_count} 条记录将被跳过，通常是因为学生已分配到该分组或其他分组。`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {previewData.valid_count === 0 && (
        <Alert
          message="没有可导入的记录"
          description="Excel文件中没有可以导入的有效记录。请检查数据格式和内容。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 详细记录表格 */}
      <Table
        columns={columns}
        dataSource={previewData.records}
        rowKey={(record) => `${record.row_number}-${record.notification_number}`}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        scroll={{ x: 800 }}
        size="small"
      />
    </Modal>
  );
};

export default AssignmentPreviewModal;
