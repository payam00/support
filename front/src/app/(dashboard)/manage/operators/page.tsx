'use client';

import React, { useState, useEffect } from 'react';
import { App, Button, Table, Typography, Spin, Popconfirm, Modal, Form, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { UserInfo } from '@/types';

const { Title, Text } = Typography;

interface DepartmentDetails {
  _id: string;
  name: string;
  operators: UserInfo[];
}

export default function ManageOperatorsPage() {
  const [department, setDepartment] = useState<DepartmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  const fetchMyDepartment = () => {
    setIsLoading(true);
    api.get('/departments/my-department')
      .then(res => setDepartment(res.data))
      .catch(() => notification.error({ message: 'خطا', description: 'شما مدیر هیچ دپارتمانی نیستید یا خطایی رخ داده است.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchMyDepartment, []);

  const handleAddOperator = async (values: { mobileNumber: string }) => {
    try {
      // Backend expects userId, but we can propose a backend change to accept mobileNumber.
      // For now, let's assume backend is updated to find user by mobile.
      await api.post(`/departments/${department?._id}/operators`, values);
      message.success('اپراتور با موفقیت اضافه شد.');
      fetchMyDepartment(); // Refresh data
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      notification.error({ message: 'خطا در افزودن اپراتور', description: error.response?.data?.message });
    }
  };

  const handleRemoveOperator = async (operatorId: string) => {
    try {
      await api.delete(`/departments/${department?._id}/operators/${operatorId}`);
      message.success('اپراتور با موفقیت حذف شد.');
      fetchMyDepartment(); // Refresh data
    } catch (error: any) {
      notification.error({ message: 'خطا در حذف اپراتور', description: error.response?.data?.message });
    }
  };

  const columns: ColumnsType<UserInfo> = [
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'شماره موبایل', dataIndex: 'mobileNumber', key: 'mobileNumber' },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="آیا از حذف این اپراتور مطمئن هستید؟"
          onConfirm={() => handleRemoveOperator(record._id)}
          okText="بله"
          cancelText="خیر"
        >
          <Button icon={<DeleteOutlined />} danger>حذف</Button>
        </Popconfirm>
      ),
    },
  ];

  if (isLoading) return <Spin fullscreen />;
  if (!department) return <Text>شما دسترسی به این بخش را ندارید.</Text>;

  return (
    <div>
      <Title level={3}>مدیریت اپراتورهای دپارتمان: {department.name}</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ marginBottom: 16 }}>
        افزودن اپراتور جدید
      </Button>
      <Table columns={columns} dataSource={department.operators} rowKey="_id" />

      <Modal
        title="افزودن اپراتور جدید"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOperator} layout="vertical">
          <Form.Item name="mobileNumber" label="شماره موبایل کاربر" rules={[{ required: true, message: 'لطفا شماره موبایل را وارد کنید' }]}>
            <Input placeholder="کاربری که می‌خواهید به اپراتور تبدیل شود را وارد کنید" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">افزودن</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}