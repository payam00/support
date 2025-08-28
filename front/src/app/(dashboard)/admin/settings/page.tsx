'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Switch, Typography, Spin, Card, Form, InputNumber, Select, Button, Tabs, Divider } from 'antd';
import api from '@/lib/api';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();
    const { message, notification } = App.useApp();

    const fetchSettings = useCallback(() => {
        setIsLoading(true);
        api.get('/admin/settings')
            .then(res => {
                // Set the form fields with the data fetched from the server
                form.setFieldsValue(res.data);
            })
            .catch(() => {
                notification.error({ message: "خطا در دریافت تنظیمات" });
            })
            .finally(() => setIsLoading(false));
    }, [form, notification]);
    
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleFormSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            // The server returns the complete updated settings object
            const res = await api.put('/admin/settings', values);
            
            // --- FIX: Re-set the form fields with the response from the server ---
            // This ensures the UI is perfectly in sync with the database
            form.setFieldsValue(res.data.settings);
            // -----------------------------------------------------------------

            message.success('تنظیمات با موفقیت ذخیره شد.');
        } catch (error) {
            notification.error({ message: 'خطا در ذخیره تنظیمات' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Spin spinning={isLoading}>
            <Title level={3}>تنظیمات سامانه</Title>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
                <Tabs defaultActiveKey="general">
                    <TabPane tab="تنظیمات عمومی" key="general">
                        <Card>
                            <Form.Item name="publicRegistration" label="فعال‌سازی ثبت‌نام عمومی" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item name="invoiceValidityHours" label="اعتبار پیش‌فاکتور (ساعت)">
                                <InputNumber min={1} style={{width: '100px'}} />
                            </Form.Item>
                        </Card>
                    </TabPane>
                    <TabPane tab="تنظیمات درگاه پرداخت" key="payment">
                        <Card>
                            <Title level={5}>زرین‌پال</Title>
                            <Form.Item name={['paymentGateways', 'zarinpal', 'enabled']} label="فعال‌سازی زرین‌پال" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            
                            <Divider />
                            
                            <Title level={5}>پی‌پینگ</Title>
                            <Form.Item name={['paymentGateways', 'payping', 'enabled']} label="فعال‌سازی پی‌پینگ" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            
                            <Divider />

                            <Title level={5}>استراتژی انتخاب درگاه</Title>
                             <Form.Item name="gatewaySelectionStrategy" label="نحوه انتخاب درگاه برای پرداخت">
                                <Select>
                                    <Select.Option value="random">تصادفی (بین درگاه‌های فعال)</Select.Option>
                                    <Select.Option value="zarinpal_only">فقط زرین‌پال</Select.Option>
                                    <Select.Option value="payping_only">فقط پی‌پینگ</Select.Option>
                                </Select>
                            </Form.Item>
                        </Card>
                    </TabPane>
                </Tabs>
                <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ marginTop: 24 }}>
                    ذخیره تغییرات
                </Button>
            </Form>
        </Spin>
    );
}