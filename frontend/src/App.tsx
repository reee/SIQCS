import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import StudentLookup from './pages/StudentLookup';
import GroupManagement from './pages/GroupManagement';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AppMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据统计',
    },
    {
      key: '/students',
      icon: <UserOutlined />,
      label: '学生管理',
    },
    {
      key: '/groups',
      icon: <TeamOutlined />,
      label: '分组管理',
    },
    {
      key: '/lookup',
      icon: <SearchOutlined />,
      label: '学生查询',
    },
  ];

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
    />
  );
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isLookupPage = location.pathname === '/lookup';

  if (isLookupPage) {
    // 学生查询页面使用独立布局
    return <StudentLookup />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" style={{ position: 'fixed', height: '100vh', zIndex: 1 }}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #404040'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            学生信息系统
          </Title>
        </div>
        <AppMenu />
      </Sider>
      
      <Layout style={{ marginLeft: 200 }}>
        <Header style={{ 
          background: 'white', 
          padding: '0 24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1,
          position: 'sticky',
          top: 0
        }}>
          <Title level={3} style={{ margin: 0, lineHeight: '64px' }}>
            学生信息收集及查询系统
          </Title>
        </Header>
        
        <Content style={{ background: '#f0f2f5', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/:id/profile" element={<StudentProfile />} />
            <Route path="/groups" element={<GroupManagement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/lookup" element={<StudentLookup />} />
        <Route path="/students/:id/profile" element={<StudentProfile />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
