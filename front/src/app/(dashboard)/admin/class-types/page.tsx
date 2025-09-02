'use client';

import React, { useState, useEffect } from 'react';
import { App, Table, Button, Modal, Form, Input, InputNumber, Switch, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { getClassTypes, createClassType, updateClassType } from '@/lib/api';

const { TextArea } = Input;

export default function ManageClassTypesPage() {
    const [classTypes, setClassTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingClassType, setEditingClassType] = useState<any>(null);
    const [form] = Form.useForm();
    const { message, notification } = App.useApp();

    const fetchClassTypes = () => {
        setIsLoading(true);
        getClassTypes()
            .then(res => setClassTypes(res.data))
            .catch(() => notification.error({ message: 'خطا در دریافت لیست کلاس‌ها' }))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchClassTypes();
    }, []);

    const handleModalOpen = (record: any = null) => {
        setEditingClassType(record);
        form.setFieldsValue(record || { name: '', price: 0, termsAndConditions: '', isActive: true });
        setIsModalVisible(true);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingClassType(null);
        form.resetFields();
    };

    const handleFormSubmit = async (values: any) => {
        try {
            if (editingClassType) {
                await updateClassType(editingClassType._id, values);
                message.success('نوع کلاس با موفقیت ویرایش شد.');
            } else {
                await createClassType(values);
                message.success('نوع کلاس جدید با موفقیت ایجاد شد.');
            }
            fetchClassTypes();
            handleModalCancel();
        } catch (error: any) {
            notification.error({ message: 'خطا در ذخیره‌سازی', description: error.response?.data?.message });
        }
    };

    const columns = [
        { title: 'نام کلاس', dataIndex: 'name', key: 'name' },
        { title: 'قیمت (ریال)', dataIndex: 'price', key: 'price', render: (price: number) => price.toLocaleString() },
        { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => isActive ? 'فعال' : 'غیرفعال' },
        {
            title: 'عملیات', key: 'action', render: (_: any, record: any) => (
                <Button icon={<EditOutlined />} onClick={() => handleModalOpen(record)}>ویرایش</Button>
            ),
        },
    ];

    return (
        <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleModalOpen()} style={{ marginBottom: 16 }}>
                ایجاد نوع کلاس جدید
            </Button>
            <Table loading={isLoading} columns={columns} dataSource={classTypes} rowKey="_id" />

            <Modal
                title={editingClassType ? 'ویرایش نوع کلاس' : 'ایجاد نوع کلاس جدید'}
                open={isModalVisible}
                onCancel={handleModalCancel}
                onOk={() => form.submit()}
                confirmLoading={isLoading}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    <Form.Item name="name" label="نام کلاس" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="price" label="قیمت (ریال)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                    <Form.Item name="termsAndConditions" label="قوانین و مقررات" rules={[{ required: true }]}>
                        <TextArea rows={6} />
                    </Form.Item>
                    <Form.Item name="isActive" label="فعال" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}