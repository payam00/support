'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Spin, Alert, Descriptions, Card, Table, Tag, Typography, Row, Col, Divider } from 'antd';
import type { TableProps } from 'antd';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';

const { Title, Text, Paragraph } = Typography;

interface LineItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: string;
}

interface AddressInfo {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email?: string;
    phone?: string;
}

const WOOCOMMERCE_STATUS_PERSIAN: Record<string, string> = {
  'pending': 'در انتظار پرداخت',
  'processing': 'در حال انجام',
  'on-hold': 'در انتظار بررسی',
  'completed': 'تکمیل شده',
  'cancelled': 'لغو شده',
  'refunded': 'مسترد شده',
  'failed': 'ناموفق',
};

const WOOCOMMERCE_STATUS_COLORS: Record<string, string> = {
    'pending': 'gold',
    'processing': 'blue',
    'on-hold': 'orange',
    'completed': 'green',
    'cancelled': 'red',
    'refunded': 'purple',
    'failed': 'magenta',
};

export default function OrderDetailPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    if (orderId) {
      api.get(`/woocommerce/orders/${orderId}`)
        .then(res => setOrder(res.data))
        .catch(() => setError('خطا در دریافت جزئیات سفارش.'))
        .finally(() => setLoading(false));
    }
  }, [orderId]);
  
  const itemColumns: TableProps<LineItem>['columns'] = [
    { title: 'محصول', dataIndex: 'name', key: 'name' },
    { title: 'تعداد', dataIndex: 'quantity', key: 'quantity' },
    { title: 'قیمت واحد', dataIndex: 'price', key: 'price', render: (price: number) => `${price.toLocaleString()} تومان` },
    { title: 'جمع', dataIndex: 'total', key: 'total', render: (total: string) => `${Number(total).toLocaleString()} تومان` },
  ];

  if (loading) return <Spin fullscreen tip="در حال بارگذاری جزئیات سفارش..." />;
  if (error) return <Alert message="خطا" description={error} type="error" />;
  if (!order) return <Alert message="یافت نشد" description="سفارش مورد نظر یافت نشد." type="info" />;

  const trackingMeta = order.meta_data.find((meta: any) => meta.key === '_tracking_code');
  const lineItemsSubtotal = order.line_items.reduce((acc: number, item: LineItem) => acc + Number(item.total), 0);

  const AddressCard = ({ title, data }: { title: string, data: AddressInfo }) => (
    <Card title={title} style={{ height: '100%' }}>
        <Paragraph><strong>نام:</strong> {`${data.first_name} ${data.last_name}`}</Paragraph>
        {data.company && <Paragraph><strong>شرکت:</strong> {data.company}</Paragraph>}
        <Paragraph><strong>آدرس:</strong>{` ${data.address_1}${data.address_2 ? `, ${data.address_2}` : ''}, ${data.city}, استان ${data.state}, کدپستی ${data.postcode}`}</Paragraph>
        {data.email && <Paragraph><strong>ایمیل:</strong> {data.email}</Paragraph>}
        {data.phone && <Paragraph><strong>تلفن:</strong> {data.phone}</Paragraph>}
    </Card>
  );

  return (
    <div>
      <Title level={3}>جزئیات سفارش #{order.number}</Title>
      
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="تاریخ سفارش">{format(new Date(order.date_created), 'yyyy/MM/dd HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="وضعیت">
          <Tag color={WOOCOMMERCE_STATUS_COLORS[order.status] || 'default'}>
            {WOOCOMMERCE_STATUS_PERSIAN[order.status] || order.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="مشتری">{`${order.billing.first_name} ${order.billing.last_name}`}</Descriptions.Item>
        <Descriptions.Item label="نام کاربری">
            {order.customer_id > 0 ? 
                (<Text strong>{order.customer_username || `(کاربر #${order.customer_id})`}</Text>) 
                : (<Text type="secondary">مهمان</Text>)
            }
        </Descriptions.Item>
        <Descriptions.Item label="درگاه پرداخت">{order.payment_method_title}</Descriptions.Item>
        
        {/* --- شناسه پرداخت در اینجا نمایش داده می‌شود --- */}
        <Descriptions.Item label="شماره تراکنش (شناسه پرداخت)">
            {order.transaction_id ? <Text strong copyable>{order.transaction_id}</Text> : '-'}
        </Descriptions.Item>
        
        <Descriptions.Item label="کد رهگیری پستی" span={2}>
            {trackingMeta?.value ? <Text strong copyable>{trackingMeta.value}</Text> : 'هنوز ثبت نشده'}
        </Descriptions.Item>
      </Descriptions>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}><AddressCard title="اطلاعات صورت‌حساب (Billing)" data={order.billing} /></Col>
        <Col xs={24} md={12}><AddressCard title="اطلاعات ارسال (Shipping)" data={order.shipping} /></Col>
      </Row>

      <Card title="آیتم‌های سفارش">
        <Table columns={itemColumns} dataSource={order.line_items} rowKey="id" pagination={false} scroll={{ x: true }} />
        <div style={{ marginTop: 16, padding: '0 16px', textAlign: 'left' }}>
            <Row justify="end">
                <Col xs={24} sm={12} md={8}>
                    <Paragraph>جمع جزء: {lineItemsSubtotal.toLocaleString()} تومان</Paragraph>
                    <Paragraph>هزینه ارسال: {Number(order.shipping_total).toLocaleString()} تومان</Paragraph>
                    {order.fee_lines.map((fee: any) => (
                        <Paragraph key={fee.id}>{fee.name}: {Number(fee.total).toLocaleString()} تومان</Paragraph>
                    ))}
                    <Paragraph>تخفیف: <Text type="danger">{Number(order.discount_total).toLocaleString()} تومان</Text></Paragraph>
                    <Divider />
                    <Title level={5}>مبلغ نهایی: {Number(order.total).toLocaleString()} تومان</Title>
                </Col>
            </Row>
        </div>
      </Card>
    </div>
  );
}