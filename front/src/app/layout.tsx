import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.scss";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import { App, ConfigProvider } from 'antd';
import fa_IR from 'antd/locale/fa_IR';
const iranYekan = localFont({
  src: [
    { path: '../../public/fonts/IRANYekanWebThin.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/IRANYekanWebRegular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/IRANYekanWebMedium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/IRANYekanWebBold.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/IRANYekanWebBlack.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-iranyekan',
});
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "سامانه تیکتینگ هوشمند",
  description: "پلتفرم مدرن پشتیبانی مشتریان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <html lang="fa" dir="rtl" className={iranYekan.variable}>
      <body>
        <StyledComponentsRegistry>
          {/* 3. استفاده از متغیر فونت در Ant Design */}
          <ConfigProvider 
            locale={fa_IR} 
            direction="rtl"
            theme={{
              token: {
                fontFamily: 'var(--font-iranyekan), sans-serif',
              }
            }}
          >
           <App style={{ height: '100%' }}> 
              {children}
            </App>
          </ConfigProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}