'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Divider, Form, Input, Spin, Typography } from 'antd'; 
import { EditOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import styles from './LoginPage.module.scss';
import { PinInput } from '@/app/components/common/PinInput';
import { useCountdown } from '@/hooks/useCountdown';
import Image from 'next/image';
const { Title, Text, Link } = Typography;
const RESEND_OTP_SECONDS = 120; // 2 minutes

export default function LoginPage() {
    const { notification } = App.useApp();
    const [form] = Form.useForm();
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');
    const router = useRouter();
    const { minutes, remainingSeconds, isRunning, start: startCountdown } = useCountdown(RESEND_OTP_SECONDS);
    
    const handleRequestOtp = async (values: { mobileNumber: string }) => {
        setIsLoading(true);
        try {
            await api.post('/auth/request-otp', { mobileNumber: values.mobileNumber });
            notification.success({ message: 'اعتبار سنجی', description: 'کد یکبار مصرف ارسال شد.', placement: 'bottomLeft' });
            setMobileNumber(values.mobileNumber);
            setIsOtpSent(true);
            startCountdown();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'خطا در ارسال کد';
            if (error.response?.status === 429) {
                notification.error({ message: 'خطا', description: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید.', placement: 'bottomLeft'});
            } else {
                notification.error({ message: 'خطا', description: errorMessage, placement: 'bottomLeft' });
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVerifyOtp = async (otp: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', { mobileNumber, otp });
            const { token } = response.data;
            Cookies.set('authToken', token, { expires: 1, path: '/' });
            notification.success({ message: 'اعتبار سنجی', description: 'ورود با موفقیت انجام شد!', placement: 'bottomLeft' });
            router.push('/dashboard');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'کد وارد شده صحیح نیست.';
            notification.error({ message: 'خطا', description: errorMessage, placement: 'bottomLeft' });
            // Consider resetting the PIN input on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const resendOtp = () => {
        handleRequestOtp({ mobileNumber });
    }

    return (
        <div className={styles.loginPage}>
            <main className={styles.contentWrapper}>
                <section className={styles.formSection}>
                    <Spin spinning={isLoading}>
                        <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <SafetyOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                                <Title level={3} style={{ marginTop: 16 }}>
                                    {isOtpSent ? 'تایید کد یکبار مصرف' : 'ورود به سامانه'}
                                </Title>
                                <Text type="secondary">
                                    {isOtpSent ? `کد ارسال شده به شماره ${mobileNumber} را وارد کنید.` : 'لطفا شماره موبایل خود را وارد نمایید.'}
                                </Text>
                            </div>
    
                            {!isOtpSent ? (
                                <Form form={form} onFinish={handleRequestOtp} layout="vertical" size="large">
                                    <Form.Item name="mobileNumber" rules={[{ required: true, message: 'شماره موبایل الزامی است.' }, { pattern: /^09\d{9}$/, message: 'فرمت شماره موبایل صحیح نیست.' }]}>
                                        <Input prefix={<PhoneOutlined />} placeholder="09123456789" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={isLoading} block>
                                            ارسال کد تایید
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ) : (
                                <>
                                    <PinInput onComplete={handleVerifyOtp} disabled={isLoading} />
                                    <div className={styles.resendTimer}>
                                        {isRunning ? (
                                            <Text type="secondary">
                                                ارسال مجدد کد تا {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')} دیگر
                                            </Text>
                                        ) : (
                                            <Button type="link" onClick={resendOtp} disabled={isLoading}>
                                                ارسال مجدد کد
                                            </Button>
                                        )}
                                    </div>
                                    <Divider />
                                    <Button icon={<EditOutlined />} onClick={() => setIsOtpSent(false)} block>
                                        ویرایش شماره موبایل
                                    </Button>
                                </>
                            )}
                        </div>
                    </Spin>
                </section>
                <section className={styles.brandingSection}>
                    <Image
                        src="/images/logo.png"
                        alt="لوگوی سامانه پشتیبانی"
                        width={120}
                        height={80}
                        priority // Tells Next.js to load this image first
                        style={{ borderRadius: '1%', marginBottom: '24px' }}
                    />
                    <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>سامانه پشتیبانی هوشمند</Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    آکادمی آنلاین زبان افاق
                    </Text>
                </section>
            </main>
        </div>
    );
}