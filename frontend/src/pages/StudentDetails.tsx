import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Alert,
  Spin,
  Descriptions,
  Tag,
  Button,
  Space,
  Empty,
  message,
} from 'antd';
import { EditOutlined, UserOutlined, TeamOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Student } from '../types';
import { StudentService } from '../services/api';

const { Title, Text } = Typography;

const StudentDetails: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载学生详细信息和分组信息
  const loadStudentDetails = useCallback(async () => {
    const token = sessionStorage.getItem('student_access_token');
    if (!token) {
      message.error('访问token无效，请重新查询');
      navigate('/lookup');
      return;
    }
    
    setLoading(true);
    try {
      // 验证token并获取学生基本信息
      const verification = await StudentService.verifyAccess(token);
      if (!verification.valid) {
        message.error('访问token无效，请重新查询');
        navigate('/lookup');
        return;
      }
      
      setStudent(verification.student);
      
      // 设置个性化标题
      document.title = `${verification.student.name}的详细信息 - SIQCS`;

      // 获取学生分组信息
      try {
        const groupsResponse = await StudentService.getStudentGroupsByToken(token);
        console.log('分组信息响应:', groupsResponse);
        setGroups(groupsResponse.groups || []);
      } catch (error) {
        console.log('获取分组信息失败:', error);
        setGroups([]);
      }
    } catch (error) {
      console.error('加载学生信息失败:', error);
      message.error('加载学生信息失败，请重新查询');
      navigate('/lookup');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    document.title = '个人详细信息';
    loadStudentDetails();
  }, [loadStudentDetails]);

  const handleEditProfile = () => {
    navigate('/student/profile');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert message="未找到学生信息" type="error" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Card>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            {student.name}的详细信息
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
            报名现场需要出示本页面，方可完成报名。若报名时不方便即时查询，请截图保存或提前打印。
          </Text>
        </div>

        {/* 基本信息卡片 */}
        <Card 
          title={
            <span>
              <UserOutlined style={{ marginRight: '8px' }} />
              基本信息
            </span>
          }
          style={{ marginBottom: '20px' }}
          size="small"
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="姓名">{student.name}</Descriptions.Item>
            <Descriptions.Item label="性别">{student.gender_display}</Descriptions.Item>
            <Descriptions.Item label="年龄">{student.age || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {student.id_card_number.replace(/^(.{6}).*(.{4})$/, '$1****$2')}
            </Descriptions.Item>
            <Descriptions.Item label="通知书编号">{student.notification_number || '未填写'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 详细信息卡片 */}
        <Card 
          title={
            <span>
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              详细信息
            </span>
          }
          style={{ marginBottom: '20px' }}
          size="small"
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="住宿情况">{student.residence_status_display || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="身高">{student.height ? `${student.height} cm` : '未填写'}</Descriptions.Item>
            <Descriptions.Item label="体重">{student.weight ? `${student.weight} kg` : '未填写'}</Descriptions.Item>
            <Descriptions.Item label="是否自愿购买校服">
              {student.uniform_purchase !== undefined ? (student.uniform_purchase ? '是' : '否') : '未填写'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号码">{student.phone_number || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="BMI指数">
              {student.bmi ? student.bmi.toFixed(1) : '未计算'}
            </Descriptions.Item>
            <Descriptions.Item label="兴趣特长" span={2}>
              {student.interests_talents || '未填写'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 学生分组信息卡片 */}
        <Card 
          title={
            <span>
              <TeamOutlined style={{ marginRight: '8px' }} />
              报名分组信息
            </span>
          }
          style={{ marginBottom: '20px' }}
          size="small"
        >
          {groups.length > 0 ? (
            <Descriptions column={2} bordered>
              <Descriptions.Item label="所属分组">
                {groups[0].group_info.group_name}
              </Descriptions.Item>
              <Descriptions.Item label="分组教师">
                {groups[0].group_info.group_teacher || '暂无'}
              </Descriptions.Item>
              <Descriptions.Item label="教师电话">
                {groups[0].group_info.teacher_phone || '暂无'}
              </Descriptions.Item>
              <Descriptions.Item label="报到地点">
                {groups[0].group_info.report_location || '暂无'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description="暂无分组信息" />
          )}
        </Card>        {/* 操作按钮 */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={handleEditProfile}
            >
              编辑我的资料
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/lookup')}
            >
              返回查询页面
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default StudentDetails;
