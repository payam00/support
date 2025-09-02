'use client';

import React, { useState, useEffect } from 'react';
import { Spin, Alert, Typography, Space } from 'antd';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';

const { Title, Text } = Typography;

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: 'success' | 'info' | 'warning' | 'error';
    createdAt: string;
}

export default function DashboardPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/announcements/active')
            .then(res => setAnnouncements(res.data))
            .catch(err => console.error("Failed to fetch announcements:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <Spin fullscreen tip="در حال بارگذاری..." />;
    }

    return (
        <div>
            <Title level={2}>اطلاعیه‌ها</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
                {announcements.length > 0 ? (
                    announcements.map(ann => (
                        <Alert
                            key={ann._id}
                            message={ann.title}
                            description={
                                <div>
                                    <div dangerouslySetInnerHTML={{ __html: ann.content }} />
                                    <Text type="secondary" style={{ display: 'block', marginTop: '10px', fontSize: '12px' }}>
                                        تاریخ انتشار: {format(new Date(ann.createdAt), 'yyyy/MM/dd')}
                                    </Text>
                                </div>
                            }
                            type={ann.type}
                            showIcon
                            style={{ width: '100%' }}
                        />
                    ))
                ) : (
                    <Alert message="اطلاعیه جدیدی وجود ندارد." type="info" showIcon />
                )}
            </Space>
        </div>
    );
}