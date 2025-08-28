'use client';

import React, { useState, useEffect } from 'react';
import { App, Form, Input, Button,Modal,Space, Select, InputNumber, Card, Typography, Spin } from 'antd';
import { createInvoice, getClassTypes } from '@/lib/api';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { WhatsAppOutlined, MessageOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

export default function CreateInvoicePage() {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [classTypes, setClassTypes] = useState<any[]>([]);
    const [selectedClassPrice, setSelectedClassPrice] = useState<number | null>(null);
    const { message, notification } = App.useApp();
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<any>(null);
    const [isSending, setIsSending] = useState(false);
    useEffect(() => {
        setIsLoading(true);
        getClassTypes()
            .then(res => setClassTypes(res.data))
            .catch(() => notification.error({ message: 'خطا در دریافت انواع کلاس' }))
            .finally(() => setIsLoading(false));
    }, [notification]);

    const handleClassChange = (value: string) => {
        const selected = classTypes.find(ct => ct._id === value);
        if (selected) {
            form.setFieldsValue({ amount: selected.price });
        }
    };
      const onFinish = async (values: any) => {
        setIsLoading(true);
        try {
            const res = await createInvoice(values);
            setCreatedInvoice(res.data.invoice);
            setIsModalVisible(true);
            form.resetFields();
        } catch (error: any) {
            notification.error({ message: 'خطا در صدور فاکتور', description: error.response?.data?.message });
        } finally {
            setIsLoading(false);
        }
    };
     const handleSendWhatsapp = () => {
        if (!createdInvoice) return;
        const link = `http://site/?token=${createdInvoice.uniqueToken}`; // Replace 'site' with your actual domain
        const text = `زبان آموز گرامی\nلینک پرداخت شما:\n${link}\nموسسه زبان آفاق`;
        const url = `https://wa.me/${createdInvoice.mobileNumber.replace('0', '+98')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };
        const handleSendSms = async () => {
        if (!createdInvoice) return;
        setIsSending(true);
        try {
            // checkCooldown: true is for the 1-hour limit
            const res = await api.post(`/invoices/${createdInvoice._id}/send-sms`, { checkCooldown: true });
            message.success(res.data.message);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        } finally {
            setIsSending(false);
        }
    };
      const handleModalClose = () => {
        setIsModalVisible(false);
        setCreatedInvoice(null);
        router.push('/invoices'); // Redirect after closing the modal
    };
    
    return (
        <Card>
            <Title level={4}>صدور فاکتور جدید</Title>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ nationality: 'iranian' }}>
                <Form.Item name="fullName" label="نام و نام خانوادگی" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="mobileNumber" label="شماره تلفن همراه" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="nationality" label="ملیت" rules={[{ required: true }]}>
                    <Select>
                        <Option value="iranian">ایرانی</Option>
                        <Option value="foreign">اتباع</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.nationality !== currentValues.nationality}
                >
                    {({ getFieldValue }) =>
                        getFieldValue('nationality') === 'iranian' ? (
                            <Form.Item name="nationalId" label="کد ملی" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        ) : null
                    }
                </Form.Item>
                <Form.Item name="classTypeId" label="نوع کلاس" rules={[{ required: true }]}>
                    <Select placeholder="انتخاب کنید..." onChange={handleClassChange} loading={isLoading}>
                        {classTypes.map(ct => <Option key={ct._id} value={ct._id}>{ct.name}</Option>)}
                    </Select>
                </Form.Item>
                 <Form.Item name="amount" label="مبلغ (ریال)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading}>
                        صدور فاکتور
                    </Button>
                </Form.Item>
            </Form>
            <Modal
                title="فاکتور با موفقیت صادر شد"
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={[
                    <Button key="close" onClick={handleModalClose}>
                        بستن و بازگشت به لیست
                    </Button>
                ]}
            >
                <p>لینک پرداخت را برای مشتری ارسال کنید:</p>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                        type="primary" 
                        icon={<MessageOutlined />} 
                        onClick={handleSendSms} 
                        loading={isSending}
                        block
                    >
                        ارسال لینک با پیامک
                    </Button>
                    <Button 
                        style={{ background: '#25D366', color: 'white' }} 
                        icon={<WhatsAppOutlined />} 
                        onClick={handleSendWhatsapp}
                        block
                    >
                        ارسال لینک با واتساپ
                    </Button>
                </Space>
            </Modal>
        </Card>
        
    );
}