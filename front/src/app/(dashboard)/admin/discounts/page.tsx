'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, Switch, Tag, Pagination, message as antdMessage } from 'antd';
import { PlusOutlined, AppstoreAddOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import api from '@/lib/api';
import { format } from 'date-fns-jalali';
import fileDownload from 'js-file-download';

const { Option } = Select;

interface Discount {
    _id: string;
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    usageLimit: number;
    timesUsed: number;
    isActive: boolean;
    expiresAt?: string;
}

export default function ManageDiscountsPage() {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [isSingleModalVisible, setIsSingleModalVisible] = useState(false);
    const [isBulkCreateModalVisible, setIsBulkCreateModalVisible] = useState(false);
    const [isBulkEditModalVisible, setIsBulkEditModalVisible] = useState(false);
    
    const [singleForm] = Form.useForm();
    const [bulkCreateForm] = Form.useForm();
    const [bulkEditForm] = Form.useForm();

    const { message, notification, modal } = App.useApp();

    const fetchDiscounts = useCallback((page = 1, pageSize = 10) => {
        setIsLoading(true);
        api.get('/discounts', { params: { page, limit: pageSize } })
        .then(res => {
            setDiscounts(res.data.discounts);
            setPagination({ current: res.data.page, pageSize, total: res.data.total });
        })
        .catch(() => notification.error({ message: 'خطا در دریافت لیست تخفیف‌ها' }))
        .finally(() => setIsLoading(false));
    }, [notification]);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    const handleTableChange = (newPage: number, newPageSize: number) => {
        fetchDiscounts(newPage, newPageSize);
    };

    const hasSelected = selectedRowKeys.length > 0;

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = { selectedRowKeys, onChange: onSelectChange };

    const handleSingleCreate = async (values: any) => {
        setIsSubmitting(true);
        try {
            await api.post('/discounts', values);
            message.success('کد تخفیف با موفقیت ایجاد شد.');
            fetchDiscounts();
            setIsSingleModalVisible(false);
            singleForm.resetFields();
        } catch (error: any) {
            notification.error({ message: 'خطا در ایجاد کد', description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleBulkCreate = async (values: any) => {
        setIsSubmitting(true);
        try {
            const response = await api.post('/discounts/bulk', values, { responseType: 'blob' });
            fileDownload(response.data, `discounts-${Date.now()}.csv`);
            message.success('کدهای تخفیف با موفقیت ساخته و فایل دانلود شد.');
            fetchDiscounts();
            setIsBulkCreateModalVisible(false);
            bulkCreateForm.resetFields();
        } catch (error: any) {
            notification.error({ message: 'خطا در ساخت کدهای گروهی', description: 'لطفاً لاگ سرور را بررسی کنید.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = () => {
        modal.confirm({
            title: `آیا از حذف ${selectedRowKeys.length} کد تخفیف مطمئن هستید؟`,
            content: 'این عملیات غیرقابل بازگشت است.',
            okText: 'بله، حذف کن',
            cancelText: 'انصراف',
            onOk: async () => {
                try {
                    const res = await api.post('/discounts/bulk-actions', { ids: selectedRowKeys, action: 'delete' });
                    antdMessage.success(res.data.message);
                    fetchDiscounts();
                    setSelectedRowKeys([]);
                } catch (error) { notification.error({ message: 'خطا در حذف گروهی' }); }
            }
        });
    };
    
    const handleBulkEdit = async (values: any) => {
        setIsSubmitting(true);
        const payload = Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
        if (Object.keys(payload).length === 0) {
            message.warning('هیچ تغییری برای اعمال مشخص نشده است.');
            setIsSubmitting(false);
            return;
        }
        try {
            const res = await api.post('/discounts/bulk-actions', { ids: selectedRowKeys, action: 'update', payload });
            antdMessage.success(res.data.message);
            fetchDiscounts();
            setSelectedRowKeys([]);
            setIsBulkEditModalVisible(false);
            bulkEditForm.resetFields();
        } catch (error) {
            notification.error({ message: 'خطا در ویرایش گروهی' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const columns: TableProps<Discount>['columns'] = [
        { title: 'کد', dataIndex: 'code', key: 'code' },
        { title: 'نوع', dataIndex: 'type', key: 'type', render: (type) => type === 'percentage' ? 'درصدی' : 'مبلغ ثابت' },
        { title: 'مقدار', dataIndex: 'value', key: 'value', render: (val, rec) => rec.type === 'percentage' ? `${val}%` : `${val.toLocaleString()} ریال` },
        { title: 'محدودیت استفاده', dataIndex: 'usageLimit', key: 'usageLimit' },
        { title: 'تعداد استفاده شده', dataIndex: 'timesUsed', key: 'timesUsed' },
        { title: 'وضعیت', dataIndex: 'isActive', key: 'isActive', render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'فعال' : 'غیرفعال'}</Tag> },
        { title: 'تاریخ انقضا', dataIndex: 'expiresAt', key: 'expiresAt', render: (date) => date ? format(new Date(date), 'yyyy/MM/dd') : 'نامحدود' },
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSingleModalVisible(true)}>ایجاد تکی</Button>
                <Button icon={<AppstoreAddOutlined />} onClick={() => setIsBulkCreateModalVisible(true)}>ایجاد گروهی</Button>
                 {hasSelected && (
                    <Space>
                        <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>حذف ({selectedRowKeys.length})</Button>
                        <Button icon={<EditOutlined />} onClick={() => setIsBulkEditModalVisible(true)}>ویرایش ({selectedRowKeys.length})</Button>
                    </Space>
                 )}
            </Space>

            <Table rowSelection={rowSelection} loading={isLoading} columns={columns} dataSource={discounts} rowKey="_id" pagination={false} />
            <Pagination style={{ marginTop: 16, textAlign: 'center' }} current={pagination.current} pageSize={pagination.pageSize} total={pagination.total} onChange={handleTableChange} showSizeChanger />
            
            <Modal title="ایجاد کد تخفیف جدید" open={isSingleModalVisible} onCancel={() => setIsSingleModalVisible(false)} onOk={() => singleForm.submit()} confirmLoading={isSubmitting}>
                <Form form={singleForm} layout="vertical" onFinish={handleSingleCreate} initialValues={{ type: 'percentage', usageLimit: 1 }}>
                    <Form.Item name="code" label="کد تخفیف (به حروف بزرگ)" rules={[{ required: true }]}><Input style={{ textTransform: 'uppercase' }} /></Form.Item>
                    <Form.Item name="type" label="نوع تخفیف" rules={[{ required: true }]}>
                        <Select><Option value="percentage">درصدی</Option><Option value="fixed_amount">مبلغ ثابت</Option></Select>
                    </Form.Item>
                    <Form.Item name="value" label="مقدار" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                    <Form.Item name="usageLimit" label="محدودیت تعداد استفاده" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                    <Form.Item name="expiresAt" label="تاریخ انقضا (اختیاری)"><DatePicker style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            <Modal title="ایجاد کدهای تخفیف گروهی" open={isBulkCreateModalVisible} onCancel={() => setIsBulkCreateModalVisible(false)} onOk={() => bulkCreateForm.submit()} confirmLoading={isSubmitting}>
                <Form form={bulkCreateForm} layout="vertical" onFinish={handleBulkCreate} initialValues={{ type: 'fixed_amount', usageLimit: 1 }}>
                    <Form.Item name="count" label="تعداد کد برای ساخت" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} max={500} /></Form.Item>
                    <Form.Item name="prefix" label="پیشوند کدها (اختیاری)"><Input placeholder="مثال: NOWRUZ" style={{ textTransform: 'uppercase' }} /></Form.Item>
                    <Form.Item name="type" label="نوع تخفیف" rules={[{ required: true }]}>
                         <Select><Option value="percentage">درصدی</Option><Option value="fixed_amount">مبلغ ثابت</Option></Select>
                    </Form.Item>
                     <Form.Item name="value" label="مقدار" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                    <Form.Item name="usageLimit" label="محدودیت استفاده برای هر کد" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                    <Form.Item name="expiresAt" label="تاریخ انقضا (اختیاری)"><DatePicker style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            <Modal title={`ویرایش گروهی ${selectedRowKeys.length} کد تخفیف`} open={isBulkEditModalVisible} onCancel={() => setIsBulkEditModalVisible(false)} onOk={() => bulkEditForm.submit()} confirmLoading={isSubmitting}>
                <p>فقط فیلدهایی را پر کنید که قصد تغییر آن‌ها را دارید.</p>
                <Form form={bulkEditForm} layout="vertical" onFinish={handleBulkEdit}>
                    <Form.Item name="usageLimit" label="تغییر محدودیت استفاده"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                    <Form.Item name="expiresAt" label="تغییر تاریخ انقضا"><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="isActive" label="تغییر وضعیت" >
                         <Select placeholder="انتخاب کنید..." allowClear><Option value={true}>فعال</Option><Option value={false}>غیرفعال</Option></Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}