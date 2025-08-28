'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { App,Timeline, Button,Modal, Form, Input, Typography, Spin, Empty, Descriptions, Tag, Select, Space, Card, Skeleton, Alert } from 'antd';
import { SendOutlined, AudioOutlined, DeleteOutlined, LoadingOutlined, UserSwitchOutlined, CheckOutlined, RobotOutlined, MessageOutlined, SwapOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { Ticket, UserInfo, Department, Faq } from '@/types';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/context/AuthContext';
import styles from './ticket-detail.module.scss';
import { TICKET_STATUS_PERSIAN, TICKET_STATUS_COLORS, TICKET_PRIORITY_PERSIAN } from '@/lib/localization';

const { Title, Text,Paragraph, } = Typography;
const { TextArea } = Input;
const ticketStatuses: Ticket['status'][] = ['Open', 'Answered', 'In-Progress', 'Closed', 'Referred'];

const TicketAssignmentPanel = ({ ticket, onAssignment }: { ticket: Ticket; onAssignment: () => void; }) => {
    const { user } = useAuth();
    const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { message, notification } = App.useApp();
    const isOperator = user?.role === 'operator';
    const isManager = user?.role === 'department_head' || user?.role === 'admin';
    const handleAssign = async () => {
        setIsLoading(true);
        try {
            let payload = {};
            if (isManager && selectedOperator) { payload = { operatorId: selectedOperator }; }
            const res = await api.put(`/tickets/${ticket._id}/assign`, payload);
            message.success(res.data.message);
            onAssignment();
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        } finally {
            setIsLoading(false);
        }
    };
    if (!user || (!isOperator && !isManager)) return null;
    return (
        <div className={styles.assignmentPanel}>
            <div className={styles.assignmentStatus}>
                {ticket.assignedTo ? (<Text>تخصیص یافته به: <Tag color="geekblue">{ticket.assignedTo.name}</Tag></Text>) : (<Text type="secondary">تخصیص نیافته</Text>)}
            </div>
            {isManager && (
                <Space.Compact style={{ marginTop: 8 }}>
                    <Select placeholder="تخصیص به اپراتور..." style={{ width: 200 }} onChange={(value) => setSelectedOperator(value)} value={selectedOperator} options={ticket.department.operators?.map((op: UserInfo) => ({ label: op.name, value: op._id }))} disabled={isLoading} />
                    <Button type="primary" onClick={handleAssign} loading={isLoading} disabled={!selectedOperator} icon={<CheckOutlined />}>تخصیص</Button>
                </Space.Compact>
            )}
            {isOperator && !ticket.assignedTo && (<Button type="primary" onClick={handleAssign} loading={isLoading} style={{ marginTop: 8 }} icon={<UserSwitchOutlined />}>تخصیص به من</Button>)}
        </div>
    );
};

const AiFeedbackButtons = ({ ticketId, onAction }: { ticketId: string; onAction: () => void; }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { message } = App.useApp();
    const handleFeedback = async (action: 'escalate' | 'resolve') => {
        setIsLoading(true);
        const url = action === 'escalate' ? `/tickets/${ticketId}/escalate` : `/tickets/${ticketId}/resolve-ai`;
        try {
            const res = await api.post(url);
            message.success(res.data.message);
            onAction();
        } catch (error) {
            message.error('خطایی رخ داد.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Card className={styles.aiFeedback}>
            <Text strong>آیا پاسخ هوش مصنوعی برای شما مفید بود؟</Text>
            <div className={styles.feedbackButtons}><Button loading={isLoading} onClick={() => handleFeedback('resolve')}>بله، مشکلم حل شد</Button><Button type="primary" loading={isLoading} onClick={() => handleFeedback('escalate')}>خیر، به کارشناس وصل شوم</Button></div>
        </Card>
    );
};

const TicketReferralPanel = ({ ticket, onReferral }: { ticket: Ticket; onReferral: () => void; }) => {
    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [note, setNote] = useState('');
    const [targetDeptId, setTargetDeptId] = useState<string | null>(null);
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(false);
   
    const { message, notification } = App.useApp();
     const isOperator = user?.role === 'operator';
    const isManager = user?.role === 'department_head' || user?.role === 'admin';

    const canRefer = isManager || (isOperator && ticket.assignedTo?._id === user?._id);

    useEffect(() => {
        if (user?.role === 'department_head' || user?.role === 'admin') {
            api.get('/departments').then(res => setAllDepartments(res.data));
        }
    }, [user]);

    const handleRefer = async () => {
        if (!note.trim()) { return notification.error({ message: 'یادداشت ارجاع نمی‌تواند خالی باشد.' }); }
        setIsLoading(true);
        try {
            const payload: { note: string; targetDepartmentId?: string; } = { note };
            if ((user?.role === 'department_head' || user?.role === 'admin') && targetDeptId) {
                payload.targetDepartmentId = targetDeptId;
            }
            await api.post(`/tickets/${ticket._id}/refer`, payload);
            message.success('تیکت با موفقیت ارجاع داده شد.');
            onReferral();
            setIsModalVisible(false);
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message });
        } finally {
            setIsLoading(false);
        }
    };
    if (!user || (user.role !== 'operator' && user.role !== 'department_head' && user.role !== 'admin')) return null;
    return (
        <div>
            <Button icon={<SwapOutlined />} onClick={() => setIsModalVisible(true)}>ارجاع تیکت</Button>
            <Modal title="ارجاع تیکت" open={isModalVisible} onOk={handleRefer} onCancel={() => setIsModalVisible(false)} confirmLoading={isLoading} okText="ارجاع بده" cancelText="انصراف">
                {(user.role === 'department_head' || user.role === 'admin') && (
                    <Select placeholder="انتخاب دپارتمان مقصد" onChange={setTargetDeptId} style={{ width: '100%', marginBottom: 16 }}>
                        {allDepartments.filter(d => d._id !== ticket.department._id).map(d => <Select.Option key={d._id} value={d._id}>{d.name}</Select.Option>)}
                    </Select>
                )}
                <TextArea rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="لطفاً دلیل ارجاع را بنویسید..." />
            </Modal>
        </div>
    );
};

export default function TicketDetailPage() {
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoadingAi, setIsLoadingAi] = useState({ summary: false, suggestions: false });
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const { user } = useAuth();
    const params = useParams();
    const ticketId = params.id as string;
    const { message, notification } = App.useApp();
    const messageListRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [form] = Form.useForm();
    const isStaff = user?.role === 'operator' || user?.role === 'department_head' || user?.role === 'admin';

    const fetchTicket = useCallback(() => {
        if (!ticketId || !user) return;
        setIsLoading(true);
        api.get(`/tickets/${ticketId}`).then(res => {
            setTicket(res.data);
            if (isStaff) {
                setIsLoadingAi({ summary: true, suggestions: true });
                api.get(`/tickets/${ticketId}/summary`).then(sRes => setAiSummary(sRes.data.summary)).finally(() => setIsLoadingAi(prev => ({ ...prev, summary: false })));
                api.get(`/tickets/${ticketId}/suggestions`).then(sugRes => setAiSuggestions(sugRes.data.suggestions)).finally(() => setIsLoadingAi(prev => ({ ...prev, suggestions: false })));
            }
        }).catch(() => notification.error({ message: 'خطا در دریافت اطلاعات تیکت' })).finally(() => setIsLoading(false));
    }, [ticketId, notification, user, isStaff]);

    useEffect(() => { fetchTicket(); }, [fetchTicket]);
    useEffect(() => { if (messageListRef.current) { messageListRef.current.scrollTop = messageListRef.current.scrollHeight; } }, [ticket?.messages]);
    
    const handleStatusChange = async (newStatus: Ticket['status']) => {
        setIsUpdatingStatus(true);
        try {
            await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
            message.success(`وضعیت تیکت به "${TICKET_STATUS_PERSIAN[newStatus]}" تغییر یافت.`);
            fetchTicket();
        } catch (error) {
            notification.error({ message: 'خطا در تغییر وضعیت تیکت' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleReplySubmit = async (values: { content?: string }) => {
        if (!values.content && !audioBlob) { return message.error('لطفاً پیام متنی یا صوتی خود را وارد کنید.'); }
        setIsReplying(true);
        const formData = new FormData();
        if (audioBlob) {
            formData.append('voice', audioBlob, 'recording.webm');
            formData.append('voiceDuration', '60');
        } else if (values.content) {
            formData.append('content', values.content);
        }
        try {
            await api.post(`/tickets/${ticketId}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            message.success('پاسخ شما با موفقیت ثبت شد.');
            form.resetFields();
            setAudioBlob(null);
            setAudioUrl(null);
            fetchTicket();
        } catch (error: any) {
            notification.error({ message: 'خطا در ارسال پاسخ', description: error.response?.data?.message });
        } finally {
            setIsReplying(false);
        }
    };
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => { audioChunksRef.current.push(event.data); };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            notification.error({ message: 'دسترسی به میکروفون امکان‌پذیر نیست.' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const canReply = (() => {
        if (!user || !ticket) return false;
        if (user.role === 'user') return true;
        if (isStaff) {
            if (!ticket.assignedTo) return true;
            if (ticket.assignedTo._id === user._id) return true;
            if (user.role === 'department_head' || user.role === 'admin') return true;
        }
        return false;
    })();

    if (isLoading || !user) return <Spin size="large" fullscreen />;
    if (!ticket) return <Empty description="تیکت مورد نظر یافت نشد یا شما دسترسی ندارید." />;

    return (
        <div>
            {isStaff && (<Card className={styles.aiSummary}><Title level={5}><RobotOutlined /> خلاصه هوشمند تیکت</Title><Skeleton loading={isLoadingAi.summary} active paragraph={{ rows: 2 }} title={false}><Text type="secondary">{aiSummary}</Text></Skeleton></Card>)}
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} className={styles.pageHeader}>
                <Descriptions.Item label="عنوان">{ticket.title}</Descriptions.Item>
                <Descriptions.Item label="دپارتمان">{ticket.department.name}</Descriptions.Item>
                <Descriptions.Item label="اولویت">{TICKET_PRIORITY_PERSIAN[ticket.priority]}</Descriptions.Item>
                <Descriptions.Item label="ایجاد شده توسط">{ticket.createdBy.name}</Descriptions.Item>
                <Descriptions.Item label="وضعیت">
                    {isStaff ? (<Select value={ticket.status} onChange={handleStatusChange} style={{ width: 140 }} loading={isUpdatingStatus}>{ticketStatuses.map(s => <Select.Option key={s} value={s}>{TICKET_STATUS_PERSIAN[s]}</Select.Option>)}</Select>) : (<Tag color={TICKET_STATUS_COLORS[ticket.status]}>{TICKET_STATUS_PERSIAN[ticket.status]}</Tag>)}
                </Descriptions.Item>
                <Descriptions.Item label="مسئول تیکت" span={1}><TicketAssignmentPanel ticket={ticket} onAssignment={fetchTicket} /></Descriptions.Item>
                <Descriptions.Item label="عملیات اضافه" span={2}><TicketReferralPanel ticket={ticket} onReferral={fetchTicket} /></Descriptions.Item>
            </Descriptions>
             {isStaff && ticket.referralHistory && ticket.referralHistory.length > 0 && (
                <Card title="تاریخچه ارجاعات" className={styles.referralHistory}>
                    <Timeline>
                        {ticket.referralHistory.map(ref => (
                            <Timeline.Item key={ref._id}>
                                <Text strong>{ref.referredBy.name}</Text>
                                <Text type="secondary"> در تاریخ {format(new Date(ref.referredAt), 'yyyy/MM/dd HH:mm')} </Text>
                                {ref.toDepartment ? (
                                    <Text>تیکت را از دپارتمان "{ref.fromDepartment.name}" به دپارتمان "{ref.toDepartment.name}" ارجاع داد:</Text>
                                ) : (
                                    <Text>تیکت را به مدیر دپارتمان ارجاع داد:</Text>
                                )}
                                <Paragraph className={styles.referralNote}>{ref.note}</Paragraph>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Card>
            )}
            <div ref={messageListRef} className={styles.messageList}>
                 {ticket.messages.map((msg) => (
                    <div key={msg._id} className={`${styles.messageBubble} ${msg.senderType === 'user' ? styles.messageUser : msg.senderType === 'ai' ? styles.messageAi : msg.senderType === 'system' ? styles.messageSystem : styles.messageOperator}`}>
                        <Text className={styles.senderName}>{msg.senderType === 'ai' ? <><RobotOutlined/> هوش مصنوعی آکادمی زبان آفاق</> : msg.senderType === 'user' ? (msg.sender?.name || 'شما') : msg.senderType === 'operator' ? (msg.sender?.name || 'پشتیبانی') : 'سیستم'}</Text>
                        <div className={styles.messageContent}>{msg.type === 'text' ? (<Text>{msg.content}</Text>) : (<audio controls src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${msg.content}`} />)}</div>
                        <div className={styles.timestamp}>{format(new Date(msg.timestamp), 'HH:mm')}</div>
                    </div>
                ))}
            </div>
            {ticket.status === 'Answered by AI' && user?.role === 'user' ? (
                <AiFeedbackButtons ticketId={ticket._id} onAction={fetchTicket} />
            ) : canReply ? (
                <Form form={form} onFinish={handleReplySubmit} className={styles.replyForm}>
                    {isStaff && aiSuggestions.length > 0 && (
                        <div className={styles.suggestionsContainer}><Title level={5}><MessageOutlined /> پاسخ‌های پیشنهادی</Title><Skeleton loading={isLoadingAi.suggestions} active paragraph={{ rows: 1 }} title={false}><div className={styles.suggestionButtons}>{aiSuggestions.map((s, i) => (<Button key={i} type="dashed" onClick={() => form.setFieldsValue({ content: s })}>{s}</Button>))}</div></Skeleton></div>
                    )}
                    <Title level={5}>ارسال پاسخ جدید</Title>
                    {audioUrl ? (
                        <div className={styles.voiceRecorder}><audio src={audioUrl} controls /><Button icon={<DeleteOutlined />} onClick={() => { setAudioUrl(null); setAudioBlob(null); }} danger /></div>
                    ) : (
                        <Form.Item name="content" rules={[{ required: true, message: 'لطفاً متن پیام خود را وارد کنید.' }]}><TextArea rows={4} placeholder="پاسخ خود را اینجا بنویسید..." disabled={isRecording} /></Form.Item>
                    )}
                    <Form.Item><div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><Button type="primary" htmlType="submit" loading={isReplying} icon={<SendOutlined />}>ارسال پاسخ</Button><Button type="default" icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />} onClick={isRecording ? stopRecording : startRecording} danger={isRecording} disabled={!!audioUrl}>{isRecording ? 'در حال ضبط...' : 'ضبط پیام صوتی'}</Button></div></Form.Item>
                </Form>
            ) : (
                <Alert message="این تیکت به اپراتور دیگری تخصیص داده شده و شما فقط دسترسی مشاهده آن را دارید." type="info" showIcon style={{ marginTop: 24 }} />
            )}
        </div>
    );
}