'use client';

import React, { useState, useEffect } from 'react';
import { Button, Select, Typography, Card, App } from 'antd';
import api from '@/lib/api';
import { Department } from '@/types';
import { DownloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ExportPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string | 'all'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const { message, notification } = App.useApp();

    useEffect(() => {
        // Fetch all departments to populate the dropdown
        api.get('/departments')
            .then(res => setDepartments(res.data))
            .catch(() => {
                notification.error({ message: 'خطا در دریافت لیست دپارتمان‌ها' });
            });
    }, [notification]);
    
    // New, secure function to handle file download
    const handleExport = async () => {
        setIsLoading(true);
        try {
            let url = '/admin/export/tickets';
            if (selectedDeptId !== 'all') {
                url += `?departmentId=${selectedDeptId}`;
            }

            // The api client automatically adds the Authorization header
            const response = await api.get(url, {
                responseType: 'blob', // Important: expect a file blob in response
            });

            // Create a URL for the blob
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            
            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = fileURL;
            
            // Extract filename from response headers if available, otherwise create one
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1];
                }
            }
            link.setAttribute('download', fileName);
            
            // Append to the document, click, and then remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(fileURL); // Clean up the object URL

        } catch (error: any) {
            // Handle cases where no tickets are found (404) or other errors
            const errorMessage = error.response?.status === 404
                ? 'هیچ تیکتی برای خروجی گرفتن با فیلترهای انتخابی یافت نشد.'
                : 'خطا در دریافت فایل خروجی.';
            notification.error({ message: 'خطا', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <Title level={3}>خروجی گرفتن از تیکت‌ها (CSV)</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                از این بخش می‌توانید تمام پیام‌های تیکت‌ها را در قالب یک فایل CSV برای تحلیل و بایگانی دریافت کنید.
            </Text>
            
            <Title level={5}>فیلتر بر اساس دپارتمان</Title>
            <Select
                value={selectedDeptId}
                onChange={setSelectedDeptId}
                style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}
            >
                <Select.Option value="all">همه دپارتمان‌ها</Select.Option>
                {departments.map(d => <Select.Option key={d._id} value={d._id}>{d.name}</Select.Option>)}
            </Select>
            
            <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={handleExport}
                loading={isLoading}
            >
                دریافت خروجی CSV
            </Button>
        </Card>
    );
} // <-- آکولاد جا افتاده در اینجا اضافه شد