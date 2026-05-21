import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card, Button, Input, InputNumber, Space, Table, message,
  Typography, Popconfirm, Empty, Select, Form, Row, Col, Alert,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SaveOutlined,
  ArrowLeftOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { RootState, AppDispatch } from '../../store';
import { batchCreateRevenue } from '../../store/revenueSlice';
import { fetchProjects } from '../../store/projectSlice';
import { setActivePage } from '../../store/uiSlice';
import { setHasUnsavedChanges } from '../../store/uiSlice';
import { validateRevenueEntries } from '../../utils/validation';
import type { RevenueEntry, Project } from '../../types';

const { Text } = Typography;

const emptyEntry = (): RevenueEntry => ({
  stallName: '',
  breakfastAmount: 0, breakfastOrders: 0,
  lunchAmount: 0, lunchOrders: 0,
  dinnerAmount: 0, dinnerOrders: 0,
  supperAmount: 0, supperOrders: 0,
  takeoutAmount: 0, takeoutOrders: 0,
});

const RevenueEntryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.projects);
  const { submitting } = useSelector((state: RootState) => state.revenue);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [entries, setEntries] = useState<RevenueEntry[]>([emptyEntry()]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setHasUnsavedChanges(entries.some(e => e.stallName.trim() !== '' || hasAnyValue(e))));
  }, [entries, dispatch]);

  const hasAnyValue = (entry: RevenueEntry): boolean => {
    const fields: (keyof RevenueEntry)[] = [
      'breakfastAmount', 'breakfastOrders', 'lunchAmount', 'lunchOrders',
      'dinnerAmount', 'dinnerOrders', 'supperAmount', 'supperOrders',
      'takeoutAmount', 'takeoutOrders',
    ];
    return fields.some(f => entry[f] > 0);
  };

  const addRow = () => {
    setEntries([...entries, emptyEntry()]);
    setSubmitted(false);
  };

  const removeRow = (index: number) => {
    if (entries.length <= 1) {
      message.warning('至少保留一行');
      return;
    }
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    const newErrors = { ...errors };
    delete newErrors[index];
    // Re-index errors
    const reindexed: Record<number, Record<string, string>> = {};
    Object.entries(newErrors).forEach(([key, val]) => {
      const numKey = parseInt(key);
      if (numKey > index) {
        reindexed[numKey - 1] = val;
      } else {
        reindexed[numKey] = val;
      }
    });
    setErrors(reindexed);
  };

  const updateEntry = (index: number, field: keyof RevenueEntry, value: string | number) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      message.error('请先选择项目');
      return;
    }

    const validationErrors = validateRevenueEntries(entries);
    if (validationErrors.length > 0) {
      const errMap: Record<number, Record<string, string>> = {};
      validationErrors.forEach(err => {
        if (err.row >= 0) {
          if (!errMap[err.row]) errMap[err.row] = {};
          errMap[err.row][err.field] = err.message;
        }
      });
      setErrors(errMap);
      message.error('请检查表单中的错误');
      return;
    }

    try {
      await dispatch(batchCreateRevenue({
        projectId: selectedProjectId,
        entries: entries.filter(e => e.stallName.trim() !== ''),
      })).unwrap();
      message.success('营收录入成功！');
      setSubmitted(true);
      setEntries([emptyEntry()]);
      setErrors({});
      dispatch(setHasUnsavedChanges(false));
    } catch (err) {
      message.error('录入失败：' + (err as Error).message);
    }
  };

  const columns = [
    {
      title: '档口名称',
      dataIndex: 'stallName',
      key: 'stallName',
      width: 140,
      render: (_: string, _record: RevenueEntry, index: number) => (
        <Input
          placeholder="如：川味轩"
          value={entries[index]?.stallName || ''}
          onChange={e => updateEntry(index, 'stallName', e.target.value)}
          status={errors[index]?.stallName ? 'error' : undefined}
        />
      ),
    },
    ...([
      ['breakfast', '早餐'],
      ['lunch', '午餐'],
      ['dinner', '晚餐'],
      ['supper', '夜宵'],
      ['takeout', '外卖'],
    ] as const).map(([key, label]) => ({
      title: label,
      key,
      width: 180,
      render: (_: string, _rec: RevenueEntry, index: number) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <InputNumber
            placeholder="金额"
            min={0}
            value={entries[index]?.[`${key}Amount` as keyof RevenueEntry] as number}
            onChange={v => updateEntry(index, `${key}Amount` as keyof RevenueEntry, v || 0)}
            style={{ width: 85 }}
            size="small"
            formatter={value => `¥ ${value}`}
          />
          <InputNumber
            placeholder="订单"
            min={0}
            value={entries[index]?.[`${key}Orders` as keyof RevenueEntry] as number}
            onChange={v => updateEntry(index, `${key}Orders` as keyof RevenueEntry, v || 0)}
            style={{ width: 70 }}
            size="small"
            suffix="单"
          />
        </div>
      ),
    })),
    {
      title: '操作',
      key: 'actions',
      width: 70,
      render: (_: string, _rec: RevenueEntry, index: number) => (
        <Popconfirm
          title="确认删除此条记录？"
          onConfirm={() => removeRow(index)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => dispatch(setActivePage('dashboard'))}>
              返回看板
            </Button>
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
          </Space>
          <Space>
            <Button onClick={addRow} icon={<PlusOutlined />}>添加行</Button>
            <Button onClick={() => { setEntries([emptyEntry()]); setErrors({}); }}>
              清空
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedProjectId}
            >
              批量提交
            </Button>
          </Space>
        </Space>
      </Card>

      {Object.keys(errors).length > 0 && (
        <Alert
          message="表单验证错误"
          description="请修正以下行的错误后重新提交"
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={`营收录入 (共 ${entries.length} 条)`}
        extra={<Text type="secondary">请输入各档口各时段的营收金额和订单数</Text>}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={entries.map((e, i) => ({ ...e, key: i }))}
            columns={columns}
            pagination={false}
            scroll={{ x: 1100 }}
            size="small"
            locale={{ emptyText: <Empty description="点击'添加行'开始录入" /> }}
          />
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedProjectId}
          >
            提交录入 ({entries.filter(e => e.stallName.trim() !== '').length} 条记录)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RevenueEntryPage;
