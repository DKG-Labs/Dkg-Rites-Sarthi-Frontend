/* eslint-disable */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined, ToolOutlined } from '@ant-design/icons';

const UnderConstruction = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.container}>
      {/* Animated gear icon */}
      <div style={styles.iconWrapper}>
        <div style={styles.gearOuter}>
          <ToolOutlined style={styles.gearIcon} />
        </div>
      </div>

      {/* Cone stripes banner */}
      <div style={styles.stripeBanner} />

      <div style={styles.card}>
        <div style={styles.badge}>Coming Soon</div>

        <h1 style={styles.heading}>🚧 Under Construction</h1>
        <p style={styles.subtext}>
          This module is currently being developed and will be available in a future release.
        </p>
        <p style={styles.subtext2}>
          We're working hard to bring you this feature. Thank you for your patience!
        </p>

        {/* Progress bar animation */}
        <div style={styles.progressContainer}>
          <div style={styles.progressLabel}>Build Progress</div>
          <div style={styles.progressTrack}>
            <div style={styles.progressBar} />
          </div>
          <div style={styles.progressPercent}>75%</div>
        </div>

        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          size="large"
          onClick={() => navigate(-1)}
          style={styles.backBtn}
        >
          Go Back
        </Button>
      </div>

      {/* Bottom stripe */}
      <div style={{ ...styles.stripeBanner, marginTop: 32 }} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { width: 20%; }
          50% { width: 80%; }
          100% { width: 75%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const ORANGE = '#f59e0b';

const styles = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '40px 20px',
  },
  iconWrapper: {
    marginBottom: 24,
    animation: 'fadeInUp 0.6s ease forwards',
  },
  gearOuter: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 8px 32px ${TEAL}55`,
    animation: 'spin 4s linear infinite',
  },
  gearIcon: {
    fontSize: 42,
    color: '#fff',
  },
  stripeBanner: {
    width: '100%',
    maxWidth: 540,
    height: 14,
    borderRadius: 4,
    background: `repeating-linear-gradient(
      -45deg,
      ${ORANGE},
      ${ORANGE} 12px,
      #1c1c1c 12px,
      #1c1c1c 24px
    )`,
    opacity: 0.85,
  },
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '40px 48px',
    maxWidth: 540,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
    animation: 'fadeInUp 0.7s ease forwards',
    margin: '0',
    position: 'relative',
    border: '1px solid #e2e8f0',
  },
  badge: {
    display: 'inline-block',
    background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    padding: '4px 16px',
    borderRadius: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    color: '#1e293b',
    margin: '0 0 14px',
    lineHeight: 1.2,
  },
  subtext: {
    fontSize: 15,
    color: '#475569',
    margin: '0 0 8px',
    lineHeight: 1.6,
  },
  subtext2: {
    fontSize: 13,
    color: '#94a3b8',
    margin: '0 0 28px',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
    marginBottom: 8,
    textAlign: 'left',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    background: '#e2e8f0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '75%',
    background: `linear-gradient(90deg, ${TEAL}, ${ORANGE})`,
    borderRadius: 99,
    animation: 'progress 1.5s ease-out forwards',
  },
  progressPercent: {
    textAlign: 'right',
    fontSize: 12,
    color: TEAL,
    fontWeight: 700,
    marginTop: 4,
  },
  backBtn: {
    background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
    border: 'none',
    borderRadius: 10,
    padding: '0 32px',
    height: 44,
    fontSize: 15,
    fontWeight: 600,
    boxShadow: `0 4px 16px ${TEAL}44`,
    cursor: 'pointer',
  },
};

export default UnderConstruction;
