'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Result, Button, Spin, Card, Descriptions } from 'antd';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';

export default function PaymentSuccessPage() {
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    useEffect(() => {
        if (token) {
            api.get(`/invoices/public/${token}`)
                .then(res => setInvoice(res.data))
                .finally(() => setLoading(false));
        }
    }, [token]);

    if (loading) {
        return <Spin fullscreen />;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <Result
                status="success"
                title="پرداخت شما با موفقیت انجام شد"
                subTitle="خلاصه اطلاعات تراکنش در زیر آمده است."
                extra={[
                    <Button type="primary" key="dashboard" onClick={() => router.push('/dashboard')}>
                        بازگشت به پنل کاربری
                    </Button>,
                ]}
            >
                {invoice && (
                    <Card>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="نام مشتری">{invoice.fullName}</Descriptions.Item>
                            <Descriptions.Item label="مبلغ پرداخت شده">{invoice.finalAmount.toLocaleString()} ریال</Descriptions.Item>
                            <Descriptions.Item label="شماره پیگیری">{invoice.paymentRefId}</Descriptions.Item>
                            <Descriptions.Item label="تاریخ پرداخت">{format(new Date(invoice.updatedAt), 'yyyy/MM/dd - HH:mm')}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}
            </Result>
        </div>
    );
}