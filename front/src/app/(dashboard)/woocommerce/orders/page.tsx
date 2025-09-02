'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Spin, Alert, Pagination, Button, Tooltip, Input, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns-jalali';
import { WOOCOMMERCE_STATUS_COLORS, WOOCOMMERCE_STATUS_PERSIAN } from '@/lib/localization';
import type { Order } from '@/types/index';
const { Search } = Input;




export default function WooCommerceOrdersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/woocommerce/orders', {
      params: {
        page: pagination.current,
        per_page: pagination.pageSize,
        search: searchTerm || undefined,
      }
    })
      .then(res => setData(res.data))
      .catch(() => setError('خطا در دریافت سفارشات از سایت وردپرس.'))
      .finally(() => setLoading(false));
  }, [pagination.current, pagination.pageSize, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchOrders]);
  
  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize: pageSize });
  };

  const columns: TableProps<Order>['columns'] = [
    { title: 'شماره سفارش', dataIndex: 'number', key: 'number' },
    { title: 'مشتری', dataIndex: ['billing', 'first_name'], key: 'customer', 
      render: (_: any, record: Order) => `${record.billing.first_name} ${record.billing.last_name}` 
    },
    { title: 'تاریخ', dataIndex: 'date_created', key: 'date', 
      render: (date: string) => format(new Date(date), 'yyyy/MM/dd HH:mm') 
    },
    { title: 'وضعیت', dataIndex: 'status', key: 'status',
      // NEW: Use localization for status
      render: (status: string) => (
        <Tag color={WOOCOMMERCE_STATUS_COLORS[status] || 'default'}>
          {WOOCOMMERCE_STATUS_PERSIAN[status] || status}
        </Tag>
      )
    },
    { title: 'مبلغ کل', dataIndex: 'total', key: 'total', 
      render: (total: string) => `${Number(total).toLocaleString()} تومان` 
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_: any, record: Order) => (
        <Tooltip title="مشاهده جزئیات">
          <Button icon={<EyeOutlined />} onClick={() => router.push(`/woocommerce/orders/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  if (error) return <Alert message="خطا" description={error} type="error" />;

  return (
    <Spin spinning={loading}>
      {/* --- NEW: Search Input --- */}
      <Search
        placeholder="جستجو در نام مشتری، ایمیل، شماره سفارش..."
        onSearch={(value) => { setPagination({ ...pagination, current: 1 }); setSearchTerm(value); }}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
      />
      
      <Table columns={columns} dataSource={data?.orders} rowKey="id" pagination={false} />
      
      <Pagination
        style={{ marginTop: 16, textAlign: 'center' }}
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={data?.total}
        onChange={handleTableChange}
        showSizeChanger
      />
    </Spin>
  );
}