'use client';

import React, { createContext, useContext } from 'react';
import { UserInfo } from '@/types'; // فرض می‌کنیم UserInfo در types تعریف شده

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};