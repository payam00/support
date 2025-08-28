'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Button, Table, Modal, Form, Input, Select, Spin, Popconfirm, Typography, List } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { Department, UserInfo, Faq } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export default function ManageDepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- State for Department Modal ---
    const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptForm] = Form.useForm();
    
    // --- State for FAQ Management Modals ---
    const [isFaqListModalVisible, setIsFaqListModalVisible] = useState(false);
    const [selectedDeptForFaq, setSelectedDeptForFaq] = useState<Department | null>(null);
    const [isFaqFormModalVisible, setIsFaqFormModalVisible] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
    const [faqForm] = Form.useForm();
    
    const { message, notification } = App.useApp();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [deptsRes, usersRes] = await Promise.all([api.get('/departments'), api.get('/admin/users')]);
            setDepartments(deptsRes.data);
            setUsers(usersRes.data.filter((u: UserInfo) => u.role !== 'operator'));
        } catch (error) {
            notification.error({ message: 'خطا در دریافت اطلاعات' });
        } finally {
            setIsLoading(false);
        }
    }, [notification]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Department Handlers ---
    const showDeptModal = (dept: Department | null = null) => {
        setEditingDept(dept);
        deptForm.setFieldsValue(dept ? { name: dept.name, head: dept.head?._id } : {});
        setIsDeptModalVisible(true);
    };

    const handleDeptFormSubmit = async (values: { name: string, head: string }) => {
        try {
            if (editingDept) {
                await api.put(`/departments/${editingDept._id}`, values);
                message.success('دپارتمان با موفقیت ویرایش شد.');
            } else {
                await api.post('/departments', values);
                message.success('دپارتمان با موفقیت ایجاد شد.');
            }
            fetchData();
            setIsDeptModalVisible(false);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        }
    };
    
    const handleDeptDelete = async (deptId: string) => {
        try {
            await api.delete(`/departments/${deptId}`);
            message.success('دپارتمان با موفقیت حذف شد.');
            fetchData();
        } catch (error: any) {
            notification.error({ message: 'خطا در حذف دپارتمان', description: error.response?.data?.message });
        }
    };
    
    // --- FAQ Handlers ---
    const openFaqManager = (dept: Department) => {
        setSelectedDeptForFaq(dept);
        setIsFaqListModalVisible(true);
    };

    const showFaqFormModal = (faq: Faq | null = null) => {
        setEditingFaq(faq);
        faqForm.setFieldsValue(faq ? { question: faq.question, answer: faq.answer } : { question: '', answer: '' });
        setIsFaqFormModalVisible(true);
    };

    const handleFaqFormSubmit = async (values: { question: string, answer: string }) => {
        if (!selectedDeptForFaq) return;
        
        const apiCall = editingFaq
            ? api.put(`/departments/${selectedDeptForFaq._id}/faqs/${editingFaq._id}`, values)
            : api.post(`/departments/${selectedDeptForFaq._id}/faqs`, values);

        try {
            await apiCall;
            message.success(`سوال متداول با موفقیت ${editingFaq ? 'ویرایش' : 'ذخیره'} شد.`);
            await fetchData(); // Fetch all data again to get the latest state
            setIsFaqFormModalVisible(false);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        }
    };
    
    const handleFaqDelete = async (faqId: string) => {
        if (!selectedDeptForFaq) return;
        try {
            await api.delete(`/departments/${selectedDeptForFaq._id}/faqs/${faqId}`);
            message.success('سوال متداول حذف شد.');
            await fetchData();
        } catch (error: any) {
             notification.error({ message: 'خطا در حذف سوال', description: error.response?.data?.message });
        }
    };

    // Update selected department state after data refresh
    useEffect(() => {
        if (selectedDeptForFaq) {
            const updatedDept = departments.find(d => d._id === selectedDeptForFaq._id);
            setSelectedDeptForFaq(updatedDept || null);
        }
    }, [departments, selectedDeptForFaq]);

    const columns: ColumnsType<Department> = [
        { title: 'نام دپارتمان', dataIndex: 'name', key: 'name' },
        { title: 'مدیر دپارتمان', dataIndex: ['head', 'name'], key: 'head', render: (name) => name || 'تعیین نشده' },
        { title: 'تعداد FAQ', dataIndex: 'faqs', key: 'faqs', render: (faqs: any[]) => faqs?.length || 0 },
        {
            title: 'عملیات', key: 'action', render: (_: any, record: Department) => (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button icon={<EditOutlined />} onClick={() => showDeptModal(record)}>ویرایش</Button>
                    <Button icon={<QuestionCircleOutlined />} onClick={() => openFaqManager(record)}>مدیریت FAQ</Button>
                    <Popconfirm title="تمام تیکت‌های این دپارتمان نیز حذف می‌شوند! آیا مطمئن هستید؟" onConfirm={() => handleDeptDelete(record._id)} okText="بله، حذف کن" cancelText="خیر">
                        <Button icon={<DeleteOutlined />} danger>حذف</Button>
                    </Popconfirm>
                </div>
            )
        },
    ];

    return (
        <Spin spinning={isLoading}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>مدیریت دپارتمان‌ها</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showDeptModal()}>ایجاد دپارتمان جدید</Button>
            </div>
            <Table columns={columns} dataSource={departments} rowKey="_id" scroll={{ x: true }} />

            <Modal title={editingDept ? 'ویرایش دپارتمان' : 'ایجاد دپارتمان'} open={isDeptModalVisible} onCancel={() => setIsDeptModalVisible(false)} footer={null}>
                <Form form={deptForm} layout="vertical" onFinish={handleDeptFormSubmit} style={{ marginTop: 24 }}>
                    <Form.Item name="name" label="نام دپارتمان" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="head" label="مدیر دپارتمان" rules={[{ required: true }]}>
                        <Select showSearch placeholder="جستجوی کاربر..." optionFilterProp="children"
                            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            options={users.map(user => ({ value: user._id, label: user.name || user.mobileNumber }))} />
                    </Form.Item>
                    <Form.Item
            name="knowledgeBaseText"
            label="دانش متنی برای هوش مصنوعی (اختیاری)"
            tooltip="متن کلی در مورد این دپارتمان که به هوش مصنوعی برای پاسخ‌دهی بهتر کمک می‌کند."
        >
            <Input.TextArea
                rows={8}
                placeholder="اطلاعات کلی، لینک‌های مفید، قوانین و مقررات و... را در اینجا وارد کنید."
            />
        </Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit">ذخیره</Button></Form.Item>
                </Form>
            </Modal>

            <Modal title={`مدیریت سوالات متداول: ${selectedDeptForFaq?.name}`} open={isFaqListModalVisible} onCancel={() => setIsFaqListModalVisible(false)} footer={null} width={800}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showFaqFormModal()} style={{ marginBottom: 16, marginTop: 24 }}>افزودن سوال جدید</Button>
                <List bordered dataSource={selectedDeptForFaq?.faqs}
                    renderItem={(faq) => (
                        <List.Item
                            actions={[
                                <Button key="edit" icon={<EditOutlined />} onClick={() => showFaqFormModal(faq)}>ویرایش</Button>,
                                <Popconfirm key="delete" title="آیا از حذف این سوال مطمئن هستید؟" onConfirm={() => handleFaqDelete(faq._id)}><Button icon={<DeleteOutlined />} danger>حذف</Button></Popconfirm>
                            ]}>
                            <List.Item.Meta title={faq.question} description={faq.answer} />
                        </List.Item>
                    )} />
            </Modal>

            <Modal title={editingFaq ? 'ویرایش سوال' : 'افزودن سوال'} open={isFaqFormModalVisible} onCancel={() => setIsFaqFormModalVisible(false)} footer={null} destroyOnClose>
                <Form form={faqForm} onFinish={handleFaqFormSubmit} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item name="question" label="سوال" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="answer" label="پاسخ" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit">ذخیره</Button></Form.Item>
                </Form>
            </Modal>
        </Spin>
    );
}