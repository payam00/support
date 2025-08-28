'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Table, Tag, message as antdMessage, Button, Input, Tabs, Tooltip, Space } from 'antd';
import { DownloadOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';
import Cookies from 'js-cookie';
import { WhatsAppOutlined, MessageOutlined } from '@ant-design/icons';

const { Search } = Input;
const { TabPane } = Tabs;

// تعریف یک تایپ ساده برای فاکتورها جهت استفاده در کامپوننت
interface Invoice {
    _id: string;
    fullName: string;
    finalAmount: number;
    status: 'pending' | 'paid' | 'canceled' | 'expired';
    uniqueToken: string;
    createdAt: string;
    classType: { name: string };
    createdBy: { name: string };
}

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { message, notification } = App.useApp();
    const handleResendSms = async (invoiceId: string) => {
        antdMessage.loading('در حال ارسال پیامک...');
        try {
            // checkCooldown: false means no time limit for resending
            const res = await api.post(`/invoices/${invoiceId}/send-sms`, { checkCooldown: false });
            antdMessage.success(res.data.message);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        }
    };
      const handleResendWhatsapp = (invoice: any) => {
        const link = `http://site/?token=${invoice.uniqueToken}`;
        const text = `زبان آموز گرامی\nلینک پرداخت شما:\n${link}\nموسسه زبان آفاق`;
        const url = `https://wa.me/${invoice.mobileNumber.replace('0', '+98')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };
    const fetchInvoices = useCallback(() => {
        setIsLoading(true);
        const params = {
            status: activeTab === 'all' ? undefined : activeTab,
            search: searchTerm || undefined
        };
        api.get('/invoices', { params })
            .then(res => setInvoices(res.data))
            .catch(() => notification.error({ message: 'خطا در دریافت لیست فاکتورها' }))
            .finally(() => setIsLoading(false));
    }, [notification, activeTab, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300); // افزودن دیلی کوتاه برای جلوگیری از درخواست‌های مکرر هنگام تایپ
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    const handleCopyLink = (token: string) => {
        const url = `${window.location.origin}/invoice/${token}`;
        navigator.clipboard.writeText(url);
        message.success('لینک فاکتور کپی شد!');
    };
    
    const handleExport = async () => {
        try {
            const token = Cookies.get('authToken');
            const response = await api.get('/invoices/export', {
                responseType: 'blob', // مهم برای دریافت فایل
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'invoices.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            notification.error({ message: 'خطا در دانلود فایل خروجی' });
        }
    };

    const columns: ColumnsType<Invoice> = [
        { title: 'نام مشتری', dataIndex: 'fullName', key: 'fullName', width: 150 },
        { title: 'نوع کلاس', dataIndex: ['classType', 'name'], key: 'classType', width: 120 },
        { 
            title: 'مبلغ نهایی (ریال)', 
            dataIndex: 'finalAmount', 
            key: 'finalAmount', 
            width: 150,
            // --- FIX: Add a check to prevent error on undefined amount ---
            render: (amount: number) => (typeof amount === 'number' ? amount.toLocaleString() : '-')
        },
        { 
            title: 'وضعیت', 
            dataIndex: 'status', 
            key: 'status',
            width: 120,
            render: (status: string) => {
                let color = 'gold'; // pending
                let text = 'در انتظار پرداخت';
                if (status === 'paid') { color = 'green'; text = 'پرداخت شده'; }
                if (status === 'canceled') { color = 'red'; text = 'لغو شده'; }
                if (status === 'expired') { color = 'grey'; text = 'منقضی شده'; }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'صادر کننده', dataIndex: ['createdBy', 'name'], key: 'operator', width: 120 },
        { 
            title: 'تاریخ صدور', 
            dataIndex: 'createdAt', 
            key: 'createdAt', 
            width: 120,
            render: (date: string) => format(new Date(date), 'yyyy/MM/dd') 
        },
        {
            title: 'عملیات',
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (_: any, record: Invoice) => (
                <Space>
                    <Tooltip title="مشاهده لینک عمومی">
                        <a href={`/invoice/${record.uniqueToken}`} target="_blank" rel="noopener noreferrer">
                            <Button type="primary" icon={<EyeOutlined />} />
                        </a>
                    </Tooltip>
                    <Tooltip title="کپی لینک عمومی">
                        <Button icon={<CopyOutlined />} onClick={() => handleCopyLink(record.uniqueToken)} />
                    </Tooltip>
                    <Tooltip title="ارسال مجدد پیامک">
                        <Button icon={<MessageOutlined />} onClick={() => handleResendSms(record._id)} />
                    </Tooltip>
                    <Tooltip title="ارسال مجدد با واتساپ">
                        <Button icon={<WhatsAppOutlined />} onClick={() => handleResendWhatsapp(record)} />
                    </Tooltip>
                </Space>
            ),
        },
        
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: 16 }}>
                <Search 
                    placeholder="جستجو در نام، موبایل و کد ملی..." 
                    onSearch={(value) => setSearchTerm(value)} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                    style={{ width: 300 }} 
                />
                <Button icon={<DownloadOutlined />} onClick={handleExport}>
                    خروجی CSV
                </Button>
            </div>
            <Tabs defaultActiveKey="all" onChange={(key) => setActiveTab(key)}>
                <TabPane tab="همه" key="all" />
                <TabPane tab="در انتظار پرداخت" key="pending" />
                <TabPane tab="پرداخت شده" key="paid" />
                <TabPane tab="لغو شده" key="canceled" />
                <TabPane tab="منقضی شده" key="expired" />
            </Tabs>
            <Table 
                loading={isLoading} 
                columns={columns} 
                dataSource={invoices} 
                rowKey="_id" 
                scroll={{ x: 800 }}
            />
        </div>
    );
}