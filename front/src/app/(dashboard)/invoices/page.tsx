'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { App, Table, Tag, Tooltip, Button, Space, Input, Pagination, Tabs, message as antdMessage } from 'antd';
import { EyeOutlined, CopyOutlined, WhatsAppOutlined, MessageOutlined, PrinterOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';

const { Search } = Input;
const { TabPane } = Tabs;

interface Invoice {
    _id: string;
    fullName: string;
    finalAmount: number;
    status: 'pending' | 'paid' | 'canceled' | 'expired';
    uniqueToken: string;
    mobileNumber: string;
    paymentRefId?: string;
    createdAt: string;
    classType: { name: string };
    createdBy: { name: string };
}

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredOperatorName, setFilteredOperatorName] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const searchParams = useSearchParams();
    const router = useRouter();
    const operatorId = searchParams.get('operatorId');
    const { notification } = App.useApp();

    const fetchInvoices = useCallback(() => {
        setIsLoading(true);
        const params: any = {
            page: pagination.current,
            limit: pagination.pageSize,
            status: activeTab === 'all' ? undefined : activeTab,
            search: searchTerm || undefined,
            createdBy: operatorId || undefined,
        };
        
        api.get('/invoices', { params })
            .then(res => {
                // Note: The backend needs to be updated to return paginated data
                // For now, we assume it returns an array.
                setInvoices(res.data); // Assuming the response is an array of invoices
                // setPagination({ ...pagination, total: res.data.total }); // Uncomment when backend supports pagination for invoices
                
                if (operatorId && res.data.length > 0 && res.data[0].createdBy) {
                    setFilteredOperatorName(res.data[0].createdBy.name);
                } else {
                    setFilteredOperatorName(null);
                }
            })
            .catch(() => notification.error({ message: 'خطا در دریافت لیست فاکتورها' }))
            .finally(() => setIsLoading(false));
    }, [operatorId, pagination.current, pagination.pageSize, activeTab, searchTerm, notification]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    const handleClearFilter = () => {
        router.push('/invoices');
    };
    
    const handleCopyLink = (token: string) => {
        const url = `${window.location.origin}/invoice/${token}`;
        navigator.clipboard.writeText(url);
        antdMessage.success('لینک فاکتور کپی شد!');
    };
    
    const handlePrint = (token: string) => {
        window.open(`/invoice/print/${token}`, '_blank');
    };
    
    const handleResendSms = async (invoiceId: string) => {
        antdMessage.loading({ content: 'در حال ارسال پیامک...', key: 'sms' });
        try {
            const res = await api.post(`/invoices/${invoiceId}/send-sms`, { checkCooldown: false });
            antdMessage.success({ content: res.data.message, key: 'sms' });
        } catch (error: any) {
            antdMessage.error({ content: error.response?.data?.message || 'خطا در ارسال پیامک', key: 'sms' });
        }
    };
    
    const handleResendWhatsapp = (invoice: Invoice) => {
        const link = `${window.location.origin}/invoice/${invoice.uniqueToken}`;
        const text = `زبان آموز گرامی\nلینک پرداخت شما:\n${link}\nموسسه زبان آفاق`;
        const url = `https://wa.me/${invoice.mobileNumber.replace('0', '+98')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const columns: ColumnsType<Invoice> = [
        { title: 'نام مشتری', dataIndex: 'fullName', key: 'fullName' },
        { title: 'نوع کلاس', dataIndex: ['classType', 'name'], key: 'classType' },
        { title: 'مبلغ نهایی (ریال)', dataIndex: 'finalAmount', key: 'finalAmount', render: (amount: number) => (typeof amount === 'number' ? amount.toLocaleString() : '-') },
        { 
            title: 'وضعیت', 
            dataIndex: 'status', 
            key: 'status',
            render: (status: string) => {
                const statusMap: { [key: string]: { color: string; text: string } } = {
                    'pending': { color: 'gold', text: 'در انتظار پرداخت' },
                    'paid': { color: 'green', text: 'پرداخت شده' },
                    'canceled': { color: 'red', text: 'لغو شده' },
                    'expired': { color: 'grey', text: 'منقضی شده' },
                };
                const { color, text } = statusMap[status] || { color: 'default', text: status };
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { 
            title: 'کد رهگیری پرداخت', 
            dataIndex: 'paymentRefId', 
            key: 'paymentRefId',
            render: (refId?: string) => refId ? {refId} : '-'
        },
        { title: 'صادر کننده', dataIndex: ['createdBy', 'name'], key: 'operator' },
        { title: 'تاریخ صدور', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => format(new Date(date), 'yyyy/MM/dd') },
        {
            title: 'عملیات',
            key: 'action',
            fixed: 'right',
            width: 180,
            render: (_: any, record: Invoice) => (
                <Space>
                    <Tooltip title="مشاهده لینک عمومی"><a href={`/invoice/${record.uniqueToken}`} target="_blank" rel="noopener noreferrer"><Button type="primary" icon={<EyeOutlined />} /></a></Tooltip>
                    <Tooltip title="کپی لینک"><Button icon={<CopyOutlined />} onClick={() => handleCopyLink(record.uniqueToken)} /></Tooltip>
                    <Tooltip title="چاپ"><Button icon={<PrinterOutlined />} onClick={() => handlePrint(record.uniqueToken)} /></Tooltip>
                    <Tooltip title="ارسال پیامک"><Button icon={<MessageOutlined />} onClick={() => handleResendSms(record._id)} /></Tooltip>
                    <Tooltip title="ارسال واتساپ"><Button icon={<WhatsAppOutlined />} onClick={() => handleResendWhatsapp(record)} /></Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {filteredOperatorName && (
                <Tag icon={<CloseCircleOutlined />} closable onClose={handleClearFilter} color="processing" style={{ fontSize: '14px', padding: '8px 12px', marginBottom: 16 }}>
                    نمایش فاکتورهای صادر شده توسط: <strong>{filteredOperatorName}</strong>
                </Tag>
            )}
            
            <Search
                placeholder="جستجو در نام مشتری، موبایل و..."
                onSearch={(value) => { setPagination({ ...pagination, current: 1 }); setSearchTerm(value); }}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                style={{ marginBottom: 16 }}
            />

            <Tabs defaultActiveKey="all" onChange={(key) => { setPagination({ ...pagination, current: 1 }); setActiveTab(key); }}>
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
                scroll={{ x: 1300 }}
                pagination={false}
            />

            {/* <Pagination
                style={{ marginTop: 16, textAlign: 'center' }}
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) => setPagination({ ...pagination, current: page, pageSize })}
                showSizeChanger
            /> */}
        </div>
    );
}