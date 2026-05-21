import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card, Row, Col, Statistic, Spin, Button, Select, Empty, Space,
  Typography, message, Modal, Table, Tag,
} from 'antd';
import {
  DollarOutlined, ShoppingCartOutlined, RiseOutlined,
  ReloadOutlined, ArrowUpOutlined, PauseCircleOutlined,
  PlayCircleOutlined, ProjectOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import type { RootState, AppDispatch } from '../../store';
import {
  fetchHourlyRevenue,
  fetchProjectKPI,
  setPolling,
  setPollInterval,
  addSimulatedRecord,
  clearRevenueData,
} from '../../store/revenueSlice';
import { setActivePage, setSelectedProject as setSelectedProjAction } from '../../store/uiSlice';
import { fetchProjects } from '../../store/projectSlice';
import { revenueApi } from '../../api/revenue';
import { usePolling } from '../../hooks/usePolling';
import { formatAmount, formatNumber } from '../../utils/validation';
import type { HourlyRevenue, Project } from '../../types';

const { Text, Title } = Typography;

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hourlyData, kpi, loading, error } = useSelector((state: RootState) => state.revenue);
  const { projects, selectedProject } = useSelector((state: RootState) => state.projects);
  const { isBigScreen } = useSelector((state: RootState) => state.ui);
  const pollingEnabled = useSelector((state: RootState) => state.revenue.polling);
  const pollInterval = useSelector((state: RootState) => state.revenue.pollInterval);

  const [localSelectedProject, setLocalSelectedProject] = useState<Project | null>(selectedProject);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedHourData, setSelectedHourData] = useState<HourlyRevenue | null>(null);
  const [localPolling, setLocalPolling] = useState(true);

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (!localSelectedProject && projects.length > 0) {
      const active = projects.find(p => p.status === 'active') || projects[0];
      setLocalSelectedProject(active);
    }
  }, [projects, localSelectedProject]);

  useEffect(() => {
    if (selectedProject && selectedProject.id !== localSelectedProject?.id) {
      setLocalSelectedProject(selectedProject);
    }
  }, [selectedProject]);

  const loadData = useCallback(() => {
    if (!localSelectedProject) return;
    dispatch(fetchHourlyRevenue({ projectId: localSelectedProject.id }));
    dispatch(fetchProjectKPI(localSelectedProject.id));
  }, [dispatch, localSelectedProject]);

  useEffect(() => {
    if (localSelectedProject) {
      loadData();
    }
  }, [localSelectedProject?.id]);

  // Polling for real-time data
  const pollingCallback = useCallback(() => {
    if (!localSelectedProject || !localPolling) return;
    // Re-fetch data
    dispatch(fetchHourlyRevenue({ projectId: localSelectedProject.id }));
    dispatch(fetchProjectKPI(localSelectedProject.id));

    // Simulate new revenue coming in
    const newRecord = revenueApi.simulateUpdate(localSelectedProject.id);
    if (newRecord) {
      dispatch(addSimulatedRecord(newRecord));
    }
  }, [dispatch, localSelectedProject, localPolling]);

  usePolling(pollingCallback, isBigScreen ? 5000 : 10000, localPolling && !!localSelectedProject);

  const handleRetry = () => {
    loadData();
  };

  const handleChartClick = (data: { activeLabel?: string }) => {
    if (!data?.activeLabel) return;
    const hour = parseInt(data.activeLabel);
    const hourData = hourlyData.find(h => h.hour === hour);
    if (hourData) {
      setSelectedHourData(hourData);
      setDetailModalOpen(true);
    }
  };

  const chartData = useMemo(() => {
    const data: { hour: string; 营收: number; 订单数: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const found = hourlyData.find(d => d.hour === h);
      data.push({
        hour: `${h}:00`,
        营收: found ? Math.round(found.totalAmount) : 0,
        订单数: found ? found.totalOrders : 0,
      });
    }
    return data;
  }, [hourlyData]);

  const handleProjectChange = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setLocalSelectedProject(proj);
      dispatch(clearRevenueData());
    }
  };

  const togglePolling = () => {
    setLocalPolling(!localPolling);
  };

  const goToEntry = () => {
    if (localSelectedProject) {
      dispatch(setActivePage('revenue-entry'));
    }
  };

  if (!localSelectedProject) {
    return (
      <Card>
        <Empty
          description="请先在项目管理中选择或创建一个项目"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => dispatch(setActivePage('projects'))}>
            前往项目管理
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div>
      {/* Project Selector */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space>
            <ProjectOutlined />
            <Select
              value={localSelectedProject?.id}
              onChange={handleProjectChange}
              style={{ width: 280 }}
              placeholder="选择项目"
              showSearch
              optionFilterProp="label"
              options={projects.map(p => ({
                value: p.id,
                label: `${p.name} (${p.location})`,
              }))}
            />
          </Space>
          <Space>
            <Button
              icon={localPolling ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={togglePolling}
              type={localPolling ? 'default' : 'primary'}
            >
              {localPolling ? '暂停刷新' : '开启刷新'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRetry} loading={loading}>
              刷新
            </Button>
            <Button type="primary" onClick={goToEntry}>录营收</Button>
          </Space>
        </Space>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card className="kpi-card" hoverable>
            <Statistic
              title="今日累计营收"
              value={kpi?.todayAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1677ff', fontSize: 28 }}
              suffix={<ArrowUpOutlined style={{ fontSize: 14, color: '#52c41a' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="kpi-card" hoverable>
            <Statistic
              title="今日订单数"
              value={kpi?.todayOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="kpi-card" hoverable>
            <Statistic
              title="客单价"
              value={kpi?.avgOrderValue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16', fontSize: 28 }}
              suffix={<RiseOutlined style={{ fontSize: 14 }} />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>今日实时营收趋势（点击查看详情）</span>
            {localPolling && <Tag color="processing" icon={<SyncOutlined spin />}>实时更新中</Tag>}
          </Space>
        }
        extra={<Text type="secondary">横轴：小时（0-23）</Text>}
      >
        {error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="danger">{error}</Text>
            <br />
            <Button onClick={handleRetry} style={{ marginTop: 12 }}>重试</Button>
          </div>
        ) : (
          <div ref={chartRef} style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                onClick={handleChartClick}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === '营收' ? formatAmount(value) : formatNumber(value),
                    name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="营收"
                  stroke="#1677ff"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Hourly Detail Modal */}
      <Modal
        title={`${selectedHourData?.hour}:00 各档口营收明细`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedHourData ? (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic title="该小时总营收" value={selectedHourData.totalAmount} prefix="¥" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="该小时订单数" value={selectedHourData.totalOrders} />
              </Col>
            </Row>
            <Table
              dataSource={selectedHourData.stalls.map((s, i) => ({ ...s, key: i }))}
              columns={[
                { title: '档口', dataIndex: 'stallName', key: 'stallName' },
                { title: '营收', dataIndex: 'amount', key: 'amount', render: (v: number) => formatAmount(v) },
                { title: '订单数', dataIndex: 'orders', key: 'orders', render: (v: number) => formatNumber(v) },
              ]}
              pagination={false}
              size="small"
            />
          </>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
