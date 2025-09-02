'use client';

import React, { useState, useEffect } from 'react';
import { List, Tag, Typography, Spin, Empty, Button, Card, Avatar } from 'antd';
import { EyeOutlined, FileTextOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { Ticket } from '@/types';
import { format } from 'date-fns-jalali';
import Link from 'next/link';
import { TICKET_STATUS_PERSIAN, TICKET_STATUS_COLORS, TICKET_PRIORITY_PERSIAN } from '@/lib/localization';
import styles from './UserTicketList.module.scss';

const { Text, Paragraph } = Typography;

const priorityIcons: Record<Ticket['priority'], React.ReactNode> = {
    High: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    Medium: <FileTextOutlined style={{ color: '#faad14' }} />,
    Low: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
};

export default function UserTicketList() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.get('/tickets')
            .then(response => setTickets(response.data))
            .catch(error => console.error("Failed to fetch tickets:", error))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div>
            <Text type="secondary">در این بخش می‌توانید لیست تمام تیکت‌های خود را مشاهده و مدیریت کنید.</Text>
            <Spin spinning={isLoading}>
                {tickets.length > 0 ? (
                    <Card className={styles.ticketListCard}>
                        <List
                            itemLayout="horizontal"
                            dataSource={tickets}
                            renderItem={(ticket: Ticket) => (
                                <List.Item
                                    actions={[
                                        <Link href={`/tickets/${ticket._id}`} key="list-view">
                                            <Button icon={<EyeOutlined />}>مشاهده</Button>
                                        </Link>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar 
                                                className={styles.priorityAvatar}
                                                icon={priorityIcons[ticket.priority]} 
                                                size="large"
                                            />
                                        }
                                        title={<Link href={`/tickets/${ticket._id}`}>{ticket.title}</Link>}
                                        description={
                                            <div className={styles.metaDescription}>
                                                <Text type="secondary">دپارتمان: {ticket.department.name}</Text>
                                                <Text type="secondary">|</Text>
                                                <Text type="secondary">آخرین بروزرسانی: {format(new Date(ticket.updatedAt), 'yyyy/MM/dd HH:mm')}</Text>
                                            </div>
                                        }
                                    />
                                    <div className={styles.ticketExtra}>
                                        <Tag color={TICKET_STATUS_COLORS[ticket.status]}>
                                            {TICKET_STATUS_PERSIAN[ticket.status]}
                                        </Tag>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                ) : (
                    !isLoading && <Empty description="شما تاکنون هیچ تیکتی ثبت نکرده‌اید." />
                )}
            </Spin>
        </div>
    );
}