'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { App, Avatar, Button, Dropdown, Layout, Menu, notification, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  AppstoreAddOutlined,
  UsergroupAddOutlined,
  LineChartOutlined,
  DownloadOutlined,
  VideoCameraAddOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  GiftOutlined,
  BookOutlined,
  EditOutlined,
  MessageOutlined,
  NotificationOutlined 
} from '@ant-design/icons';
import styles from './layout.module.scss';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { UserInfo } from '@/types';
import 'moment/locale/fa';
import 'antd-jalali-moment';

const { Header, Content, Footer, Sider } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    api.get('/auth/me')
      .then(response => {
        const fetchedUser = response.data;
        setUser(fetchedUser);
        if (!fetchedUser.name && pathname !== '/auth/complete-profile') {
          router.replace('/auth/complete-profile');
        }
      })
      .catch(() => {
        Cookies.remove('authToken');
        router.replace('/auth/login');
        notification.error({
          message: 'نشست شما منقضی شده',
          description: 'لطفاً مجدداً وارد شوید.',
          placement: 'bottomLeft'
        });
      })
      .finally(() => setIsLoading(false));
  }, [router, pathname, notification]);

  const handleLogout = () => {
    Cookies.remove('authToken');
    message.success('با موفقیت از حساب خود خارج شدید.');
    router.push('/auth/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'logout', label: 'خروج از حساب', icon: <LogoutOutlined />, onClick: handleLogout, danger: true },
  ];
  
  const mainMenuItems = useMemo((): MenuProps['items'] => {
    if (!user) return [];
    
    // Define access flags based on roles and permissions
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'department_head' || isAdmin;
    const canManageTickets = user.permissions?.canManageTickets || isAdmin;
    const canViewWooOrders = user.permissions?.canViewWooCommerceOrders || isAdmin;
    const canCreateInvoices = user.permissions?.canCreateInvoice || isAdmin;
    const canViewInvoiceStats = user.permissions?.canViewInvoiceStats || isAdmin;

    return [
      { key: '/dashboard', icon: <HomeOutlined />, label: <Link href="/dashboard">داشبورد</Link> },
         (user.role === 'user' || canManageTickets) && { 
        key: 'tickets-main', 
        icon: <MessageOutlined />, 
        label: 'تیکت‌ها',
        children: [
            user.role === 'user' && { key: '/tickets/new', label: <Link href="/tickets/new">تیکت جدید</Link> },
            { key: '/tickets', label: <Link href="/tickets">لیست تیکت‌ها</Link> },
        ].filter(Boolean)
      },

      canViewWooOrders ? { key: '/woocommerce/orders', icon: <BookOutlined />, label: <Link href="/woocommerce/orders">سفارشات سایت کتاب</Link> } : null,
      
      canCreateInvoices ? {
        key: 'invoicing',
        icon: <DollarCircleOutlined />,
        label: 'مدیریت فاکتورها',
        children: [
          { key: '/invoices/create', icon: <PlusCircleOutlined />, label: <Link href="/invoices/create">صدور فاکتور جدید</Link> },
          { key: '/invoices', icon: <FileTextOutlined />, label: <Link href="/invoices">لیست فاکتورها</Link> },
        ]
      } : null,

(isManager || canViewInvoiceStats) && {
        key: 'stats',
        icon: <LineChartOutlined />,
        label: 'آمارها',
        children: [
            isManager && { key: '/stats', label: <Link href="/stats">آمار تیکت‌ها</Link> },
            canViewInvoiceStats && { key: '/invoice-stats', label: <Link href="/invoice-stats">آمار فاکتورها</Link> }
        ].filter(Boolean)
      },      
      isManager ? {
        key: 'management',
        icon: <TeamOutlined />,
        label: 'مدیریت دپارتمان',
        children: [
          { key: '/manage/operators', icon: <UserOutlined />, label: <Link href="/manage/operators">مدیریت اپراتورها</Link> },
          { key: '/manage/faqs', icon: <QuestionCircleOutlined />, label: <Link href="/manage/faqs">مدیریت سوالات متداول</Link> },
        ]
      } : null,

      isAdmin ? {
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'پنل ادمین',
        children: [
            { key: '/admin/departments', icon: <AppstoreAddOutlined />, label: <Link href="/admin/departments">مدیریت دپارتمان‌ها</Link> },
            { key: '/admin/users', icon: <UsergroupAddOutlined />, label: <Link href="/admin/users">مدیریت کاربران</Link> },
            { key: '/admin/class-types', icon: <EditOutlined />, label: <Link href="/admin/class-types">مدیریت انواع کلاس</Link> },
            { key: '/admin/discounts', icon: <GiftOutlined />, label: <Link href="/admin/discounts">مدیریت تخفیف‌ها</Link> },
            { key: '/admin/settings', icon: <SettingOutlined />, label: <Link href="/admin/settings">تنظیمات اصلی</Link> },
            { key: '/admin/video-flows', icon: <VideoCameraAddOutlined />, label: <Link href="/admin/video-flows">مدیریت ویجت ویدیو</Link> },
            { key: '/admin/announcements', icon: <NotificationOutlined />, label: <Link href="/admin/announcements">مدیریت اطلاعیه‌ها</Link> },
            { key: '/admin/export', icon: <DownloadOutlined />, label: <Link href="/admin/export">خروجی تیکت‌ها (CSV)</Link> },
        ]
      } : null,
    ].filter(Boolean) as MenuProps['items'];
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="در حال بررسی اطلاعات کاربری..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      <Layout className={styles.topLayout}>
        <Sider 
          width={250} 
          breakpoint="lg" 
          collapsedWidth={0} 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          onCollapse={(c: boolean) => setCollapsed(c)} 
          className={styles.sider}
        >
          <div className={styles.siderLogo}><Link href="/dashboard" /></div>
          <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={mainMenuItems} />
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)} 
              className={styles.collapseTrigger} 
            />
            <div className={styles.headerMenu}>
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                <div className={styles.userProfile}>
                  <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                  <span className={styles.userName}>{user?.name || 'کاربر'}</span>
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content className={styles.content}>
            <div className={styles.contentInner}>{children}</div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            سامانه تیکتینگ هوشمند ©۲۰۲۵
          </Footer>
        </Layout>
      </Layout>
    </AuthContext.Provider>
  );
}