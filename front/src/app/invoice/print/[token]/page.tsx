'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Spin, Alert, Button } from 'antd';
import { getPublicInvoice } from '@/lib/api';
import { format } from 'date-fns-jalali';
import '../../../invoice/invoice-print.css'; 

export default function PrintInvoicePage() {
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const token = params.token as string;

    useEffect(() => {
        if (token) {
            getPublicInvoice(token)
                .then(res => {
                    setInvoice(res.data);
                })
                .catch(() => setError('خطا در دریافت اطلاعات فاکتور.'))
                .finally(() => setLoading(false));
        }
    }, [token]);

    const handlePrint = () => {
        window.print();
    };
    
    if (loading) return <Spin fullscreen tip="در حال آماده‌سازی فاکتور برای چاپ..." />;
    if (error) return <Alert message="خطا" description={error} type="error" showIcon />;
    if (!invoice) return <Alert message="یافت نشد" description="فاکتور مورد نظر یافت نشد." type="info" />;

    const isPaid = invoice.status === 'paid';
    const finalAmount = Number(invoice.finalAmount).toLocaleString();
    const subtotal = Number(invoice.amount).toLocaleString();
    const discountAmount = invoice.discount ? Number(invoice.discount.amount).toLocaleString() : '0';

    return (
        <div className="invoice-wrapper">
            {/* Add a print button for user convenience */}
            <Button className="print-button" type="primary" onClick={handlePrint} style={{ marginBottom: '20px' }}>
                چاپ فاکتور
            </Button>

            <header className="invoice-header">
                <div className="logo-container">
                    <img src="/logo.png" alt="Logo" className="logo" />
                </div>
                <div className="invoice-details">
                    <p><strong>شناسه فاکتور :</strong>  {invoice._id.slice(-6)}</p>
                    <p><strong>تاریخ سفارش :</strong> {format(new Date(invoice.createdAt), 'yyyy/MM/dd')}</p>
                </div>
            </header>

            <section className="parties">
                <div className="party-box">
                    <h3>فروشنده</h3>
                    <p><strong>فروشگاه:</strong> آکادمی آنلاین زبان آفاق</p>
                    <p><strong>استان:</strong>  تهران، خیابان ولیعصر، توانیر، ساختمان افق، طبقه 5</p>
                    <p><strong>تلفن:</strong> 5148-021</p>
                </div>
                <div className="party-box">
                    <h3>خریدار</h3>
                    <p><strong>نام:</strong> {invoice.fullName}</p>
                    <p><strong>تلفن:</strong> {invoice.mobileNumber}</p>
                    {invoice.nationalId && <p><strong>کد ملی:</strong> {invoice.nationalId}</p>}

                    
                </div>
            </section>

            <section className="invoice-info">
                 <div className="parties">
                     <div className="party-box">
                        <h3>اطلاعات فاکتور</h3>
                        <p><strong>شماره فاکتور:</strong> {invoice._id.slice(-6)}</p>
                        <p><strong>نام صادر کننده:</strong> {invoice.createdBy?.name || '-'}</p>
                     </div>
                     <div className="party-box">
                        <h3>اطلاعات پرداخت</h3>
                        <p><strong>وضعیت پرداخت:</strong> <span style={{ fontWeight: 'bold', color: isPaid ? 'green' : 'orange' }}>{isPaid ? 'پرداخت شده' : 'در انتظار پرداخت'}</span></p>
                         {isPaid && invoice.paymentRefId && (
                             <p><strong>کد رهگیری پرداخت:</strong> <span style={{ fontWeight: 'bold' }}>{invoice.paymentRefId}</span></p>
                        )}
                        <p><strong>تاریخ پرداخت:</strong> {isPaid ? format(new Date(invoice.updatedAt), 'yyyy/MM/dd') : '-'}</p>
                     </div>
                 </div>
            </section>

            <section className="items">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>ردیف</th>
                            <th>محصول</th>
                            <th>تعداد</th>
                            <th>مبلغ واحد</th>
                            <th>مبلغ کل</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>{invoice.classType.name}</td>
                            <td>1</td>
                            <td>{subtotal} ریال</td>
                            <td>{subtotal} ریال</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="totals-section">
                <table className="totals-table">
                    <tbody>
                        <tr>
                            <td className="total-label">مبلغ کل :</td>
                            <td className="total-value">{subtotal} ریال</td>
                        </tr>
                         <tr>
                            <td className="total-label">تخفیف :</td>
                            <td className="total-value">{discountAmount} ریال</td>
                        </tr>
                        <tr className="grand-total">
                            <td className="total-label">مبلغ نهایی :</td>
                            <td className="total-value">{finalAmount} ریال</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
}