export interface Ticket {
  _id: string;
  title: string;
  status: 'Awaiting AI' | 'Answered by AI' | 'Open' | 'Answered' | 'In-Progress' | 'Closed' | 'Referred';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt: string;
  department: Department;
  createdBy: UserInfo;
  messages: any[];
  assignedTo?: UserInfo | null;
   referralHistory: Referral[];
}
export interface Department {
  _id: string;
  name: string;
  head: UserInfo;
  operators?: UserInfo[];
  faqs: Faq[];
  knowledgeBaseText?: string;
  createdAt?: string;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
}
export interface UserInfo {
    _id: string;
    name: string;
    mobileNumber: string;
    role: 'user' | 'operator' | 'department_head' | 'admin';
    isActive: boolean;
    permissions?: {
        canCreateInvoice?: boolean;
        canViewAllInvoices?: boolean;
        canManageTickets?: boolean;
        canViewWooCommerceOrders?: boolean;
        canViewInvoiceStats?: boolean;
    };
}

export interface Message {
  _id: string;
  sender?: UserInfo; 
  senderType: 'user' | 'operator' | 'ai' | 'system'; 
  content: string;
  type: 'text' | 'voice';
  voiceDuration?: number;
  timestamp: string;
}
export interface VideoFlowQuestion {
  _id: string;
  text: string;
  nextFlow: string; 
}

export interface VideoFlow {
  _id: string;
  name: string;
  videoUrl: string;
  previewVideoUrl?: string;
  isRoot: boolean;
  questions: VideoFlowQuestion[];
}
export interface Referral {
    _id: string;
    referredBy: UserInfo; 
    note: string;
    referredAt: string;
    toDepartment?: Department; 
    fromDepartment: Department;
}
 export interface Order {
  id: number;
  number: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed' | string;
  date_created: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
  };
}
