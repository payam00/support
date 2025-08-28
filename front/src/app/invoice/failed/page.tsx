'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Result, Button } from 'antd';

export default function PaymentFailedPage() {
    const router = useRouter();

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <Result
                status="error"
                title="تراکنش ناموفق بود یا توسط شما لغو شد"
                subTitle="لطفاً دوباره تلاش کنید. در صورت کسر وجه، مبلغ تا ۷۲ ساعت آینده به حساب شما باز خواهد گشت."
                extra={[
                    <Button type="primary" key="dashboard" onClick={() => router.push('/dashboard')}>
                        بازگشت به پنل کاربری
                    </Button>,
                ]}
            />
        </div>
    );
}