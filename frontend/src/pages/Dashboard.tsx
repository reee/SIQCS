import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
  message,
  Typography,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { StudentStatistics } from '../types';
import { StudentService } from '../services/api';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载统计数据
  const loadStatistics = async () => {
    setLoading(true);
    try {
      const data = await StudentService.getStatistics();
      setStatistics(data);
    } catch (error) {
      message.error('加载统计数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  // 计算完成率
  const completionRate = statistics ? 
    Math.round((statistics.info_completion.COMPLETE / statistics.total_students) * 100) : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>数据统计</Title>
      
      <Spin spinning={loading}>
        {statistics && (
          <>
            {/* 基础统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="学生总数"
                    value={statistics.total_students}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="信息完整"
                    value={statistics.info_completion.COMPLETE}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                    suffix={`/ ${statistics.total_students}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="完成率"
                    value={completionRate}
                    precision={1}
                    suffix="%"
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Progress 
                    percent={completionRate} 
                    strokeColor="#1890ff"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="导入批次"
                    value={statistics.import_batches}
                    prefix={<ImportOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 详细统计信息 */}
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card title="性别分布">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="男生"
                        value={statistics.gender_distribution.male}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="女生"
                        value={statistics.gender_distribution.female}
                        valueStyle={{ color: '#f5222d' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card title="住校情况">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic
                        title="住校"
                        value={statistics.residence_distribution.resident}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="不住校"
                        value={statistics.residence_distribution.non_resident}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="未填写"
                        value={statistics.residence_distribution.unknown}
                        valueStyle={{ color: '#d9d9d9' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={8}>
                <Card title="信息完整度">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic
                        title="已导入"
                        value={statistics.info_completion.IMPORTED}
                        valueStyle={{ color: '#d9d9d9' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="部分完成"
                        value={statistics.info_completion.PARTIAL}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="信息完整"
                        value={statistics.info_completion.COMPLETE}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* 校服订购和身体指标统计 */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="校服订购情况">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic
                        title="已订购"
                        value={statistics.uniform_purchase.purchased}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="未订购"
                        value={statistics.uniform_purchase.not_purchased}
                        valueStyle={{ color: '#f5222d' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="未填写"
                        value={statistics.uniform_purchase.unknown}
                        valueStyle={{ color: '#d9d9d9' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="身体指标统计">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="平均身高"
                        value={statistics.physical_stats.average_height}
                        precision={1}
                        suffix="cm"
                      />
                      <p style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                        {statistics.physical_stats.height_count} 人已填写
                      </p>
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="平均体重"
                        value={statistics.physical_stats.average_weight}
                        precision={1}
                        suffix="kg"
                      />
                      <p style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                        {statistics.physical_stats.weight_count} 人已填写
                      </p>
                    </Col>
                  </Row>
                  
                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8 }}>身高填写率</div>
                        <Progress
                          percent={Math.round((statistics.physical_stats.height_count / statistics.total_students) * 100)}
                          size="small"
                          strokeColor="#1890ff"
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div style={{ marginBottom: 8 }}>体重填写率</div>
                        <Progress
                          percent={Math.round((statistics.physical_stats.weight_count / statistics.total_students) * 100)}
                          size="small"
                          strokeColor="#52c41a"
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
};

export default Dashboard;
