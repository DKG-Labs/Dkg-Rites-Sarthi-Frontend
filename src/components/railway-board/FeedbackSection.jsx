import React, { useState, useEffect, useCallback } from 'react';
import './FeedbackSection.css';
import { getStoredUser } from '../../services/authService';
import { submitFeedback, replyToFeedback, getUserFeedback, getAllFeedback } from '../../services/feedbackService';

const FeedbackSection = ({ selectedProduct }) => {
    const [view, setView] = useState('submit');
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [feedbackInput, setFeedbackInput] = useState({ subject: '', message: '', priority: 'Medium' });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState('all');

    // Initialize filter based on selectedProduct
    useEffect(() => {
        if (selectedProduct) {
            setFilter(selectedProduct.toLowerCase().replace(/\s/g, ''));
        } else {
            setFilter('all');
        }
    }, [selectedProduct]);
    
    const currentUser = getStoredUser();
    const isRailwayBoard = currentUser?.roleName === 'RAILWAY_BOARD' || currentUser?.roleName === 'SUPER_ADMIN';

    // Current product context (can be dynamic based on which dashboard we are in)
    // For Railway Board, it's 'General' or 'HQ'
    const PRODUCT_CONTEXT = selectedProduct || 'Railway Board'; 

    const fetchFeedbacks = useCallback(async () => {
        if (view === 'list') {
            setLoading(true);
            try {
                let data;
                if (isRailwayBoard) {
                    data = await getAllFeedback();
                    // Filter by selected filter type
                    if (filter !== 'all') {
                        data = data.filter(f => {
                            const fType = f.productType?.toLowerCase().replace(/\s/g, '') || '';
                            const filterClean = filter.replace(/\s/g, '');
                            return fType.includes(filterClean);
                        });
                    }
                } else {
                    data = await getUserFeedback(currentUser.userId);
                }
                setFeedbacks(data);
            } catch (err) {
                console.error("Failed to load feedbacks");
            } finally {
                setLoading(false);
            }
        }
    }, [view, isRailwayBoard, currentUser?.userId, filter]);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks, filter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newFeedback = {
                userId: currentUser.userId,
                userCode: currentUser.employeeCode || currentUser.userId || 'Railwayboard', 
                userName: currentUser.userName || 'Railwayboard',
                productType: PRODUCT_CONTEXT,
                roleName: currentUser.roleName,
                subject: feedbackInput.subject,
                message: feedbackInput.message,
                priority: feedbackInput.priority
            };
            await submitFeedback(newFeedback);
            setFeedbackInput({ subject: '', message: '', priority: 'Medium' });
            setView('list');
        } catch (err) {
            alert("Error submitting feedback");
        }
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return;
        try {
            const replyData = {
                userId: currentUser.userId,
                userCode: currentUser.employeeCode || currentUser.userId || 'Railwayboard',
                userName: currentUser.userName || 'Railwayboard',
                roleName: currentUser.roleName,
                productType: PRODUCT_CONTEXT,
                replyMessage: replyText
            };
            await replyToFeedback(id, replyData);
            setReplyText('');
            setReplyingTo(null);
            fetchFeedbacks(); // Refresh list
        } catch (err) {
            alert("Error posting reply");
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#10b981';
            default: return '#64748b';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    };

    return (
        <div className="feedback-section-container fade-in">
            <div className="prof-card feedback-header-card">
                <div className="feedback-nav">
                    <button className={`feedback-tab-btn ${view === 'submit' ? 'active' : ''}`} onClick={() => setView('submit')}>
                        <i className="fa-solid fa-pen-to-square"></i> Submit Feedback
                    </button>
                    <button className={`feedback-tab-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
                        <i className="fa-solid fa-list-check"></i> {isRailwayBoard ? 'Manage All Feedbacks' : 'View My Feedback'} ({feedbacks.length})
                    </button>
                </div>
            </div>

            {view === 'list' && isRailwayBoard && (
                <div className="feedback-filter-bar animate-up">
                    <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Feedbacks</button>
                    <button className={`filter-pill ${filter === 'erc' ? 'active' : ''}`} onClick={() => setFilter('erc')}>ERC Vendors</button>
                    <button className={`filter-pill ${filter === 'sleeper' ? 'active' : ''}`} onClick={() => setFilter('sleeper')}>Sleeper Vendors</button>
                    <button className={`filter-pill ${filter === 'railpad' ? 'active' : ''}`} onClick={() => setFilter('railpad')}>Railpad Vendors</button>
                </div>
            )}

            {view === 'submit' ? (
                <div className="feedback-submit-wrapper animate-up">
                    <div className="prof-card feedback-form-card">
                        <div className="sec-title-enhanced">
                            <i className="fa-solid fa-paper-plane-memo"></i> submit your feedback, issue & Suggestion
                        </div>
                        <form className="feedback-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label><i className="fa-solid fa-bookmark"></i> Subject</label>
                                    <input
                                        type="text"
                                        className="prof-input"
                                        placeholder="Brief summary of your feedback..."
                                        value={feedbackInput.subject}
                                        onChange={(e) => setFeedbackInput({ ...feedbackInput, subject: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label><i className="fa-solid fa-gauge-high"></i> Priority</label>
                                    <select
                                        className="prof-select"
                                        value={feedbackInput.priority}
                                        onChange={(e) => setFeedbackInput({ ...feedbackInput, priority: e.target.value })}
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label><i className="fa-solid fa-envelope-open-text"></i> Message</label>
                                <textarea
                                    className="prof-textarea-enhanced"
                                    rows="8"
                                    placeholder="Describe your suggestions, issues or ideas in detail..."
                                    value={feedbackInput.message}
                                    onChange={(e) => setFeedbackInput({ ...feedbackInput, message: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-footer">
                                <button type="submit" className="btn-submit-feedback-v2">
                                    <span>Send Feedback Now</span>
                                    <i className="fa-solid fa-arrow-right-long"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="feedback-list-container animate-up">
                    {loading ? (
                        <div className="loading-state">Loading feedbacks...</div>
                    ) : feedbacks.length === 0 ? (
                        <div className="no-data-state">No feedback found.</div>
                    ) : (
                        feedbacks.map(f => (
                            <div key={f.feedbackId} className="prof-card feedback-item-card">
                                <div className="feedback-item-header">
                                    <div className="user-info">
                                        <div className="avatar">{f.userName?.charAt(0)}</div>
                                        <div>
                                            <div className="user-name">
                                                {f.userName} 
                                                {(() => {
                                                    const formattedRole = f.roleName?.replace(/_/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                                    const isRedundant = f.userName?.toLowerCase().includes(formattedRole?.toLowerCase()) || formattedRole?.toLowerCase().includes(f.userName?.toLowerCase());
                                                    return !isRedundant && <span className="role-tag">{formattedRole}</span>;
                                                })()}
                                                {f.productType && f.productType !== 'Railway Board' && (
                                                    <span className="product-tag">{f.productType}</span>
                                                )}
                                            </div>
                                            <div className="date-time">{formatDate(f.createdDate)}</div>
                                        </div>
                                    </div>
                                    <div className="header-right">
                                        <div className="status-pill" data-status={f.status}>{f.status}</div>
                                        <div className="priority-pill" style={{ background: `${getPriorityColor(f.priority)}20`, color: getPriorityColor(f.priority) }}>
                                            {f.priority}
                                        </div>
                                    </div>
                                </div>

                                <div className="feedback-item-body">
                                    <h4 className="feedback-subject">{f.subject}</h4>
                                    <p className="feedback-message">{f.message}</p>
                                </div>

                                {f.replies && f.replies.length > 0 && (
                                    <div className="replies-section">
                                        {f.replies.map((r, i) => (
                                            <div key={r.replyId || i} className="reply-card">
                                                <div className="reply-header">
                                                    <span className="reply-user">
                                                        {r.userName} 
                                                        {(() => {
                                                            const formattedRole = r.roleName?.replace(/_/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                                            const isRedundant = r.userName?.toLowerCase().includes(formattedRole?.toLowerCase()) || formattedRole?.toLowerCase().includes(r.userName?.toLowerCase());
                                                            return !isRedundant && ` (${formattedRole})`;
                                                        })()}
                                                    </span>
                                                    <span className="reply-date">{formatDate(r.createdDate)}</span>
                                                </div>
                                                <p className="reply-text">{r.replyMessage}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="feedback-item-actions">
                                    {isRailwayBoard && (
                                        replyingTo === f.feedbackId ? (
                                            <div className="reply-input-wrapper">
                                                <textarea
                                                    className="prof-textarea"
                                                    rows="3"
                                                    placeholder="Write a reply..."
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                ></textarea>
                                                <div className="reply-btns">
                                                    <button className="btn-cancel" onClick={() => setReplyingTo(null)}>Cancel</button>
                                                    <button className="btn-reply-submit" onClick={() => handleReply(f.feedbackId)}>Post Reply</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn-reply-trigger" onClick={() => setReplyingTo(f.feedbackId)}>
                                                <i className="fa-solid fa-reply"></i> Reply back
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default FeedbackSection;
