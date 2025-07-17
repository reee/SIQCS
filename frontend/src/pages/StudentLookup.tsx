import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Alert,
  Typography,
  Divider,
} from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StudentService } from '../services/api';

const { Title, Text } = Typography;

const StudentLookup: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (values: { id_suffix: string; name: string }) => {
    setLoading(true);
    try {
      // 使用新的安全查询API
      const response = await StudentService.lookupByNameAndIdSuffix({
        name: values.name,
        id_suffix: values.id_suffix
      });
      
      const studentData = response.student;
      
      // 根据学生信息完成状态进行跳转
      if (studentData.info_status !== 'COMPLETE' || studentData.completion_percentage < 100) {
        // 信息未完善，直接跳转到完善资料页面
        message.success('找到您的信息，正在跳转到完善资料页面...');
        setTimeout(() => {
          navigate(`/students/${studentData.id}/profile`);
        }, 1000);
      } else {
        // 信息已完善，直接跳转到详情页面
        message.success('找到您的信息，正在跳转到详情页面...');
        setTimeout(() => {
          navigate(`/students/${studentData.id}/details`);
        }, 1000);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '查询失败，请稍后重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '500px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            学生信息查询
          </Title>
          <Text type="secondary">
            请输入您的姓名和身份证后6位查询个人信息
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          size="large"
        >
          <Form.Item
            name="name"
            label="学生姓名"
            rules={[
              { required: true, message: '请输入您的姓名' },
              { max: 50, message: '姓名长度不能超过50个字符' },
            ]}
          >
            <Input 
              placeholder="请输入学生姓名" 
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="id_suffix"
            label="身份证后6位"
            rules={[
              { required: true, message: '请输入身份证后6位' },
              { 
                pattern: /^\d{6}$/, 
                message: '请输入正确的6位数字' 
              },
            ]}
          >
            <Input 
              placeholder="请输入身份证后6位数字" 
              maxLength={6}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SearchOutlined />}
              block
              style={{ height: '48px', fontSize: '16px' }}
            >
              查询我的信息
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        
        <Alert
          message="温馨提示"
          description="请使用您的真实姓名和身份证后6位数字进行查询。如果您无法找到自己的信息，请拨打教导处电话 023-72897782 或到行政楼2楼教导处咨询。"
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
};

export default StudentLookup;
