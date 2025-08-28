'use client';

import React, { useState, useEffect } from 'react';
import { App, Button, List, Typography, Spin, Popconfirm, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { Faq } from '@/types'; // Faq type needs to have _id

// Note: The backend schema for FAQ sub-documents needs an _id. 
// If it was created with { _id: false }, this page won't work correctly for edit/delete.
// Assuming we've updated the backend schema to allow _id for sub-documents.

interface DepartmentFaqs {
  _id: string;
  name: string;
  faqs: (Faq & { _id: string })[];
}

export default function ManageFaqsPage() {
  const [department, setDepartment] = useState<DepartmentFaqs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq & { _id: string } | null>(null);
  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  const fetchMyDepartmentFaqs = () => {
    setIsLoading(true);
    api.get('/departments/my-department')
      .then(res => setDepartment(res.data))
      .catch(() => notification.error({ message: 'خطا', description: 'دپارتمان شما یافت نشد.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchMyDepartmentFaqs, []);
  
  const showAddModal = () => {
    setEditingFaq(null);
    form.resetFields();
    setIsModalVisible(true);
  };
  
  const showEditModal = (faq: Faq & { _id: string }) => {
    setEditingFaq(faq);
    form.setFieldsValue(faq);
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values: { question: string; answer: string }) => {
    const apiCall = editingFaq
      ? api.put(`/departments/${department?._id}/faqs/${editingFaq._id}`, values)
      : api.post(`/departments/${department?._id}/faqs`, values);

    try {
      await apiCall;
      message.success(`سوال متداول با موفقیت ${editingFaq ? 'ویرایش' : 'ایجاد'} شد.`);
      fetchMyDepartmentFaqs();
      setIsModalVisible(false);
    } catch (error: any) {
      notification.error({ message: 'خطا', description: error.response?.data?.message });
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      await api.delete(`/departments/${department?._id}/faqs/${faqId}`);
      message.success('سوال متداول با موفقیت حذف شد.');
      fetchMyDepartmentFaqs();
    } catch (error: any) {
      notification.error({ message: 'خطا در حذف سوال', description: error.response?.data?.message });
    }
  };

  if (isLoading) return <Spin fullscreen />;
  if (!department) return <Typography.Text>شما دسترسی به این بخش را ندارید.</Typography.Text>;

  return (
    <div>
      <Typography.Title level={3}>مدیریت سوالات متداول دپارتمان: {department.name}</Typography.Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ marginBottom: 16 }}>
        افزودن سوال جدید
      </Button>
      <List
        bordered
        dataSource={department.faqs}
        renderItem={(faq) => (
          <List.Item
            actions={[
              <Button key="edit" icon={<EditOutlined />} onClick={() => showEditModal(faq)}>ویرایش</Button>,
              <Popconfirm key="delete" title="آیا از حذف این سوال مطمئن هستید؟" onConfirm={() => handleDeleteFaq(faq._id)}>
                <Button icon={<DeleteOutlined />} danger>حذف</Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta title={faq.question} description={faq.answer} />
          </List.Item>
        )}
      />
      <Modal
        title={editingFaq ? 'ویرایش سوال متداول' : 'افزودن سوال متداول'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Form.Item name="question" label="سوال" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="answer" label="پاسخ" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">ذخیره</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}