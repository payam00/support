'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Button, Table, Modal, Form, Input,Tag, Select, Spin, Popconfirm, Typography, Switch, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { VideoFlow } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function ManageVideoFlowsPage() {
    const [flows, setFlows] = useState<VideoFlow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingFlow, setEditingFlow] = useState<VideoFlow | null>(null);
    const [form] = Form.useForm();
    const { message, notification } = App.useApp();

    const fetchFlows = useCallback(() => {
        setIsLoading(true);
        api.get('/admin/video-flows')
            .then(res => setFlows(res.data))
            .catch(() => notification.error({ message: 'خطا در دریافت لیست فلوها' }))
            .finally(() => setIsLoading(false));
    }, [notification]);

    useEffect(() => {
        fetchFlows();
    }, [fetchFlows]);

    const showModal = (flow: VideoFlow | null = null) => {
        setEditingFlow(flow);
        const formValues = flow ? {
            ...flow,
            questions: flow.questions.map(q => ({ text: q.text, nextFlow: q.nextFlow }))
        } : {};
        form.setFieldsValue(formValues);
        setIsModalVisible(true);
    };

    const handleFormSubmit = async (values: any) => {
        const apiCall = editingFlow
            ? api.put(`/admin/video-flows/${editingFlow._id}`, values)
            : api.post('/admin/video-flows', values);
        
        try {
            await apiCall;
            message.success(`مرحله با موفقیت ${editingFlow ? 'ویرایش' : 'ایجاد'} شد.`);
            fetchFlows();
            setIsModalVisible(false);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        }
    };

    const handleDelete = async (flowId: string) => {
        try {
            await api.delete(`/admin/video-flows/${flowId}`);
            message.success('مرحله با موفقیت حذف شد.');
            fetchFlows();
        } catch (error: any) { // <-- آکولادهای جا افتاده در اینجا اصلاح شد
            notification.error({ message: 'خطا در حذف مرحله', description: error.response?.data?.message });
        }
    };

    const columns: ColumnsType<VideoFlow> = [
        { title: 'نام مرحله', dataIndex: 'name', key: 'name' },
        { title: 'نقطه شروع (Root)', dataIndex: 'isRoot', key: 'isRoot', render: (isRoot: boolean) => isRoot ? <Tag color="green">بله</Tag> : <Tag>خیر</Tag> },
        { title: 'تعداد سوالات', dataIndex: 'questions', key: 'questions', render: (q: any[]) => q.length },
        {
            title: 'عملیات', key: 'action', render: (_, record: VideoFlow) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => showModal(record)}>ویرایش</Button>
                    <Popconfirm title="آیا مطمئن هستید؟" onConfirm={() => handleDelete(record._id)} okText="بله" cancelText="خیر">
                        <Button icon={<DeleteOutlined />} danger>حذف</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Spin spinning={isLoading}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>مدیریت ویجت ویدیو</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>ایجاد مرحله جدید</Button>
            </div>
            <Table columns={columns} dataSource={flows} rowKey="_id" scroll={{ x: true }} />

            <Modal
                title={editingFlow ? 'ویرایش مرحله' : 'ایجاد مرحله جدید'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }} initialValues={{ questions: [{}]}}>
                    <Form.Item name="name" label="نام مرحله (برای شناسایی)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="videoUrl" label="آدرس URL ویدیو" rules={[{ required: true, type: 'url' }]}>
                        <Input placeholder="https://example.com/video.mp4" />
                    </Form.Item>
                     <Form.Item name="previewVideoUrl" label="آدرس URL ویدیو پیش‌نمایش (اختیاری برای Root)">
                        <Input placeholder="https://example.com/preview.mp4" />
                    </Form.Item>
                    <Form.Item name="isRoot" label="آیا این مرحله، نقطه شروع ویجت است؟" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <hr style={{margin: '24px 0'}}/>
                    <Title level={5}>سوالات بعد از ویدیو</Title>
                    <Text type='secondary'>اگر سوالی تعریف نکنید، دکمه‌های تماس و مشاوره (در صورت فعال بودن) نمایش داده می‌شوند.</Text>
                    <Form.List name="questions">
                        {(fields, { add, remove }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, maxHeight: '30vh', overflowY: 'auto', padding: '8px' }}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', alignItems: 'baseline' }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'text']} rules={[{ required: true, message: 'متن سوال الزامی است' }]} style={{ width: 300 }}>
                                            <Input placeholder="متن سوال روی دکمه" />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'nextFlow']} rules={[{ required: true, message: 'مرحله بعدی الزامی است' }]} style={{ width: 300 }}>
                                            <Select placeholder="انتخاب مرحله بعدی">
                                                {flows
                                                    .filter((f: VideoFlow) => f._id !== editingFlow?._id)
                                                    .map((f: VideoFlow) => (
                                                        <Select.Option key={f._id} value={f._id}>{f.name}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        افزودن سوال
                                    </Button>
                                </Form.Item>
                            </div>
                        )}
                    </Form.List>
                    <hr style={{margin: '24px 0'}}/>
                    <Title level={5}>دکمه‌های اقدام به عمل (Call to Action)</Title>
                    <Form.Item name="ctaPhoneNumber" label="شماره تماس (اختیاری)">
                        <Input placeholder="02188888888" />
                    </Form.Item>
                    <Form.Item name="ctaFormEnabled" label="فرم درخواست مشاوره فعال باشد؟" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit">ذخیره</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Spin>
    );
}