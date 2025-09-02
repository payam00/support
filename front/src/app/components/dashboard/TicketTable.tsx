'use client';

import React from 'react';
import { Table, Tag, Typography, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Ticket } from '@/types';
import { format } from 'date-fns-jalali';
import { useRouter } from 'next/navigation';
import { TICKET_STATUS_PERSIAN, TICKET_STATUS_COLORS, TICKET_PRIORITY_PERSIAN } from '@/lib/localization';

const { Text } = Typography;

interface TicketTableProps {
    tickets: Ticket[];
    isLoading: boolean;
}

export default function TicketTable({ tickets, isLoading }: TicketTableProps) {
    const router = useRouter();
    
    const columns: ColumnsType<Ticket> = [
        { 
            title: 'عنوان', 
            dataIndex: 'title', 
            key: 'title', 
            render: (text, record) => <a onClick={() => router.push(`/tickets/${record._id}`)}>{text}</a>
        },
        { 
            title: 'کاربر', 
            dataIndex: ['createdBy', 'name'], 
            key: 'user' 
        },
        { 
            title: 'تخصیص یافته به', 
            dataIndex: ['assignedTo', 'name'], 
            key: 'assignedTo', 
            render: name => name ? <Tag color="purple">{name}</Tag> : <Tag>هیچکس</Tag> 
        },
        { 
            title: 'اولویت', 
            dataIndex: 'priority', 
            key: 'priority',
            render: (priority: Ticket['priority']) => <Text>{TICKET_PRIORITY_PERSIAN[priority]}</Text>
        },
        { 
            title: 'وضعیت', 
            dataIndex: 'status', 
            key: 'status', 
             render: (status: Ticket['status']) => <Tag color={TICKET_STATUS_COLORS[status]}>{TICKET_STATUS_PERSIAN[status]}</Tag>,
        filters: Object.keys(TICKET_STATUS_PERSIAN).map(statusKey => ({
            text: TICKET_STATUS_PERSIAN[statusKey as Ticket['status']],
            value: statusKey,
        })),
        onFilter: (value, record) => record.status === value,
    },
        {
            title: 'تاریخ ایجاد',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => format(new Date(date), 'yyyy/MM/dd'),
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        { 
            title: 'آخرین بروزرسانی', 
            dataIndex: 'updatedAt', 
            key: 'updatedAt', 
            render: (date) => format(new Date(date), 'yyyy/MM/dd HH:mm'), 
            sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(), 
            defaultSortOrder: 'descend' 
        },
        { 
            title: 'عملیات', 
            key: 'action', 
            render: (_, record) => (
                <Tooltip title="مشاهده و مدیریت">
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => router.push(`/tickets/${record._id}`)} />
                </Tooltip>
            ) 
        },
    ];

    return <Table loading={isLoading} columns={columns} dataSource={tickets} rowKey="_id" style={{ marginTop: 16 }} scroll={{ x: 1000 }} />;
}