'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Steps, Select, Button, Form, Input, Typography, Collapse, Spin, notification, App } from 'antd';
import api from '@/lib/api';
import { Department, Faq } from '@/types';
import styles from './new-ticket.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function NewTicketPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState({ deps: true, faqs: false, form: false });
  const [form] = Form.useForm();
  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    // Fetch departments on component mount
    api.get('/departments')
      .then(res => setDepartments(res.data))
      .catch(() => notification.error({ message: 'خطا در دریافت لیست دپارتمان‌ها' }))
      .finally(() => setIsLoading(prev => ({ ...prev, deps: false })));
  }, []);

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDept(deptId);
    setIsLoading(prev => ({ ...prev, faqs: true }));
    api.get(`/departments/${deptId}/faqs`)
      .then(res => {
        setFaqs(res.data);
        if (res.data.length > 0) {
            setCurrentStep(1); // Move to FAQ step if FAQs exist
        } else {
            setCurrentStep(2); // Skip FAQ step if none exist
        }
      })
      .catch(() => notification.error({ message: 'خطا در دریافت سوالات متداول' }))
      .finally(() => setIsLoading(prev => ({ ...prev, faqs: false })));
  };

  const handleFormSubmit = async (values: any) => {
    setIsLoading(prev => ({ ...prev, form: true }));
    const ticketData = {
        ...values,
        department: selectedDept,
    };
    try {
        const response = await api.post('/tickets', ticketData);
 message.success('تیکت شما ثبت شد و هوش مصنوعی در حال بررسی آن است...');        router.push(`/tickets/${response.data.ticket._id}`);
    } catch (error: any) {
        notification.error({ message: 'خطا در ثبت تیکت', description: error.response?.data?.message });
    } finally {
        setIsLoading(prev => ({ ...prev, form: false }));
    }
  };

  const steps = [
    { title: 'انتخاب دپارتمان' },
    { title: 'بررسی سوالات متداول' },
    { title: 'ثبت اطلاعات تیکت' },
  ];

  return (
    <div>
      <Title level={3}>ثبت تیکت جدید</Title>
      <Text type="secondary">برای دریافت پاسخ سریع‌تر، لطفاً ابتدا دپارتمان صحیح را انتخاب کنید.</Text>
      
      <Steps current={currentStep} style={{ marginTop: 24 }} items={steps} />

      <div className={styles.stepContent}>
        {currentStep === 0 && (
          <Spin spinning={isLoading.deps}>
            <Title level={5}>۱. لطفاً دپارتمان مورد نظر را انتخاب کنید:</Title>
            <Select
              showSearch
              placeholder="جستجو و انتخاب دپارتمان..."
              style={{ width: '100%' }}
              onChange={handleDepartmentChange}
              options={departments.map(dep => ({ label: dep.name, value: dep._id }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Spin>
        )}

        {currentStep === 1 && (
          <Spin spinning={isLoading.faqs}>
            <Title level={5}>۲. شاید پاسخ شما اینجا باشد:</Title>
            {faqs.length > 0 ? (
                <Collapse accordion>
                    {faqs.map((faq, index) => (
                        <Panel header={faq.question} key={index}>
                            <p>{faq.answer}</p>
                        </Panel>
                    ))}
                </Collapse>
            ) : (
                <Text>سوالی برای این دپارتمان ثبت نشده است.</Text>
            )}
            <div className={styles.faqContainer}>
                <Button type="primary" onClick={() => setCurrentStep(2)}>
                    پاسخم را پیدا نکردم، ادامه ثبت تیکت
                </Button>
            </div>
          </Spin>
        )}

        {currentStep === 2 && (
          <div className={styles.formContainer}>
            <Title level={5}>۳. لطفاً مشخصات تیکت خود را وارد کنید:</Title>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
              <Form.Item name="title" label="عنوان تیکت" rules={[{ required: true, message: 'عنوان تیکت الزامی است.' }]}>
                <Input placeholder="مثال: مشکل در ورود به حساب کاربری" />
              </Form.Item>
              <Form.Item name="priority" label="اولویت" initialValue="Medium" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Low">پایین</Select.Option>
                  <Select.Option value="Medium">متوسط</Select.Option>
                  <Select.Option value="High">بالا</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="content" label="متن پیام اول" rules={[{ required: true, message: 'متن پیام الزامی است.' }]}>
                <Input.TextArea rows={6} placeholder="لطفاً مشکل خود را با جزئیات کامل شرح دهید..." />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoading.form}>
                  ثبت نهایی تیکت
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}