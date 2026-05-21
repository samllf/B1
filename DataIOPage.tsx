import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card, Button, Space, Select, DatePicker, Typography, message,
  Upload, Radio, Modal, Table, Tag, Alert, Divider, Progress,
} from 'antd';
import {
  DownloadOutlined, UploadOutlined, FileExcelOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import type { RootState, AppDispatch } from '../../store';
import { fetchProjects } from '../../store/projectSlice';
import { exportRecords, importRecords } from '../../store/revenueSlice';
import { exportToExcel, importFromExcel } from '../../utils/excel';
import type { RevenueRecord, Project } from '../../types';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const DataIOPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.projects);
  const { records: exportedRecords, importing, loading } = useSelector((state: RootState) => state.revenue);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [importData, setImportData] = useState<Omit<RevenueRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState<unknown[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Export
  const handleExport = async () => {
    if (!selectedProjectId) {
      message.error('请先选择项目');
      return;
    }
    if (!dateRange) {
      message.error('请选择时间范围');
      return;
    }

    try {
      const result = await dispatch(exportRecords({
        projectId: selectedProjectId,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })).unwrap();

      if (result.length === 0) {
        message.warning('所选时间范围内无数据');
        return;
      }

      const filename = `${selectedProject?.name || '营收数据'}_${dateRange[0].format('YYYYMMDD')}-${dateRange[1].format('YYYYMMDD')}`;
      exportToExcel(result, filename);
      message.success(`导出成功，共 ${result.length} 条记录`);
    } catch (err) {
      message.error('导出失败：' + (err as Error).message);
    }
  };

  // Import
  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      setImportData(data);
      message.success(`读取成功，共 ${data.length} 条记录`);
    } catch (err) {
      message.error('文件读取失败：' + (err as Error).message);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!selectedProjectId) {
      message.error('请先选择项目');
      return;
    }
    if (importData.length === 0) {
      message.error('请先选择要导入的文件');
      return;
    }

    try {
      const result = await dispatch(importRecords({
        projectId: selectedProjectId,
        records: importData,
        mode: importMode,
      })).unwrap();

      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        setConflictModalOpen(true);
      } else {
        setImportedCount(result.inserted.length);
        message.success(`导入成功，共 ${result.inserted.length} 条记录`);
        setImportData([]);
      }
    } catch (err) {
      message.error('导入失败：' + (err as Error).message);
    }
  };

  const handleResolveConflicts = async (action: 'keep-existing' | 'overwrite-existing') => {
    // In a real app, handle per-conflict resolution
    // For now, just proceed with the chosen action
    message.info(`已选择"${action === 'keep-existing' ? '保留现有' : '覆盖现有'}"`);
    setConflictModalOpen(false);
    setConflicts([]);
  };

  return (
    <div>
      {/* Export Section */}
      <Card
        title={<Space><DownloadOutlined /><span>导出营收数据</span></Space>}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Select
              placeholder="选择项目"
              value={selectedProjectId || undefined}
              onChange={setSelectedProjectId}
              style={{ width: 280 }}
              showSearch
              optionFilterProp="label"
              options={projects.map(p => ({
                value: p.id,
                label: `${p.name} (${p.location})`,
              }))}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={['开始日期', '结束日期']}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={loading}
            >
              导出 Excel
            </Button>
          </Space>
          <Text type="secondary">选择项目和日期范围后，导出为 Excel 文件</Text>
        </Space>
      </Card>

      {/* Import Section */}
      <Card
        title={<Space><UploadOutlined /><span>导入营收数据</span></Space>}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Select
              placeholder="选择目标项目"
              value={selectedProjectId || undefined}
              onChange={setSelectedProjectId}
              style={{ width: 280 }}
              showSearch
              optionFilterProp="label"
              options={projects.map(p => ({
                value: p.id,
                label: `${p.name} (${p.location})`,
              }))}
            />
          </Space>

          <Card size="small" style={{ background: 'rgba(0,0,0,0.02)' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>导入模式</Text>
              <Radio.Group value={importMode} onChange={e => setImportMode(e.target.value)}>
                <Radio.Button value="append">追加模式（保留已有数据）</Radio.Button>
                <Radio.Button value="overwrite">覆盖模式（替换相同日期数据）</Radio.Button>
              </Radio.Group>
            </Space>
          </Card>

          <Space>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => fileInputRef.current?.click()}
            >
              选择 Excel 文件
            </Button>
            {importData.length > 0 && (
              <>
                <Tag color="blue">已选择 {importData.length} 条记录</Tag>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleImport}
                  loading={importing}
                  disabled={!selectedProjectId}
                >
                  开始导入
                </Button>
                <Button onClick={() => setImportData([])}>清除</Button>
              </>
            )}
          </Space>

          {importing && <Progress percent={50} status="active" />}

          {importData.length > 0 && (
            <Alert
              message="预览导入数据"
              description={
                <div>
                  <Text>共 {importData.length} 条记录</Text>
                  <Table
                    dataSource={importData.slice(0, 5).map((d, i) => ({ ...d, key: i }))}
                    columns={[
                      { title: '档口', dataIndex: 'stallName' },
                      { title: '日期', dataIndex: 'date' },
                      { title: '时段', dataIndex: 'period' },
                      { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v}` },
                      { title: '订单数', dataIndex: 'orderCount' },
                    ]}
                    pagination={false}
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                  {importData.length > 5 && (
                    <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                      ... 还有 {importData.length - 5} 条记录
                    </Text>
                  )}
                </div>
              }
              type="info"
              style={{ marginTop: 8 }}
            />
          )}
        </Space>
      </Card>

      {/* Conflict Resolution Modal */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            <span>数据冲突</span>
          </Space>
        }
        open={conflictModalOpen}
        onCancel={() => setConflictModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setConflictModalOpen(false)}>取消导入</Button>,
          <Button
            key="keep"
            icon={<CheckCircleOutlined />}
            onClick={() => handleResolveConflicts('keep-existing')}
          >
            保留现有数据
          </Button>,
          <Button
            key="overwrite"
            type="primary"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleResolveConflicts('overwrite-existing')}
          >
            覆盖现有数据
          </Button>,
        ]}
        width={700}
      >
        <Alert
          message={`发现 ${conflicts.length} 条数据冲突`}
          description="同一天同一档口同一时段存在重复数据，请选择处理方式"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Text type="secondary">
          冲突数据涉及：{(conflicts as { stallName?: string; date?: string }[]).map(c => `${c.stallName}(${c.date})`).join('、')}
        </Text>
      </Modal>
    </div>
  );
};

export default DataIOPage;
