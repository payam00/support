'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Table, Empty, Alert } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import Link from 'next/link';

const { Title } = Typography;

interface OperatorPerformance {
    operatorId: string;
    operatorName: string;
    totalIssued: number;
    totalPaid: number;
}
interface InvoiceCounts {
    pending: number;
    paid: number;
    canceled: number;
    expired: number;
    total: number;
}
interface StatsData {
    invoiceCounts: InvoiceCounts;
    operatorPerformance: OperatorPerformance[];
}

export default function InvoiceStatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        api.get('/stats/invoices')
            .then(res => setStats(res.data))
            .catch(err => {
                console.error("Failed to fetch invoice stats", err);
                setError(err.response?.data?.message || 'خطا در دریافت آمار فاکتورها.');
            })
            .finally(() => setIsLoading(false));
    }, []);

    const performanceColumns = [
        { 
            title: 'نام اپراتور', 
            dataIndex: 'operatorName', 
            key: 'operatorName',
            render: (text: string, record: OperatorPerformance) => (
                <Link href={`/invoices?operatorId=${record.operatorId}`}>
                    {text}
                </Link>
            )
        },
        { title: 'تعداد کل صادر شده', dataIndex: 'totalIssued', key: 'totalIssued', sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.totalIssued - b.totalIssued },
        { title: 'تعداد پرداخت شده', dataIndex: 'totalPaid', key: 'totalPaid', sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.totalPaid - b.totalPaid },
    ];

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" tip="در حال محاسبه آمار فاکتورها..." /></div>;
    }

    if (error) {
        return <Alert message="خطا" description={error} type="error" showIcon />;
    }

    if (!stats || !stats.invoiceCounts || stats.invoiceCounts.total === 0) {
        return <Empty description="هنوز هیچ فاکتوری برای نمایش آمار صادر نشده است." />;
    }

    const { invoiceCounts, operatorPerformance } = stats;

    const chartData = operatorPerformance.map(op => ({
        name: op.operatorName,
        'پرداخت شده': op.totalPaid,
        'پرداخت نشده': op.totalIssued - op.totalPaid,
    }));

    return (
        <div>
            <Title level={3}>آمار فاکتورها</Title>
            <Title level={4} style={{ marginTop: 32 }}>وضعیت کلی فاکتورها</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="فاکتورهای پرداخت شده" value={invoiceCounts.paid} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="فاکتورهای در انتظار پرداخت" value={invoiceCounts.pending} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="لغو/منقضی شده" value={invoiceCounts.canceled + invoiceCounts.expired} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="کل فاکتورها" value={invoiceCounts.total} /></Card></Col>
            </Row>
            <Title level={4} style={{ marginTop: 48 }}>عملکرد اپراتورها در صدور فاکتور</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="نمودار عملکرد">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend wrapperStyle={{ direction: 'ltr' }} />
                                <Bar dataKey="پرداخت شده" stackId="a" fill="#82ca9d" />
                                <Bar dataKey="پرداخت نشده" stackId="a" fill="#ffc658" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="جدول عملکرد">
                        <Table columns={performanceColumns} dataSource={operatorPerformance} rowKey="operatorId" pagination={false} scroll={{ y: 240 }} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}