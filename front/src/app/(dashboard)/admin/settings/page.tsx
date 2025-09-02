'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Switch,Statistic, Typography, Spin, Card, Form, InputNumber, Select, Button, Tabs, Space, Divider, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Gateway {
    name: 'zarinpal' | 'payping';
    label: string;
    enabled: boolean;
    maxAmount: number;
    processedAmount: number;
    maxTransactions: number;
    processedTransactions: number;
    priority: number;
}

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [form] = Form.useForm();
    const { message, notification, modal } = App.useApp();
    const [strategy, setStrategy] = useState<string>('');

    const fetchSettings = useCallback(() => {
        setIsLoading(true);
        api.get('/admin/settings')
            .then(res => {
                form.setFieldsValue(res.data);
                setStrategy(res.data.gatewaySelectionStrategy);
                const sortedGateways = (res.data.paymentGateways || []).sort((a: Gateway, b: Gateway) => a.priority - b.priority);
                setGateways(sortedGateways);
            })
            .catch(() => {
                notification.error({ message: 'خطا در دریافت تنظیمات' });
            })
            .finally(() => setIsLoading(false));
    }, [form, notification]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleFormSubmit = async (values: any) => {
        setIsSubmitting(true);
        const payload = { ...values, paymentGateways: gateways };
        try {
            const res = await api.put('/admin/settings', payload);
            const sortedGateways = (res.data.settings.paymentGateways || []).sort((a: Gateway, b: Gateway) => a.priority - b.priority);
            form.setFieldsValue(res.data.settings);
            setGateways(sortedGateways);
            message.success('تنظیمات با موفقیت ذخیره شد.');
        } catch (error) {
            notification.error({ message: 'خطا در ذخیره تنظیمات' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleGatewayChange = (name: string, field: keyof Gateway, value: any) => {
        setGateways(prev => {
            const newGateways = prev.map(gw => gw.name === name ? { ...gw, [field]: value } : gw);
            if (field === 'priority') {
                newGateways.sort((a, b) => a.priority - b.priority);
            }
            return newGateways;
        });
    };

    const handleResetCounters = (gatewayName: string) => {
        modal.confirm({
            title: `آیا از ریست کردن شمارنده‌های درگاه ${gatewayName} مطمئن هستید؟`,
            okText: 'بله، ریست کن',
            cancelText: 'انصراف',
            onOk: async () => {
                try {
                    const res = await api.post('/admin/settings/reset-gateway', { gatewayName });
                    message.success(res.data.message);
                    fetchSettings();
                } catch (error: any) {
                    notification.error({ message: 'خطا', description: error.response?.data?.message });
                }
            }
        });
    };

    return (
        <Spin spinning={isLoading}>
            <Title level={3}>تنظیمات سامانه</Title>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
                <Tabs defaultActiveKey="payment">
                    <TabPane tab="تنظیمات عمومی" key="general">
                        <Card>
                            <Form.Item name="publicRegistration" label="فعال‌سازی ثبت‌نام عمومی" valuePropName="checked"><Switch /></Form.Item>
                            <Form.Item name="invoiceValidityHours" label="اعتبار پیش‌فاکتور (ساعت)"><InputNumber min={1} style={{width: '100px'}} /></Form.Item>
                        </Card>
                    </TabPane>
                    <TabPane tab="تنظیمات درگاه پرداخت" key="payment">
                        <Card>
                            <Form.Item name="gatewaySelectionStrategy" label="استراتژی انتخاب درگاه">
                                <Select onChange={(value) => setStrategy(value)}>
                                    <Option value="random">تصادفی</Option>
                                    <Option value="amount_based">بر اساس سقف مبلغ</Option>
                                    <Option value="transaction_based">بر اساس تعداد تراکنش</Option>
                                    <Option value="zarinpal_only">فقط زرین‌پال</Option>
                                    <Option value="payping_only">فقط پی‌پینگ</Option>
                                </Select>
                            </Form.Item>
                            <Divider>مدیریت درگاه‌ها</Divider>
                            <Space direction="vertical" style={{width: '100%'}}>
                                {gateways.map((item) => (
                                    <Card key={item.name} type="inner" title={<Title level={5}>{item.label}</Title>} extra={<Tooltip title="ریست کردن شمارنده‌ها"><Button shape="circle" icon={<ReloadOutlined />} onClick={() => handleResetCounters(item.name)} /></Tooltip>}>
                                        <Space wrap size="large" align="center">
                                            <InputNumber addonBefore="اولویت" value={item.priority} onChange={(val) => handleGatewayChange(item.name, 'priority', val)} min={1} />
                                            <Space><Text>فعال‌سازی:</Text><Switch checked={item.enabled} onChange={(checked) => handleGatewayChange(item.name, 'enabled', checked)} /></Space>
                                            {(strategy === 'amount_based') && (
                                                <>
                                                    <InputNumber addonAfter="ریال" placeholder="سقف مبلغ" value={item.maxAmount} onChange={(val) => handleGatewayChange(item.name, 'maxAmount', val)} style={{ width: 200 }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => Number(value!.replace(/,/g, ''))} />
                                                    <Statistic title="مبلغ پردازش شده" value={item.processedAmount} suffix="ریال" valueStyle={{ fontSize: 14 }} />
                                                </>
                                            )}
                                            {(strategy === 'transaction_based') && (
                                                <>
                                                    <InputNumber addonAfter="عدد" placeholder="سقف تراکنش" value={item.maxTransactions} onChange={(val) => handleGatewayChange(item.name, 'maxTransactions', val)} style={{ width: 200 }} />
                                                    <Statistic title="تعداد تراکنش پردازش شده" value={item.processedTransactions} valueStyle={{ fontSize: 14 }} />
                                                </>
                                            )}
                                        </Space>
                                    </Card>
                                ))}
                            </Space>
                        </Card>
                    </TabPane>
                </Tabs>
                <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ marginTop: 24 }}>ذخیره تغییرات</Button>
            </Form>
        </Spin>
    );
}
