import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Row, Col, Statistic, Button, Space, Typography, Select, Tag,
  Card, Spin, Empty, Badge,
} from 'antd';
import {
  FullscreenExitOutlined, DollarOutlined, ShoppingCartOutlined,
  RiseOutlined, ArrowUpOutlined, SyncOutlined, ProjectOutlined,
  ReloadOutlined, PauseCircleOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import type { RootState, AppDispatch } from '../../store';
import {
  fetchHourlyRevenue,
  fetchProjectKPI,
  addSimulatedRecord,
  clearRevenueData,
} from '../../store/revenueSlice';
import { fetchProjects } from '../../store/projectSlice';
import { toggleBigScreen } from '../../store/uiSlice';
import { revenueApi } from '../../api/revenue';
import { usePolling } from '../../hooks/usePolling';
import { formatAmount, formatNumber } from '../../utils/validation';
import type { HourlyRevenue } from '../../types';

const { Text, Title } = Typography;

const COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d', '#2f54eb'];

const BigScreenPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hourlyData, kpi, loading } = useSelector((state: RootState) => state.revenue);
  const { projects } = useSelector((state: RootState) => state.projects);
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      const active = projects.find(p => p.status === 'active') || projects[0];
      setSelectedProjectId(active.id);
    }
  }, [projects, selectedProjectId]);

  const loadData = useCallback(() => {
    if (!selectedProjectId) return;
    dispatch(fetchHourlyRevenue({ projectId: selectedProjectId }));
    dispatch(fetchProjectKPI(selectedProjectId));
  }, [dispatch, selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  // 5-second polling in big screen mode
  const pollingCallback = useCallback(() => {
    if (!selectedProjectId || isPaused) return;
    dispatch(fetchHourlyRevenue({ projectId: selectedProjectId }));
    dispatch(fetchProjectKPI(selectedProjectId));
    const newRecord = revenueApi.simulateUpdate(selectedProjectId);
    if (newRecord) {
      dispatch(addSimulatedRecord(newRecord));
    }
  }, [dispatch, selectedProjectId, isPaused]);

  usePolling(pollingCallback, 5000, !isPaused && !!selectedProjectId);

  const chartData = useMemo(() => {
    const data = [];
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

  // Pie chart data from all stalls across all hours
  const stallSummary = useMemo(() => {
    const map = new Map<string, number>();
    hourlyData.forEach(h => {
      h.stalls.forEach(s => {
        map.set(s.stallName, (map.get(s.stallName) || 0) + s.amount);
      });
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [hourlyData]);

  // Top stalls bar chart
  const topStalls = useMemo(() => {
    return stallSummary.slice(0, 8);
  }, [stallSummary]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const bgColor = themeMode === 'dark' ? '#141414' : '#f0f2f5';

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      padding: 16,
      color: themeMode === 'dark' ? '#fff' : 'inherit',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: themeMode === 'dark' ? '#1f1f1f' : '#fff',
        borderRadius: 8,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <Space size="large">
          <Title level={3} style={{ margin: 0 }}>
            📊 团餐营收数据大屏
          </Title>
          {!isPaused && <Tag color="processing" icon={<SyncOutlined spin />}>实时刷新 5s</Tag>}
        </Space>
        <Space>
          <Select
            value={selectedProjectId || undefined}
            onChange={(id) => {
              setSelectedProjectId(id);
              dispatch(clearRevenueData());
            }}
            style={{ width: 250 }}
            showSearch
            optionFilterProp="label"
            options={projects.map(p => ({
              value: p.id,
              label: `${p.name} (${p.location})`,
            }))}
          />
          <Button
            icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? '继续刷新' : '暂停刷新'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<FullscreenExitOutlined />}
            onClick={() => dispatch(toggleBigScreen())}
          >
            退出大屏
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card style={{ background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日累计营收</span>}
              value={kpi?.todayAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}
              suffix={<ArrowUpOutlined style={{ fontSize: 16 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日订单数</span>}
              value={kpi?.todayOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>客单价</span>}
              value={kpi?.avgOrderValue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="实时营收趋势（小时）" style={{ height: 400 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bigScreenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="hour" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Area type="monotone" dataKey="营收" stroke="#1677ff" fill="url(#bigScreenGradient)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="各档口营收占比" style={{ height: 400 }}>
            {stallSummary.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stallSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {stallSummary.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="档口营收排行Top8" style={{ height: 350 }}>
            {topStalls.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topStalls} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={11}
                    width={80}
                  />
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                  <Bar dataKey="value" fill="#1677ff" radius={[0, 4, 4, 0]}>
                    {topStalls.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="实时数据流" style={{ height: 350 }}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Table
                dataSource={
                  hourlyData
                    .filter(d => d.totalAmount > 0)
                    .slice(-10)
                    .reverse()
                    .map((d, i) => ({ ...d, key: i }))
                }
                columns={[
                  { title: '时间', dataIndex: 'hour', key: 'hour', render: (h: number) => `${h}:00` },
                  { title: '营收', dataIndex: 'totalAmount', key: 'amount', render: (v: number) => formatAmount(v) },
                  { title: '订单', dataIndex: 'totalOrders', key: 'orders' },
                  { title: '档口数', key: 'stalls', render: (_: unknown, r: HourlyRevenue) => r.stalls.length },
                ]}
                pagination={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Inline Table component for BigScreen
const Table: React.FC<{
  dataSource: Record<string, unknown>[];
  columns: { title: string; dataIndex?: string; key: string; render?: (value: unknown, record: unknown) => React.ReactNode }[];
  pagination?: false;
  size?: 'small';
}> = ({ dataSource, columns, pagination, size }) => {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: size === 'small' ? 13 : 14 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
          {columns.map(col => (
            <th key={col.key} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40 }}>暂无数据</td>
          </tr>
        ) : (
          dataSource.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '6px 12px' }}>
                  {col.render
                    ? col.render(col.dataIndex ? row[col.dataIndex] : undefined, row)
                    : (col.dataIndex ? String(row[col.dataIndex] ?? '') : '')}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default BigScreenPage;
