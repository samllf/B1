import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Button, Input, Space, Tag, Modal, Form, DatePicker,
  Select, Card, message, Popconfirm, Typography, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, CheckCircleOutlined, PauseCircleOutlined,
  SyncOutlined, MinusCircleOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { RootState, AppDispatch } from '../../store';
import { fetchProjects, createProject, updateProject, deleteProject, setSelectedProject, setKeyword, setPage } from '../../store/projectSlice';
import { setActivePage } from '../../store/uiSlice';
import { validateProjectForm } from '../../utils/validation';
import type { Project } from '../../types';

const { Text } = Typography;
const { Option } = Select;

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  active: { color: 'green', icon: <PlayCircleOutlined />, label: '进行中' },
  completed: { color: 'blue', icon: <CheckCircleOutlined />, label: '已完成' },
  paused: { color: 'orange', icon: <PauseCircleOutlined />, label: '已暂停' },
};

const ProjectsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, total, currentPage, pageSize, keyword, selectedProject, loading, submitting } =
    useSelector((state: RootState) => state.projects);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchText, setSearchText] = useState(keyword);
  const [form] = Form.useForm();

  const loadData = useCallback(() => {
    dispatch(fetchProjects({ page: currentPage, pageSize, keyword }));
  }, [dispatch, currentPage, pageSize, keyword]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    dispatch(setKeyword(searchText));
    dispatch(setPage(1));
  };

  const handleReset = () => {
    setSearchText('');
    dispatch(setKeyword(''));
    dispatch(setPage(1));
  };

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', date: dayjs() });
    setModalOpen(true);
  };

  const handleEdit = (record: Project) => {
    setEditingProject(record);
    form.setFieldsValue({
      name: record.name,
      location: record.location,
      date: dayjs(record.date),
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteProject(id)).unwrap().then(() => {
      message.success('删除成功');
      loadData();
    }).catch(err => message.error(err));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const errors = validateProjectForm(values);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([_, msg]) => message.error(msg));
        return;
      }

      const data = {
        name: values.name,
        location: values.location,
        date: values.date.format('YYYY-MM-DD'),
        status: values.status,
      };

      if (editingProject) {
        await dispatch(updateProject({ id: editingProject.id, data })).unwrap();
        message.success('更新成功');
      } else {
        await dispatch(createProject(data)).unwrap();
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch {
      // Form validation failed
    }
  };

  const handleSelectProject = (record: Project) => {
    dispatch(setSelectedProject(record));
    dispatch(setActivePage('dashboard'));
  };

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => handleSelectProject(record)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status] || { color: 'default', icon: <MinusCircleOutlined />, label: status };
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看看板">
            <Button size="small" type="link" icon={<SearchOutlined />} onClick={() => handleSelectProject(record)}>
              看板
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description={`确定要删除项目"${record.name}"吗？此操作不可恢复。`}
            onConfirm={() => handleDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button size="small" type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <Input.Search
              placeholder="搜索项目名称..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 250 }}
              allowClear
              enterButton={<SearchOutlined />}
            />
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建项目
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: false,
            onChange: (page) => {
              dispatch(setPage(page));
              dispatch(fetchProjects({ page, pageSize, keyword }));
            },
          }}
          locale={{ emptyText: '暂无项目数据，点击"新建项目"开始' }}
        />
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={editingProject ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="如：科技园A区食堂" />
          </Form.Item>
          <Form.Item
            name="location"
            label="地点"
            rules={[{ required: true, message: '请输入地点' }]}
          >
            <Input placeholder="如：深圳" />
          </Form.Item>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="active">进行中</Option>
              <Option value="paused">已暂停</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
