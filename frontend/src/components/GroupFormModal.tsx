import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
} from 'antd';
import { GroupInfo } from '../types';

const { TextArea } = Input;

interface GroupFormModalProps {
  visible: boolean;
  group: GroupInfo | null;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  visible,
  group,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible) {
      if (group) {
        // 编辑模式，填充表单数据
        form.setFieldsValue({
          group_name: group.group_name,
          group_teacher: group.group_teacher,
          teacher_phone: group.teacher_phone,
          report_location: group.report_location,
        });
      } else {
        // 新建模式，清空表单
        form.resetFields();
      }
    }
  }, [visible, group, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      form.resetFields();
    } catch (error: any) {
      if (error?.errorFields) {
        message.error('请检查表单信息');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={group ? '编辑分组' : '新建分组'}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {group ? '更新' : '创建'}
        </Button>,
      ]}
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          group_name: '',
          group_teacher: '',
          teacher_phone: '',
          report_location: '',
        }}
      >
        <Form.Item
          name="group_name"
          label="分组名称"
          rules={[
            { required: true, message: '请输入分组名称' },
            { max: 100, message: '分组名称不能超过100个字符' },
          ]}
        >
          <Input placeholder="请输入分组名称" />
        </Form.Item>

        <Form.Item
          name="group_teacher"
          label="分组教师"
          rules={[
            { required: true, message: '请输入分组教师姓名' },
            { max: 50, message: '教师姓名不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入分组教师姓名" />
        </Form.Item>

        <Form.Item
          name="teacher_phone"
          label="教师联系方式"
          rules={[
            { required: true, message: '请输入教师联系方式' },
            { 
              pattern: /^1[3-9]\d{9}$/, 
              message: '请输入正确的手机号码' 
            },
          ]}
        >
          <Input placeholder="请输入教师手机号码" maxLength={11} />
        </Form.Item>

        <Form.Item
          name="report_location"
          label="报到地点"
          rules={[
            { required: true, message: '请输入报到地点' },
            { max: 200, message: '报到地点不能超过200个字符' },
          ]}
        >
          <TextArea
            placeholder="请输入报到地点详细信息"
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GroupFormModal;
