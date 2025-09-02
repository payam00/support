'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Table, Button, Modal, Form, Input, Select, Switch, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';

const { TextArea } = Input;
const { Option } = Select;

export default function ManageAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [form] = Form.useForm();
    const { message, notification } = App.useApp();

    const fetchAnnouncements = useCallback(() => {
        setIsLoading(true);
        api.get('/announcements')
            .then(res => setAnnouncements(res.data))
            .catch(() => notification.error({ message: 'خطا در دریافت اطلاعیه‌ها' }))
            .finally(() => setIsLoading(false));
    }, [notification]);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

    const handleModalOpen = (record: any = null) => {
        setEditingAnnouncement(record);
        form.setFieldsValue(record || { title: '', content: '', type: 'info', isActive: true, targetRoles: [] });
        setIsModalVisible(true);
    };

    const handleFormSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            if (editingAnnouncement) {
                await api.put(`/announcements/${editingAnnouncement._id}`, values);
                message.success('اطلاعیه با موفقیت ویرایش شد.');
            } else {
                await api.post('/announcements', values);
                message.success('اطلاعیه جدید با موفقیت ایجاد شد.');
            }
            fetchAnnouncements();
            setIsModalVisible(false);
        } catch (error) { 
            notification.error({ message: 'خطا در ذخیره‌سازی' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/announcements/${id}`);
            message.success('اطلاعیه با موفقیت حذف شد.');
            fetchAnnouncements();
        } catch {
            notification.error({ message: 'خطا در حذف اطلاعیه' });
        }
    };

    const columns = [
        { title: 'عنوان', dataIndex: 'title', key: 'title' },
        { title: 'نقش‌های هدف', dataIndex: 'targetRoles', key: 'targetRoles', render: (roles: string[]) => (
            roles.length > 0 ? roles.map(role => <Tag key={role}>{role}</Tag>) : <Tag>همه</Tag>
        )},
        { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'فعال' : 'غیرفعال'}</Tag> },
        { title: 'تاریخ ایجاد', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => format(new Date(date), 'yyyy/MM/dd')},
        { title: 'عملیات', key: 'action', render: (_:any, record:any) => (
            <Space>
                <Button icon={<EditOutlined />} onClick={() => handleModalOpen(record)}>ویرایش</Button>
                <Popconfirm title="آیا از حذف مطمئن هستید؟" onConfirm={() => handleDelete(record._id)} okText="بله" cancelText="خیر">
                    <Button danger icon={<DeleteOutlined />}>حذف</Button>
                </Popconfirm>
            </Space>
        )}
    ];

    return (
        <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen()} style={{ marginBottom: 16 }}>
                ایجاد اطلاعیه جدید
            </Button>
            <Table loading={isLoading} columns={columns} dataSource={announcements} rowKey="_id" />
            <Modal title={editingAnnouncement ? 'ویرایش اطلاعیه' : 'ایجاد اطلاعیه جدید'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} confirmLoading={isSubmitting}>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    <Form.Item name="title" label="عنوان" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="content" label="محتوا (از تگ‌های HTML می‌توانید استفاده کنید)" rules={[{ required: true }]}><TextArea rows={6} /></Form.Item>
                    <Form.Item name="type" label="نوع اطلاعیه" rules={[{ required: true }]}>
                        <Select>
                            <Option value="info">اطلاع‌رسانی (آبی)</Option>
                            <Option value="success">موفقیت (سبز)</Option>
                            <Option value="warning">هشدار (نارنجی)</Option>
                            <Option value="error">خطا (قرمز)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="targetRoles" label="نمایش برای نقش‌های (خالی گذاشتن = نمایش برای همه)">
                        <Select mode="multiple" allowClear placeholder="نقش‌های مورد نظر را انتخاب کنید">
                            <Option value="user">User</Option>
                            <Option value="operator">Operator</Option>
                            <Option value="department_head">Department Head</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="isActive" label="فعال باشد" valuePropName="checked"><Switch /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}