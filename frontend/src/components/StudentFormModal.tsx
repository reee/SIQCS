import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Button,
  message,
  Row,
  Col,
} from 'antd';
import { Student, StudentListItem } from '../types';
import { StudentService } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface StudentFormModalProps {
  visible: boolean;
  student: StudentListItem | Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  visible,
  student,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const isEditing = !!student;

  useEffect(() => {
    if (visible) {
      if (student) {
        // 编辑模式，填充表单数据
        form.setFieldsValue({
          name: student.name,
          notification_number: (student as Student).notification_number,
          id_card_number: student.id_card_number,
          residence_status: (student as Student).residence_status,
          height: (student as Student).height,
          weight: (student as Student).weight,
          uniform_purchase: (student as Student).uniform_purchase,
          interests_talents: (student as Student).interests_talents,
          phone_number: (student as Student).phone_number,
          email: (student as Student).email,
        });
      } else {
        // 新增模式，重置表单
        form.resetFields();
      }
    }
  }, [visible, student, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEditing) {
        // 更新学生信息
        await StudentService.updateStudent(student!.id, values);
        message.success('学生信息更新成功');
      } else {
        // 创建新学生
        await StudentService.createStudent(values);
        message.success('学生信息创建成功');
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          error.message;
      message.error(`操作失败：${errorMessage}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isEditing ? '编辑学生信息' : '新增学生信息'}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          {isEditing ? '更新' : '创建'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          {/* 基础信息 */}
          <Col span={12}>
            <Form.Item
              name="name"
              label="学生姓名"
              rules={[
                { required: true, message: '请输入学生姓名' },
                { max: 50, message: '姓名长度不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入学生姓名" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="notification_number"
              label="通知书编号"
              rules={[
                { required: true, message: '请输入通知书编号' },
                { max: 50, message: '通知书编号长度不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入通知书编号" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="id_card_number"
              label="身份证号"
              rules={[
                { required: true, message: '请输入身份证号' },
                { 
                  pattern: /^\d{17}[\dX]$/, 
                  message: '身份证号格式不正确' 
                },
              ]}
            >
              <Input 
                placeholder="请输入18位身份证号" 
                maxLength={18}
                disabled={isEditing} // 编辑时不允许修改身份证号
              />
            </Form.Item>
          </Col>

          {/* 扩展信息 */}
          <Col span={12}>
            <Form.Item
              name="residence_status"
              label="住校情况"
            >
              <Select placeholder="请选择住校情况">
                <Option value="RESIDENT">住校</Option>
                <Option value="NON_RESIDENT">不住校</Option>
                <Option value="UNKNOWN">未填写</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="uniform_purchase"
              label="校服订购"
            >
              <Radio.Group>
                <Radio value={true}>是</Radio>
                <Radio value={false}>否</Radio>
                <Radio value={null}>未填写</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="height"
              label="身高(cm)"
              rules={[
                {
                  type: 'number',
                  min: 50,
                  max: 250,
                  message: '身高应在50-250cm之间',
                },
              ]}
            >
              <InputNumber
                placeholder="请输入身高"
                style={{ width: '100%' }}
                min={50}
                max={250}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="weight"
              label="体重(kg)"
              rules={[
                {
                  type: 'number',
                  min: 10,
                  max: 200,
                  message: '体重应在10-200kg之间',
                },
              ]}
            >
              <InputNumber
                placeholder="请输入体重"
                style={{ width: '100%' }}
                min={10}
                max={200}
              />
            </Form.Item>
          </Col>

          {/* 联系信息 */}
          <Col span={12}>
            <Form.Item
              name="phone_number"
              label="手机号码"
              rules={[
                {
                  pattern: /^1\d{10}$/,
                  message: '请输入正确的手机号码',
                },
              ]}
            >
              <Input placeholder="请输入11位手机号码" maxLength={11} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                {
                  type: 'email',
                  message: '请输入正确的邮箱地址',
                },
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="interests_talents"
              label="兴趣特长"
            >
              <TextArea
                placeholder="请描述学生的兴趣特长"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default StudentFormModal;
