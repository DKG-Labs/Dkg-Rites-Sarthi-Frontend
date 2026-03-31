import React, { useState } from 'react';
import './FeedbackSection.css';

const FeedbackSection = () => {
    const [view, setView] = useState('list'); // 'submit' or 'list'
    const [feedbackInput, setFeedbackInput] = useState({ subject: '', message: '', priority: 'Medium' });
    const [mockFeedbacks, setMockFeedbacks] = useState([
        {
            id: 1,
            user: 'RDSO Admin',
            role: 'Administrator',
            date: '2026-03-30 10:24',
            subject: 'Dashboard Performance',
            message: 'The new charts are looking great, but could we optimize the loading time for MPR?',
            replies: [
                { user: 'Railway Board', role: 'HQ', message: 'We are working on data caching to resolve this.', date: '2026-03-31 09:12' }
            ],
            priority: 'High'
        },
        {
            id: 2,
            user: 'RIO West IE',
            role: 'Inspection Engineer',
            date: '2026-03-29 14:15',
            subject: 'Vendor Data Missing',
            message: 'Some vendor entries for Western Railway are not reflecting in the MAU report.',
            replies: [],
            priority: 'Medium'
        }
    ]);

    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const newFeedback = {
            id: Date.now(),
            user: 'Railway Board',
            role: 'HQ User',
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            subject: feedbackInput.subject,
            message: feedbackInput.message,
            priority: feedbackInput.priority,
            replies: []
        };
        setMockFeedbacks([newFeedback, ...mockFeedbacks]);
        setFeedbackInput({ subject: '', message: '', priority: 'Medium' });
        setView('list');
    };

    const handleReply = (id) => {
        if (!replyText.trim()) return;
        const updated = mockFeedbacks.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    replies: [...f.replies, {
                        user: 'Railway Board',
                        role: 'HQ User',
                        message: replyText,
                        date: new Date().toISOString().slice(0, 16).replace('T', ' ')
                    }]
                };
            }
            return f;
        });
        setMockFeedbacks(updated);
        setReplyText('');
        setReplyingTo(null);
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#10b981';
            default: return '#64748b';
        }
    };

    return (
        <div className="feedback-section-container fade-in">
            <div className="prof-card feedback-header-card">
                <div className="feedback-nav">
                    <button className={`feedback-tab-btn ${view === 'submit' ? 'active' : ''}`} onClick={() => setView('submit')}>
                        <i className="fa-solid fa-pen-to-square"></i> Submit Feedback
                    </button>
                    <button className={`feedback-tab-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
                        <i className="fa-solid fa-list-check"></i> View Feedback ({mockFeedbacks.length})
                    </button>
                </div>
            </div>

            {view === 'submit' ? (
                <div className="feedback-submit-wrapper animate-up">
                    <div className="prof-card feedback-form-card">
                        <div className="sec-title-enhanced">
                            <i className="fa-solid fa-paper-plane-memo"></i> Compose Your Message
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
                    {mockFeedbacks.map(f => (
                        <div key={f.id} className="prof-card feedback-item-card">
                            <div className="feedback-item-header">
                                <div className="user-info">
                                    <div className="avatar">{f.user.charAt(0)}</div>
                                    <div>
                                        <div className="user-name">{f.user} <span className="role-tag">{f.role}</span></div>
                                        <div className="date-time">{f.date}</div>
                                    </div>
                                </div>
                                <div className="priority-pill" style={{ background: `${getPriorityColor(f.priority)}20`, color: getPriorityColor(f.priority) }}>
                                    {f.priority}
                                </div>
                            </div>

                            <div className="feedback-item-body">
                                <h4 className="feedback-subject">{f.subject}</h4>
                                <p className="feedback-message">{f.message}</p>
                            </div>

                            {f.replies.length > 0 && (
                                <div className="replies-section">
                                    {f.replies.map((r, i) => (
                                        <div key={i} className="reply-card">
                                            <div className="reply-header">
                                                <span className="reply-user">{r.user} ({r.role})</span>
                                                <span className="reply-date">{r.date}</span>
                                            </div>
                                            <p className="reply-text">{r.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="feedback-item-actions">
                                {replyingTo === f.id ? (
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
                                            <button className="btn-reply-submit" onClick={() => handleReply(f.id)}>Post Reply</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn-reply-trigger" onClick={() => setReplyingTo(f.id)}>
                                        <i className="fa-solid fa-reply"></i> Reply back
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedbackSection;
