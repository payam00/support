'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Typography } from 'antd';
import api from '@/lib/api';
import { Ticket } from '@/types';
import { useAuth } from '@/context/AuthContext';
import TicketTable from './TicketTable';

const { Text } = Typography;

export default function OperatorTicketDashboard() {
    const [mainTickets, setMainTickets] = useState<Ticket[]>([]);
    const [referredTickets, setReferredTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState({ main: true, referred: true });
    const { user } = useAuth();

    const isManager = user?.role === 'department_head' || user?.role === 'admin';

    useEffect(() => {
        if(user){
            // Fetch main tickets (all for manager, specific for operator)
            setIsLoading(prev => ({ ...prev, main: true }));
            api.get('/tickets')
                .then(res => setMainTickets(res.data))
                .finally(() => setIsLoading(p => ({...p, main: false})));

            // Fetch referred tickets only if user is a manager
            if (isManager) {
                setIsLoading(prev => ({ ...prev, referred: true }));
                api.get('/tickets?view=referred')
                    .then(res => setReferredTickets(res.data))
                    .finally(() => setIsLoading(p => ({...p, referred: false})));
            }
        }
    }, [user, isManager]);

    const { unassignedTickets, myTickets } = useMemo(() => {
        if (!mainTickets) return { unassignedTickets: [], myTickets: [] };
        const unassigned = mainTickets.filter(t => !t.assignedTo);
        const my = mainTickets.filter(t => t.assignedTo?._id === user?._id);
        return { unassignedTickets: unassigned, myTickets: my };
    }, [mainTickets, user]);
    
    const getTabItems = () => {
        const tabs = [
            {
                key: 'new-tickets',
                label: `تیکت‌های جدید (${unassignedTickets.length})`,
                children: <TicketTable tickets={unassignedTickets} isLoading={isLoading.main} />,
            },
            {
                key: 'my-tickets',
                label: `تیکت‌های من (${myTickets.length})`,
                children: <TicketTable tickets={myTickets} isLoading={isLoading.main} />,
            }
        ];
        
        if (isManager) {
            tabs.push({
                key: 'all-tickets',
                label: `همه تیکت‌ها (${mainTickets.length})`,
                children: <TicketTable tickets={mainTickets} isLoading={isLoading.main} />,
            });
            tabs.push({
                key: 'referred-tickets',
                label: `ارجاع شده به شما (${referredTickets.length})`,
                children: <TicketTable tickets={referredTickets} isLoading={isLoading.referred} />,
            });
        }
        return tabs;
    };

    return (
        <div>
            <Text type="secondary">در این بخش می‌توانید تیکت‌های مربوط به دپارتمان(های) خود را مدیریت کنید.</Text>
            <Tabs defaultActiveKey="new-tickets" items={getTabItems()} />
        </div>
    );
}