'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Table, Select, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Department } from '@/types';

const { Title, Text } = Typography;

// --- Type Definitions for Stats Data ---
interface OperatorPerformance {
    operatorName: string;
    ticketsSolved: number;
}
interface TicketCounts {
    Open: number;
    Answered: number;
    'In-Progress': number;
    Closed: number;
    Total: number;
}
interface StatsData {
    ticketCounts: TicketCounts;
    operatorPerformance: OperatorPerformance[];
}

// --- Display Component for Stats ---
const StatsDisplay = ({ stats }: { stats: StatsData }) => {
    const { ticketCounts, operatorPerformance } = stats;

    const performanceColumns = [
        { 
            title: 'نام اپراتور', 
            dataIndex: 'operatorName', 
            key: 'operatorName' 
        },
        { 
            title: 'تعداد تیکت‌های رسیدگی شده', 
            dataIndex: 'ticketsSolved', 
            key: 'ticketsSolved', 
            sorter: (a: OperatorPerformance, b: OperatorPerformance) => a.ticketsSolved - b.ticketsSolved, 
            defaultSortOrder: 'descend' as const 
        },
    ];

    return (
        <>
            <Title level={4} style={{ marginTop: 32 }}>وضعیت کلی تیکت‌ها</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="تیکت‌های باز" value={ticketCounts.Open} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="تیکت‌های پاسخ داده شده" value={ticketCounts.Answered} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="تیکت‌های بسته شده" value={ticketCounts.Closed} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="کل تیکت‌ها" value={ticketCounts.Total} /></Card></Col>
            </Row>

            <Title level={4} style={{ marginTop: 48 }}>عملکرد اپراتورها</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="نمودار عملکرد">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={operatorPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="operatorName" angle={-15} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend wrapperStyle={{ direction: 'ltr' }} />
                                <Bar dataKey="ticketsSolved" fill="#1677ff" name="تیکت‌های رسیدگی شده" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="جدول عملکرد">
                        <Table columns={performanceColumns} dataSource={operatorPerformance} rowKey="operatorName" pagination={false} scroll={{ y: 240 }} />
                    </Card>
                </Col>
            </Row>
        </>
    );
};

// --- Main Page Component ---
export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null); // null means "All Departments"
    const { user } = useAuth();

    const isAdmin = user?.role === 'admin';

    // Fetch list of departments for the admin's filter dropdown
    useEffect(() => {
        if (isAdmin) {
            setIsLoading(true);
            api.get('/departments')
                .then(res => setDepartments(res.data))
                .catch(err => console.error("Failed to fetch departments", err))
                .finally(() => setIsLoading(false));
        }
    }, [isAdmin]);

    // Fetch stats data based on role and selected department
    useEffect(() => {
        if (!user) return;
        // Don't fetch for admin until they select a department, or fetch all by default
        if (isAdmin && selectedDeptId === undefined) return; 

        let url = '/stats/dashboard';
        
        if (isAdmin) {
            // For admin, if a department is selected, add it as a query parameter.
            // If not (selectedDeptId is null), the backend will return stats for all departments.
            url = selectedDeptId ? `/stats/dashboard?departmentId=${selectedDeptId}` : '/stats/dashboard';
        } 
        // For department_head, the backend automatically scopes the data, so no query param is needed.

        setIsLoading(true);
        api.get(url)
            .then(res => setStats(res.data))
            .catch(err => console.error("Failed to fetch stats", err))
            .finally(() => setIsLoading(false));

    }, [user, selectedDeptId]);
    
    return (
        <div>
            <Title level={3}>آمار و گزارش‌ها</Title>
            
            {isAdmin && (
                <Card style={{ marginBottom: 24 }}>
                    <Text strong>نمایش آمار برای:</Text>
                    <Select
                        placeholder="یک دپارتمان را انتخاب کنید یا آمار کلی را ببینید"
                        style={{ width: '100%', marginTop: 8 }}
                        value={selectedDeptId}
                        onChange={(value) => setSelectedDeptId(value)}
                        allowClear
                        onClear={() => setSelectedDeptId(null)}
                    >
                        {departments.map(dept => (
                            <Select.Option key={dept._id} value={dept._id}>{dept.name}</Select.Option>
                        ))}
                    </Select>
                </Card>
            )}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin size="large" tip="در حال محاسبه آمار..." />
                </div>
            ) : stats && (stats.ticketCounts.Total > 0 || stats.operatorPerformance.length > 0) ? (
                <StatsDisplay stats={stats} />
            ) : (
                <Empty description={isAdmin ? "برای مشاهده آمار، یک دپارتمان را انتخاب کنید یا مطمئن شوید تیکتی در سیستم وجود دارد." : "هنوز دیتایی برای نمایش در دپارتمان شما وجود ندارد."} />
            )}
        </div>
    );
}