import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConfigProvider, App as AntdApp, Button, Spin, Typography, Modal, Form, Input } from 'antd';
import fa_IR from 'antd/locale/fa_IR';
import { CloseOutlined, HomeOutlined, PhoneOutlined, FormOutlined, ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';
import api from '../lib/api';
import type { VideoFlow } from '../types';
import '../App.scss';

const { Title, Text } = Typography;
const SESSION_STORAGE_KEY = 'supportWidgetSessionState';
// --- تابع کمکی برای فرمت‌دهی زمان ---
const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- کامپوننت فرم مشاوره ---
const ConsultationForm = ({ onFinish }: { onFinish: () => void }) => {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
    const { message, notification } = AntdApp.useApp();

    const handleSubmit = async (values: { name: string, mobileNumber: string }) => {
        setIsLoading(true);
        try {
            const response = await api.post('/consultation-requests', { ...values, sourceUrl: window.location.href });
            message.success(response.data.message);
            onFinish();
        } catch (error: any) {
            notification.error({ message: 'خطا', description: error.response?.data?.message || 'مشکلی رخ داد' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 24 }}>
            <Title level={4}>ثبت درخواست مشاوره</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت.
            </Text>
            <Form.Item name="name" label="نام و نام خانوادگی" rules={[{ required: true, message: 'لطفاً نام خود را وارد کنید.' }]}>
                <Input size="large" />
            </Form.Item>
            <Form.Item name="mobileNumber" label="شماره تماس" rules={[{ required: true, message: 'لطفاً شماره تماس خود را وارد کنید.' }, { pattern: /^09\d{9}$/, message: 'فرمت شماره موبایل صحیح نیست.' }]}>
                <Input size="large" style={{ direction: 'ltr' }} />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
                    ثبت و ارسال درخواست
                </Button>
            </Form.Item>
        </Form>
    );
};

// --- کامپوننت اصلی ویجت ---
export default function WidgetCore() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentFlow, setCurrentFlow] = useState<VideoFlow | null>(null);
    const [rootFlow, setRootFlow] = useState<VideoFlow | null>(null);
    const [historyStack, setHistoryStack] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'ended'>('loading');
    const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 });
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const { notification } = AntdApp.useApp();

    const fetchFlow = useCallback(async (flowId: string | 'root') => {
        setIsLoading(true);
        setStatus('loading');
        const url = flowId === 'root' ? '/video-flows/root' : `/video-flows/${flowId}`;
        try {
            const res = await api.get<VideoFlow>(url);
            setCurrentFlow(res.data);
            if (res.data.isRoot) {
                setRootFlow(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch video flow:", err);
            notification.error({ message: 'خطا در بارگذاری محتوای پشتیبانی' });
        } finally {
            setIsLoading(false);
        }
    }, [notification]);

    useEffect(() => {
        // این بخش فقط یک بار در اولین بارگذاری اجرا می‌شود
        fetchFlow('root');
    }, [fetchFlow]);
    
    useEffect(() => {
        const mainVideo = videoRef.current;
        if (!mainVideo) return;
        
        if (isOpen && status === 'playing') {
            mainVideo.muted = false;
            mainVideo.currentTime = 0; // همیشه از اول شروع کن
            mainVideo.play().catch(error => {
                console.error("Autoplay with sound was prevented:", error);
                mainVideo.muted = true;
                mainVideo.play();
            });
        } else {
            mainVideo.pause();
        }
    }, [isOpen, status]);
    
    useEffect(() => {
        const previewVideo = previewVideoRef.current;
        if (!isOpen && previewVideo && rootFlow) {
            previewVideo.play().catch(e => console.warn("Preview video autoplay failed.", e));
        }
    }, [isOpen, rootFlow]);

    const handleQuestionClick = (nextFlowId: string) => {
        if (currentFlow) {
            setHistoryStack(prev => [...prev, currentFlow._id]);
            fetchFlow(nextFlowId);
        }
    };

    const handleGoBack = () => {
        const newHistory = [...historyStack];
        const lastFlowId = newHistory.pop();
        if (lastFlowId) {
            setHistoryStack(newHistory);
            fetchFlow(lastFlowId);
        }
    };

    const handleGoHome = () => {
        setHistoryStack([]);
        // --- FIX IS HERE: Use fetchFlow to reset the state machine correctly ---
        fetchFlow('root');
    };

    const handleReplay = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            setStatus('playing');
        }
    };

   const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video && video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
            setVideoTime(prev => ({ ...prev, current: video.currentTime }));
        }
    };
    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (video) {
            setVideoTime({ current: 0, duration: video.duration });
        }
    };
   const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const progressBar = e.currentTarget;
        const video = videoRef.current;

        if (video && video.duration) {
            const rect = progressBar.getBoundingClientRect();
            const clickPositionInElement = e.clientX - rect.left;           
            const percentage = clickPositionInElement / progressBar.offsetWidth;
            const seekTime = percentage * video.duration;
            video.currentTime = seekTime;  
            setProgress(percentage * 100);
            setVideoTime(prev => ({ ...prev, current: seekTime }));
        }
    };
    const handleVideoReady = () => {
        setIsLoading(false);
        setStatus('playing');
    };

    const isFlowEnd = currentFlow && (!currentFlow.questions || currentFlow.questions.length === 0);

    return (
        <div className="support-widget-container">
            <div className={`widget-window ${isOpen ? 'open' : ''}`}>
                <header className="widget-header">
                    
                    <div className="header-buttons left">
                        {historyStack.length > 0 && <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={handleGoBack} />}
                        {currentFlow && !currentFlow.isRoot && <Button shape="circle" icon={<HomeOutlined />} onClick={handleGoHome} />}
                        {status === 'ended' && <Button shape="circle" icon={<RedoOutlined />} onClick={handleReplay} />}
                    </div>
                   
                    <div className="header-buttons right">
                        <Button shape="circle" icon={<CloseOutlined />} onClick={() => setIsOpen(false)} />
                    </div>
                </header>
                <main className="widget-body">
                    {isLoading ? <Spin size="large" /> : (
                        <>
                            <div className="video-progress-container">
                                {status === 'loading' && <Spin className="video-spinner" />}
                                <video
                                    key={currentFlow?._id}
                                    ref={videoRef}
                                    src={currentFlow?.videoUrl}
                                    playsInline
                                    onCanPlay={handleVideoReady}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={() => setStatus('ended')}
                                    className="main-video"
                                    onLoadedMetadata={handleLoadedMetadata} 
                                />
                            </div>
                            <div className="widget-content">
                                {isFlowEnd ? (
                                    <div className="cta-buttons">
                                        {currentFlow?.ctaFormEnabled && <Button type="primary" block size="large" icon={<FormOutlined />} onClick={() => setIsFormModalVisible(true)}>ثبت درخواست مشاوره</Button>}
                                        {currentFlow?.ctaPhoneNumber && <a href={`tel:${currentFlow.ctaPhoneNumber}`}><Button block size="large" icon={<PhoneOutlined />}>راهنمایی نیاز دارید؟ ({currentFlow.ctaPhoneNumber})</Button></a>}
                                    </div>
                                ) : (
                                    <div className="question-buttons">
                                        {currentFlow?.questions.map(q => <Button key={q._id} block size="large" onClick={() => handleQuestionClick(q.nextFlow)}>{q.text}</Button>)}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
            
            {!isOpen && (
                <div className="floating-bar-new">
                    {/* <Button className="floating-icon-button-new" shape="circle" icon={<QuestionCircleOutlined />} onClick={() => setIsOpen(true)} /> */}
                    <Button className="floating-action-button-new consult" onClick={() => setIsFormModalVisible(true)}>درخواست مشاوره</Button>
                    <div className="floating-avatar-new" onClick={() => setIsOpen(true)}>
                        {rootFlow?.previewVideoUrl && 
                            <video 
                                ref={previewVideoRef}
                                key={rootFlow.previewVideoUrl}
                                src={rootFlow.previewVideoUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="preview-video" 
                            />
                        }
                    </div>
                    {rootFlow?.ctaPhoneNumber &&
                        <a href={`tel:${rootFlow.ctaPhoneNumber}`} className="floating-action-button-new phone">
                           -021 <span>5148</span>
                        </a>
                    }
                </div>
            )}
            
            <Modal open={isFormModalVisible} onCancel={() => setIsFormModalVisible(false)} footer={null} destroyOnClose centered>
                <ConsultationForm onFinish={() => setIsFormModalVisible(false)} />
            </Modal>
        </div>
    );
}
