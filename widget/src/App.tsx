import React, { Suspense } from 'react';
import { ConfigProvider, App as AntdApp, Spin, Button } from 'antd';
import fa_IR from 'antd/locale/fa_IR';
import { CommentOutlined } from '@ant-design/icons';
import './App.scss';

// ۱. کامپوننت اصلی ویجت را به صورت "Lazy" (تنبل) وارد می‌کنیم
// این یعنی کد این کامپوننت فقط زمانی دانلود می‌شود که نیاز به نمایش آن باشد
const WidgetCore = React.lazy(() => import('./componenets/WidgetCore'));

// این یک کامپوننت سبک برای نمایش دکمه اولیه قبل از لود شدن ویجت اصلی است
const WidgetLoader = () => (
  <div className="widget-loader-button">
    <Button type="primary" shape="circle" size="large" icon={<CommentOutlined />} />
  </div>
);

export default function App() {
    return (
        <ConfigProvider locale={fa_IR} direction="rtl">
            <AntdApp>
                {/* Suspense به React می‌گوید که تا زمان آماده شدن WidgetCore،
                  کامپوننت fallback (یعنی WidgetLoader) را نمایش بده.
                */}
                <Suspense fallback={<WidgetLoader />}>
                    <WidgetCore />
                </Suspense>
            </AntdApp>
        </ConfigProvider>
    );
}