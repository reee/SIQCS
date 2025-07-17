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
} from 'antd';
import { EditOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { Student } from '../types';
import { StudentService } from '../services/api';

const { Title, Text } = Typography;

const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载学生详细信息和分组信息
  const loadStudentDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // 获取学生基本信息
      const studentData = await StudentService.getStudent(parseInt(id));
      setStudent(studentData);

      // 获取学生分组信息
      try {
        const groupsResponse = await StudentService.getStudentGroups(parseInt(id));
        setGroups(groupsResponse.groups || []);
      } catch (error) {
        console.log('获取分组信息失败:', error);
        setGroups([]);
      }
    } catch (error) {
      console.error('加载学生信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudentDetails();
  }, [loadStudentDetails]);

  const handleEditProfile = () => {
    if (student) {
      navigate(`/students/${student.id}/profile`);
    }
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
            个人资料详情
          </Title>
          <Text type="secondary">
            {student.name}的详细信息
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
            <Descriptions.Item label="邮箱">{student.email || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="通知书编号">{student.notification_number || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="信息状态" span={2}>
              <Tag color={student.info_status === 'COMPLETE' ? 'green' : 'orange'}>
                {student.info_status_display}
              </Tag>
              <Text style={{ marginLeft: '8px' }}>
                完成度: {student.completion_percentage}%
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 详细信息卡片 */}
        <Card 
          title="详细信息"
          style={{ marginBottom: '20px' }}
          size="small"
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="住宿情况">{student.residence_status_display || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="身高">{student.height ? `${student.height} cm` : '未填写'}</Descriptions.Item>
            <Descriptions.Item label="体重">{student.weight ? `${student.weight} kg` : '未填写'}</Descriptions.Item>
            <Descriptions.Item label="是否购买校服">
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

        {/* 分组信息卡片 */}
        <Card 
          title={
            <span>
              <TeamOutlined style={{ marginRight: '8px' }} />
              分组信息
            </span>
          }
          style={{ marginBottom: '20px' }}
          size="small"
        >
          {groups && groups.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {groups.map((group, index) => (
                <Card 
                  key={index}
                  size="small" 
                  type="inner"
                  title={group.group_name}
                  extra={<Tag color="blue">{group.group_type_display}</Tag>}
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="分组描述">
                      {group.description || '无描述'}
                    </Descriptions.Item>
                    <Descriptions.Item label="分配时间">
                      {group.assigned_at ? new Date(group.assigned_at).toLocaleString() : '未知'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ))}
            </Space>
          ) : (
            <Alert 
              message="暂无分组信息" 
              description="您还没有被分配到任何分组"
              type="info" 
              showIcon 
            />
          )}
        </Card>

        {/* 操作按钮 */}
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
