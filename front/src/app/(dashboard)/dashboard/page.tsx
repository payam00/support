'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spin, Typography } from 'antd';
import UserTicketList from '@/app/components/dashboard/UserTicketList';
import OperatorTicketTable from '@/app/components/dashboard/OperatorTicketTable';

const { Title } = Typography;

export default function DashboardPage() {
  const { user, isLoading } = useAuth(); // Read user role from context

  if (isLoading) {
    return <Spin size="large" />;
  }

  const isOperator = user?.role === 'operator' || user?.role === 'department_head' || user?.role === 'admin';

  return (
    <div>
      <Title level={3}>داشبورد</Title>
      {isOperator ? <OperatorTicketTable /> : <UserTicketList />}
    </div>
  );
}