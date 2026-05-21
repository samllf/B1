import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Menu, Button, Switch, Space, Typography, Badge, Tooltip } from 'antd';
import {
  ProjectOutlined,
  DashboardOutlined,
  FormOutlined,
  ImportOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  SunOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { RootState, AppDispatch } from '../../store';
import { setActivePage, toggleBigScreen, toggleSidebar } from '../../store/uiSlice';
import { toggleTheme } from '../../store/themeSlice';
import ProjectsPage from '../../pages/Projects/ProjectsPage';
import DashboardPage from '../../pages/Dashboard/DashboardPage';
import RevenueEntryPage from '../../pages/RevenueEntry/RevenueEntryPage';
import DataIOPage from '../../pages/DataIO/DataIOPage';
import BigScreenPage from '../../pages/BigScreen/BigScreenPage';
import type { PageRoute } from '../../types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: 'projects', icon: <ProjectOutlined />, label: '项目管理' },
  { key: 'dashboard', icon: <DashboardOutlined />, label: '营收看板' },
  { key: 'revenue-entry', icon: <FormOutlined />, label: '营收录入' },
  { key: 'data-io', icon: <ImportOutlined />, label: '导入导出' },
  { key: 'big-screen', icon: <FullscreenOutlined />, label: '数据大屏' },
];

const renderPage = (page: PageRoute) => {
  switch (page) {
    case 'projects': return <ProjectsPage />;
    case 'dashboard': return <DashboardPage />;
    case 'revenue-entry': return <RevenueEntryPage />;
    case 'data-io': return <DataIOPage />;
    case 'big-screen': return <BigScreenPage />;
    default: return <ProjectsPage />;
  }
};

const AppLayout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { activePage, isBigScreen, sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  const handleMenuClick = (key: string) => {
    dispatch(setActivePage(key as PageRoute));
  };

  if (isBigScreen) {
    return (
      <Layout style={{ height: '100%' }}>
        <BigScreenPage />
      </Layout>
    );
  }

  return (
    <Layout style={{ height: '100%' }}>
      {/* Desktop Sidebar */}
      <Sider
        className="desktop-sidebar"
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={() => dispatch(toggleSidebar())}
        breakpoint="lg"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Text strong style={{ color: '#fff', fontSize: sidebarCollapsed ? 14 : 18, whiteSpace: 'nowrap' }}>
            {sidebarCollapsed ? '团餐' : '团餐营收管理'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activePage]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          padding: '0 16px',
          display: 'flex',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          alignItems: 'center',
        }}>
          {!sidebarCollapsed && (
            <Space>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                {themeMode === 'dark' ? '暗色' : '亮色'}
              </Text>
              <Switch
                checked={themeMode === 'dark'}
                onChange={() => dispatch(toggleTheme())}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                size="small"
              />
            </Space>
          )}
          <Tooltip title="数据大屏">
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={() => dispatch(toggleBigScreen())}
              style={{ color: 'rgba(255,255,255,0.65)' }}
            />
          </Tooltip>
        </div>
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* Top Header */}
        <Header style={{
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: themeMode === 'dark' ? '#141414' : '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Space>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
              className="desktop-sidebar-trigger"
            />
            <Text strong style={{ fontSize: 16 }}>
              {menuItems.find(m => m.key === activePage)?.label || '团餐营收管理系统'}
            </Text>
          </Space>
          <Space>
            <Badge status="processing" text="系统运行中" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date().toLocaleString('zh-CN')}
            </Text>
          </Space>
        </Header>

        {/* Page Content */}
        <Content style={{
          padding: 24,
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
          paddingBottom: 80, // Space for mobile bottom nav
        }}>
          {renderPage(activePage)}
        </Content>
      </Layout>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: themeMode === 'dark' ? '#141414' : '#fff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'none',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {menuItems.map(item => (
            <div
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: activePage === item.key ? '#1677ff' : undefined,
                fontSize: 12,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
              <span style={{ fontSize: 10 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AppLayout;
