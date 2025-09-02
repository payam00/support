// Final and correct version of the types file

export interface UserInfo {
  _id: string;
  name: string;
  mobileNumber: string;
  role: 'user' | 'operator' | 'department_head' | 'admin';
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
}

export interface Message {
  _id: string;
  sender: UserInfo;
  content: string;
  type: 'text' | 'voice';
  voiceDuration?: number;
  timestamp: string;
}

export interface Ticket {
  _id: string;
  title: string;
  status: 'Open' | 'Answered' | 'In-Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt: string;
  department: { _id: string; name: string; };
  createdBy: UserInfo;
  messages: Message[];
}

export interface Department {
  _id: string;
  name: string;
  head: UserInfo;
  operators: UserInfo[];
  faqs: Faq[];
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
  ctaPhoneNumber?: string;
  ctaFormEnabled?: boolean;
}