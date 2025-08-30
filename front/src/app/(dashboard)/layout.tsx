'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { App, Avatar, Button, Dropdown, Layout, Menu, notification, Spin, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined, LogoutOutlined, HomeOutlined, PlusCircleOutlined, TeamOutlined, QuestionCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, AppstoreAddOutlined, UsergroupAddOutlined,
  LineChartOutlined, FileTextOutlined, DollarCircleOutlined, GiftOutlined, BookOutlined, MessageOutlined,
  BellOutlined, NotificationOutlined,
} from '@ant-design/icons';
import styles from './layout.module.scss';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { UserInfo } from '@/types';
import { usePushNotifications } from '@/lib/usePushNotifications';
import 'moment/locale/fa';
import 'antd-jalali-moment';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const { isSubscribed, subscribeToPush, subscriptionError } = usePushNotifications();

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    api.get('/auth/me')
      .then(response => setUser(response.data))
      .catch(() => {
        Cookies.remove('authToken');
        router.replace('/auth/login');
        notification.error({ message: 'نشست شما منقضی شده', description: 'لطفاً مجدداً وارد شوید.' });
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('authToken');
    message.success('با موفقیت از حساب خود خارج شدید.');
    router.push('/auth/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'logout', label: 'خروج از حساب', icon: <LogoutOutlined />, onClick: handleLogout, danger: true },
  ];
  
  // --- FINAL AND TYPE-SAFE MENU LOGIC ---
  const mainMenuItems = useMemo((): MenuProps['items'] => {
    if (!user) return [];
    
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'department_head' || isAdmin;
    const canManageTickets = user.permissions?.canManageTickets || isAdmin;
    const canViewWooOrders = user.permissions?.canViewWooCommerceOrders || isAdmin;
    const canCreateInvoices = user.permissions?.canCreateInvoice || isAdmin;
    const canViewInvoiceStats = user.permissions?.canViewInvoiceStats || isAdmin;

    const items = [
      { key: '/dashboard', icon: <HomeOutlined />, label: <Link href="/dashboard">داشبورد اصلی</Link> },
      
      (user.role === 'user' || canManageTickets) && { 
        key: 'tickets-main', 
        icon: <MessageOutlined />, 
        label: 'تیکت‌ها',
        children: [
            user.role === 'user' && { key: '/tickets/new', label: <Link href="/tickets/new">تیکت جدید</Link> },
            { key: '/tickets', label: <Link href="/tickets">لیست تیکت‌ها</Link> },
        ].filter(Boolean)
      },
      
      canViewWooOrders && { key: '/woocommerce/orders', icon: <BookOutlined />, label: <Link href="/woocommerce/orders">سفارشات سایت کتاب</Link> },
      
      canCreateInvoices && {
        key: 'invoicing',
        icon: <DollarCircleOutlined />,
        label: 'مدیریت فاکتورها',
        children: [
            { key: '/invoices/create', icon: <PlusCircleOutlined />, label: <Link href="/invoices/create">صدور فاکتور جدید</Link> },
            { key: '/invoices', icon: <FileTextOutlined />, label: <Link href="/invoices">لیست فاکتورها</Link> },
        ]
      },
      
      (isManager || canViewInvoiceStats) && {
        key: 'stats-group',
        icon: <LineChartOutlined />,
        label: 'آمارها',
        children: [
            isManager && { key: '/stats', label: <Link href="/stats">آمار تیکت‌ها</Link> },
            canViewInvoiceStats && { key: '/invoice-stats', label: <Link href="/invoice-stats">آمار فاکتورها</Link> }
        ].filter(Boolean)
      },

      isAdmin && {
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'پنل ادمین',
        children: [
            { key: '/admin/departments', label: <Link href="/admin/departments">مدیریت دپارتمان‌ها</Link> },
            { key: '/admin/users', label: <Link href="/admin/users">مدیریت کاربران</Link> },
            { key: '/admin/announcements', label: <Link href="/admin/announcements">مدیریت اطلاعیه‌ها</Link> },
            { key: '/admin/class-types', label: <Link href="/admin/class-types">مدیریت انواع کلاس</Link> },
            { key: '/admin/discounts', label: <Link href="/admin/discounts">مدیریت تخفیف‌ها</Link> },
            { key: '/admin/settings', label: <Link href="/admin/settings">تنظیمات اصلی</Link> },
        ]
      },
    ];

    // The final .filter(Boolean) removes all 'false' values from the array,
    // and the type assertion `as MenuProps['items']` tells TypeScript the result is valid.
    return items.filter(Boolean) as MenuProps['items'];
  }, [user]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" tip="در حال بررسی اطلاعات کاربری..." /></div>;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      <Layout className={styles.topLayout}>
        <Sider width={250} breakpoint="lg" collapsedWidth={0} trigger={null} collapsible collapsed={collapsed} onCollapse={(c: boolean) => setCollapsed(c)} className={styles.sider}>
          <div className={styles.siderLogo}><Link href="/dashboard"><img src="/images/logo.png" alt="Logo" style={{ maxHeight: '40px' }} /></Link></div>
          <Menu theme="dark" mode="inline" defaultOpenKeys={['tickets-main', 'invoicing', 'stats-group', 'admin']} selectedKeys={[pathname]} items={mainMenuItems} />
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} className={styles.collapseTrigger} />
            <div className={styles.headerMenu}>
              {user && user.role !== 'user' && !isSubscribed && (
                <Tooltip title="فعال‌سازی نوتیفیکیشن‌ها">
                  <Avatar icon={<BellOutlined />} onClick={subscribeToPush} style={{ cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 8px' }}/>
                </Tooltip>
              )}
              {subscriptionError && <Text type="danger" style={{ color: '#ff4d4f', marginRight: '16px' }}>خطا در فعال‌سازی</Text>}
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
          <Footer style={{ textAlign: 'center' }}>سامانه تیکتینگ هوشمند ©۲۰۲۵</Footer>
        </Layout>
      </Layout>
    </AuthContext.Provider>
  );
}