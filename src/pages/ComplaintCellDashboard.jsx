import React from 'react';
import UdmRejectionDashboard from '../components/railway-board/UdmRejectionDashboard';

/**
 * Complaint Cell landing page.
 * Reuses the same UDM / IMMS Consignee Rejections screen as the Railway Board (kept identical),
 * with Send to Controlling Manager / Close actions enabled.
 */
export default function ComplaintCellDashboard() {
    return (
        <div style={{ padding: '16px clamp(12px, 2vw, 24px)', maxWidth: 1600, margin: '0 auto' }}>
            <UdmRejectionDashboard mode="complaintCell" />
        </div>
    );
}
