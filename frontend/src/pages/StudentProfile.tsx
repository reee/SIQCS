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
  Progress,
  Typography,
  Alert,
  Spin,
} from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { Student, StudentProfileUpdate } from '../types';
import { StudentService } from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [student, setStudent] = useState<Student | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 加载学生信息
  const loadStudent = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await StudentService.getStudent(parseInt(id));
      setStudent(data);
      
      // 加载分组信息
      try {
        const groupsResponse = await StudentService.getStudentGroups(parseInt(id));
        setGroups(groupsResponse.groups || []);
      } catch (error) {
        console.log('获取分组信息失败:', error);
        setGroups([]);
      }
      
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
    } finally {
      setLoading(false);
    }
  }, [id, form]);

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
          navigate(`/students/${student.id}/details`);
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
        <Title level={2}>完善个人资料</Title>
        
        {/* 学生基本信息显示 */}
        <Alert
          message={
            <div>
              <Text strong>学生信息：</Text>
              {student.name} ({student.gender_display}) - {student.id_card_number.replace(/^(.{6}).*(.{4})$/, '$1****$2')}
              {student.age && <Text> - {student.age}岁</Text>}
            </div>
          }
          type="info"
          style={{ marginBottom: 24 }}
        />

        {/* 完成进度 */}
        <Card size="small" style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Text strong>完成进度：</Text>
            </Col>
            <Col span={16}>
              <Progress
                percent={student.completion_percentage}
                status={isComplete ? 'success' : 'active'}
                strokeColor={isComplete ? '#52c41a' : '#1890ff'}
              />
            </Col>
            <Col span={4}>
              <Text type={isComplete ? 'success' : 'warning'}>
                {student.info_status_display}
              </Text>
              {isComplete && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />}
            </Col>
          </Row>
        </Card>

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

            {/* 体重 */}
            <Col span={12}>
              <Form.Item
                name="weight"
                label="体重(kg)"
                rules={[
                  { required: true, message: '请输入体重' },
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

            {/* 手机号码 */}
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

            {/* 邮箱地址 */}
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

            {/* 兴趣特长 */}
            <Col span={24}>
              <Form.Item
                name="interests_talents"
                label="兴趣特长"
                rules={[
                  { required: true, message: '请填写兴趣特长' },
                  { min: 10, message: '兴趣特长至少需要10个字符' },
                ]}
              >
                <TextArea
                  placeholder="请详细描述您的兴趣特长，如体育运动、音乐艺术、科技创新等..."
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

        {/* 分组信息显示 */}
        {groups && groups.length > 0 && (
          <Card 
            title="我的分组信息" 
            style={{ marginTop: '24px' }}
            size="small"
          >
            {groups.map((group, index) => (
              <Card 
                key={index}
                size="small" 
                type="inner"
                title={group.group_name}
                style={{ marginBottom: '8px' }}
              >
                <Text type="secondary">
                  {group.group_type_display} - {group.description || '无描述'}
                </Text>
              </Card>
            ))}
          </Card>
        )}

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
