'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Table, Tag, Button, Modal, Form, Select, Spin, Typography, Input, Switch, Space } from 'antd';
import { EditOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { UserInfo } from '@/types'; // فرض می‌شود تایپ UserInfo شامل فیلد permissions است

const { Title } = Typography;

export default function ManageUsersPage() {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);

    const [editForm] = Form.useForm();
    const [addForm] = Form.useForm();
    const { message, notification } = App.useApp();

    const fetchUsers = useCallback(() => {
        setIsLoading(true);
        api.get('/admin/users')
            .then(res => setUsers(res.data))
            .catch(err => notification.error({ message: 'خطا در دریافت لیست کاربران' }))
            .finally(() => setIsLoading(false));
    }, [notification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Handlers for Edit Modal ---
    const showEditModal = (user: UserInfo) => {
        setEditingUser(user);
        editForm.setFieldsValue({
            role: user.role,
            name: user.name,
            canCreateInvoice: user.permissions?.canCreateInvoice || false,
            canViewAllInvoices: user.permissions?.canViewAllInvoices || false,
        });
        setIsEditModalVisible(true);
    };

    const handleUpdateUser = async (values: any) => {
        if (!editingUser) return;
        setIsSubmitting(true);

        const payload = {
            name: values.name,
            role: values.role,
            permissions: {
                canCreateInvoice: values.canCreateInvoice,
                canViewAllInvoices: values.canViewAllInvoices
            }
        };

        try {
            await api.put(`/admin/users/${editingUser._id}`, payload);
            message.success('اطلاعات کاربر با موفقیت تغییر کرد.');
            fetchUsers();
            setIsEditModalVisible(false);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Handlers for Add Modal ---
    const showAddModal = () => {
        addForm.resetFields();
        setIsAddModalVisible(true);
    };

    const handleAddUser = async (values: { mobileNumber: string, name: string }) => {
        setIsSubmitting(true);
        try {
            await api.post('/admin/users', values);
            message.success('کاربر با موفقیت اضافه شد.');
            fetchUsers();
            setIsAddModalVisible(false);
        } catch (error: any) {
            notification.error({ message: 'خطا در افزودن کاربر', description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const columns: ColumnsType<UserInfo> = [
        { title: 'نام', dataIndex: 'name', key: 'name', render: (name: string) => name || '-' },
        { title: 'شماره موبایل', dataIndex: 'mobileNumber', key: 'mobileNumber' },
        { title: 'نقش', dataIndex: 'role', key: 'role', render: (role: string) => <Tag>{role}</Tag> },
        {
            title: 'عملیات', key: 'action', render: (_: any, record: UserInfo) => (
                <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>ویرایش</Button>
            )
        },
    ];

    return (
        <Spin spinning={isLoading}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <Title level={3} style={{ margin: 0 }}>مدیریت کاربران</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                    افزودن کاربر
                </Button>
            </div>
            <Table columns={columns} dataSource={users} rowKey="_id" style={{ marginTop: 24 }} scroll={{ x: true }} />
            
            {/* --- Modal for Editing User (Updated with Permissions) --- */}
            <Modal
                title={`ویرایش کاربر: ${editingUser?.name || editingUser?.mobileNumber}`}
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                footer={null}
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateUser} style={{ marginTop: 24 }}>
                    <Form.Item name="name" label="نام و نام خانوادگی" rules={[{ required: true, message: 'نام الزامی است.' }]}>
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item name="role" label="نقش" rules={[{ required: true }]}>
                        <Select loading={isSubmitting}>
                            <Select.Option value="user">User</Select.Option>
                            <Select.Option value="operator">Operator</Select.Option>
                            <Select.Option value="department_head">Department Head</Select.Option>
                            <Select.Option value="admin">Admin</Select.Option>
                        </Select>
                    </Form.Item>
                    
                    <Title level={5}>مجوزهای فاکتور</Title>
                    
                    <Form.Item name="canCreateInvoice" label="مجوز صدور فاکتور" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    
                    <Form.Item name="canViewAllInvoices" label="مجوز مشاهده همه فاکتورها" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    
                    <Form.Item style={{marginTop: '24px'}}>
                        <Button type="primary" htmlType="submit" loading={isSubmitting}>ذخیره تغییرات</Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* --- Modal for Adding User (Unchanged) --- */}
            <Modal title="افزودن کاربر جدید" open={isAddModalVisible} onCancel={() => setIsAddModalVisible(false)} footer={null}>
                 <Form form={addForm} layout="vertical" onFinish={handleAddUser} style={{ marginTop: 24 }}>
                    <Form.Item name="name" label="نام و نام خانوادگی" rules={[{ required: true, message: 'نام الزامی است.' }]}>
                        <Input placeholder="مثال: علی رضایی" prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item name="mobileNumber" label="شماره موبایل کاربر" rules={[{ required: true, message: 'شماره موبایل الزامی است.' }, { pattern: /^09\d{9}$/, message: 'فرمت شماره موبایل صحیح نیست.' }]}>
                        <Input placeholder="09123456789" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isSubmitting}>افزودن</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Spin>
    );
}