// File: ticketing-system-frontend/src/app/(dashboard)/tickets/page.tsx

'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spin, Typography } from 'antd';
// It seems you have these components, make sure the import path is correct
import UserTicketList from '@/app/components/dashboard/UserTicketList'; 
import OperatorTicketTable from '@/app/components/dashboard/OperatorTicketTable';

const { Title } = Typography;

export default function TicketsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <Spin size="large" fullscreen />;
  }

  // Determine if the user is a staff member based on role or specific permission
  const isStaff = user.role === 'admin' || user.permissions?.canManageTickets;

  return (
    <div>
      <Title level={2}>{isStaff ? 'مدیریت تیکت‌ها' : 'تیکت‌های من'}</Title>
      {isStaff ? <OperatorTicketTable /> : <UserTicketList />}
    </div>
  );
}
