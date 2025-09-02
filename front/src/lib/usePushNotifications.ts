import { useState, useEffect } from 'react';
import api from './api';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const usePushNotifications = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    if (subscription) {
                        setIsSubscribed(true);
                    }
                });
            });
        }
    }, []);

    const subscribeToPush = async () => {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                throw new Error("Push notifications are not supported by this browser.");
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                setIsSubscribed(true);
                return; // Already subscribed
            }

            const response = await api.get('/notifications/vapid-key');
            const vapidPublicKey = response.data.publicKey;
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });

            await api.post('/notifications/subscribe', newSubscription);
            setIsSubscribed(true);
        } catch (err: any) {
            console.error("Failed to subscribe to push notifications:", err);
            setSubscriptionError(err.message);
        }
    };

    return { isSubscribed, subscribeToPush, subscriptionError };
};