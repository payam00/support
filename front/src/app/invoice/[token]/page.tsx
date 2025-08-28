'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { App, Card, Descriptions, Spin, Result, Button, Checkbox, Typography, Divider, Input, Row, Col } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { getPublicInvoice } from '@/lib/api';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';

const { Title, Paragraph, Text } = Typography;

export default function PublicInvoicePage() {
    const [invoice, setInvoice] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    
    const params = useParams();
    const token = params.token as string;
    const { message, notification } = App.useApp();

    const fetchInvoice = useCallback(() => {
        if (!token) return;
        setIsLoading(true);
        getPublicInvoice(token)
            .then(res => setInvoice(res.data))
            .catch(err => setError(err.response?.data?.message || 'خطای ناشناخته'))
            .finally(() => setIsLoading(false));
    }, [token]);

    useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

    const handleApplyDiscount = async () => {
        setIsProcessing(true);
        try {
            const res = await api.post(`/invoices/public/${token}/apply-discount`, { code: discountCode });
            setInvoice(res.data.invoice);
            message.success(res.data.message);
        } catch (err: any) {
            notification.error({ message: 'خطا', description: err.response?.data?.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveDiscount = async () => {
        setIsProcessing(true);
        try {
            const res = await api.post(`/invoices/public/${token}/remove-discount`);
            setInvoice(res.data.invoice);
            message.success(res.data.message);
        } catch (err: any) {
            notification.error({ message: 'خطا', description: err.response?.data?.message });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handlePay = async () => {
        if (!termsAccepted) {
            message.error('لطفاً ابتدا قوانین و مقررات را تایید کنید.');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await api.post(`/payment/request/${token}`);
            const { paymentUrl } = res.data;
            window.location.href = paymentUrl;
        } catch (err: any) {
            notification.error({ message: 'خطا', description: err.response?.data?.message || 'خطا در شروع فرآیند پرداخت' });
            setIsProcessing(false);
        }
    };

    if (isLoading) return <Spin fullscreen tip="در حال بارگذاری اطلاعات فاکتور..." />;
    if (error) return <Result status="error" title="خطا" subTitle={error} />;
    if (!invoice) return <Result status="404" title="یافت نشد" subTitle="فاکتور مورد نظر یافت نشد." />;

    const renderPendingContent = () => {
        return (
            <>
                <Divider />
                {invoice.discount && invoice.discount.code ? (
                    <div style={{ marginBottom: 24 }}>
                        <Typography.Text strong>تخفیف اعمال شده:</Typography.Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f6ffed', padding: '8px 12px', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                            <Typography.Text code style={{ fontSize: '1rem' }}>{invoice.discount.code}</Typography.Text>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveDiscount} loading={isProcessing}>حذف</Button>
                        </div>
                    </div>
                ) : (
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={16}><Input placeholder="کد تخفیف را وارد کنید" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} disabled={isProcessing} /></Col>
                        <Col xs={24} md={8}><Button block onClick={handleApplyDiscount} loading={isProcessing} disabled={!discountCode}>اعمال کد</Button></Col>
                    </Row>
                )}
                <Title level={5}>قوانین و مقررات</Title>
                <Card type="inner" style={{ marginBottom: 24 }}><Paragraph style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>{invoice.classType.termsAndConditions}</Paragraph></Card>
                <Checkbox checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}>قوانین و مقررات فوق را مطالعه کرده و با آن موافقم.</Checkbox>
                <Button type="primary" size="large" block style={{ marginTop: 24 }} disabled={!termsAccepted || isProcessing} loading={isProcessing} onClick={handlePay}>تایید و پرداخت نهایی</Button>
            </>
        );
    };

    const renderStatusSpecificContent = () => {
        switch (invoice.status) {
            case 'paid': return <Result status="success" title="این فاکتور با موفقیت پرداخت شده است" subTitle={`شماره پیگیری: ${invoice.paymentRefId || 'ثبت نشده'}`} />;
            case 'expired': return <Result status="warning" title="این فاکتور منقضی شده است" />;
            case 'canceled': return <Result status="error" title="این فاکتور لغو شده است" />;
            case 'pending': return renderPendingContent();
            default: return null;
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
          
            <Card>
                <img src="/Header-Bill-Page.jpg" style={{ maxWidth: '100%'}} alt="header" className="logo" />
                <Title level={3}>شناسه فاکتور: {invoice._id.slice(-6)}</Title>
                <Descriptions bordered column={1}>
                    <Descriptions.Item label="نام کامل">{invoice.fullName}</Descriptions.Item>
                    <Descriptions.Item label="نوع کلاس">{invoice.classType.name}</Descriptions.Item>
                    {invoice.discount && invoice.discount.amount > 0 ? (
                        <>
                            <Descriptions.Item label="مبلغ اصلی"><Text delete>{invoice.amount.toLocaleString()} ریال</Text></Descriptions.Item>
                            <Descriptions.Item label={`تخفیف (${invoice.discount.code})`}><Text type="danger">- {invoice.discount.amount.toLocaleString()} ریال</Text></Descriptions.Item>
                            <Descriptions.Item label="مبلغ نهایی"><Text strong style={{ fontSize: '1.2rem' }}>{invoice.finalAmount.toLocaleString()} ریال</Text></Descriptions.Item>
                        </>
                    ) : ( <Descriptions.Item label="مبلغ قابل پرداخت"><Text strong style={{ fontSize: '1.2rem' }}>{invoice.amount.toLocaleString()} ریال</Text></Descriptions.Item> )}
                    <Descriptions.Item label="تاریخ انقضا">{invoice.expiresAt ? format(new Date(invoice.expiresAt), 'yyyy/MM/dd - HH:mm') : '-'}</Descriptions.Item>
                </Descriptions>
                {renderStatusSpecificContent()}
            </Card>
        </div>
    );
}