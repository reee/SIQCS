import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Radio,
  Button,
  message,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Student, StudentProfileUpdate } from '../types';
import { StudentService } from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 加载学生信息
  const loadStudent = useCallback(async () => {
    const token = sessionStorage.getItem('student_access_token');
    if (!token) {
      message.error('访问token无效，请重新查询');
      navigate('/lookup');
      return;
    }
    
    setLoading(true);
    try {
      const result = await StudentService.verifyAccess(token);
      if (!result.valid) {
        message.error('访问token无效，请重新查询');
        navigate('/lookup');
        return;
      }
      
      const data = result.student;
      setStudent(data);
      
      // 填充表单数据
      form.setFieldsValue({
        residence_status: data.residence_status,
        height: data.height,
        weight: data.weight,
        uniform_purchase: data.uniform_purchase,
        interests_talents: data.interests_talents,
        phone_number: data.phone_number,
        email: data.email,
      });
    } catch (error) {
      message.error('加载学生信息失败');
      console.error(error);
      navigate('/lookup');
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  // 提交表单
  const handleSubmit = async (values: StudentProfileUpdate) => {
    if (!student) return;

    setSubmitting(true);
    try {
      const result = await StudentService.completeProfile(student.id, values);
      message.success(result.message);
      
      // 更新学生信息
      setStudent({ ...student, ...result.student });
      
      // 如果信息已完整，跳转到详情页面
      if (result.student.info_status === 'COMPLETE') {
        setTimeout(() => {
          navigate('/student/details');
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      message.error(`更新失败：${errorMessage}`);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin spinning={loading}>
          <div style={{ height: '200px' }} />
        </Spin>
      </div>
    );
  }

  const isComplete = student.info_status === 'COMPLETE';

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>{student.name} 同学，请完善你的个人资料</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            {/* 住校情况 */}
            <Col span={12}>
              <Form.Item
                name="residence_status"
                label="住校情况"
                rules={[{ required: true, message: '请选择住校情况' }]}
              >
                <Radio.Group>
                  <Radio value="RESIDENT">住校</Radio>
                  <Radio value="NON_RESIDENT">不住校</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* 校服订购 */}
            <Col span={12}>
              <Form.Item
                name="uniform_purchase"
                label="是否自愿订购校服"
                rules={[{ required: true, message: '请选择是否订购校服' }]}
              >
                <Radio.Group>
                  <Radio value={true}>是</Radio>
                  <Radio value={false}>否</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* 身高 */}
            <Col span={12}>
              <Form.Item
                name="height"
                label="身高(cm)"
                rules={[
                  { required: true, message: '请输入身高' },
                  {
                    type: 'number',
                    min: 120,
                    max: 250,
                    message: '身高应在120-250cm之间',
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

            {/* 体重 */}
            <Col span={12}>
              <Form.Item
                name="weight"
                label="体重(kg)"
                rules={[
                  { required: true, message: '请输入体重' },
                  {
                    type: 'number',
                    min: 40,
                    max: 250,
                    message: '体重应在40-250kg之间',
                  },
                ]}
              >
                <InputNumber
                  placeholder="请输入体重，注意单位为千克"
                  style={{ width: '100%' }}
                  min={10}
                  max={200}
                />
              </Form.Item>
            </Col>

            {/* 手机号码 */}
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label="手机号码（可选）"
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

            {/* 邮箱地址 */}
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱地址（可选）"
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

            {/* 兴趣特长 */}
            <Col span={24}>
              <Form.Item
                name="interests_talents"
                label="兴趣特长（可选）"
                rules={[
                  {
                    validator: async (_, value) => {
                      if (value && value.trim().length > 0 && value.trim().length < 2) {
                        throw new Error('兴趣特长至少需要2个字符');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <TextArea
                  placeholder="请详细描述您的兴趣特长，如体育运动、音乐艺术、科技创新等...（可选填写）"
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center" style={{ marginTop: 24 }}>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={submitting}
                style={{ minWidth: 120 }}
              >
                保存资料
              </Button>
            </Col>
          </Row>
        </Form>

        {/* 分组信息提醒 */}
        <Alert
          message="分组信息提醒"
          description="请完成个人资料填写并点击保存，保存成功后您将能够查看报名分组信息。"
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />

        {isComplete && (
          <Alert
            message="恭喜！"
            description="您的个人资料已经完善，感谢您的配合！"
            type="success"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}
      </Card>
    </div>
  );
};

export default StudentProfile;
