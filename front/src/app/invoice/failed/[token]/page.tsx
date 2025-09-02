'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Result, Button } from 'antd';
import Link from 'next/link';

export default function PaymentFailedPage() {
    const params = useParams();
    const token = params.token as string;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <Result
                status="error"
                title="تراکنش ناموفق بود یا توسط شما لغو شد"
                subTitle="لطفاً دوباره تلاش کنید. در صورت کسر وجه، مبلغ تا ۷۲ ساعت آینده به حساب شما باز خواهد گشت."
                extra={[
                    // // --- FIX: Button is now a Link that goes directly to the invoice page ---
                    // <Link href={`/invoice/${token}`} key="back">
                    //     <Button type="primary">
                    //         بازگشت به پیش‌فاکتور
                    //     </Button>
                    // </Link>,
                ]}
            />
        </div>
    );
}