import React, { useState, useEffect } from 'react';
import { Typography, Progress, theme } from 'antd';
import {
  ShopOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { radii } from '../theme/tokens';

const { Title, Text } = Typography;
const BRAND = '#6C63FF';

const STEPS = [
  'Connecting to Etsy…',
  'Importing your listings…',
  'Analyzing tags & keywords…',
  'Calculating SEO scores…',
  'Finalizing your dashboard…',
];

/**
 * SyncingState — shown while the initial shop data import runs.
 * Displays a soothing progress animation so the user knows things are happening.
 *
 * Props:
 *   onComplete — called when syncing finishes (parent decides when)
 *   progress   — 0-100 from parent (if backend sends progress)
 *                If omitted, component auto-advances a simulated progress.
 */
const SyncingState = ({ onComplete, progress: externalProgress }) => {
  const { token: tok } = theme.useToken();
  const [simPct, setSimPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  // Simulate progress if no external value is provided
  useEffect(() => {
    if (externalProgress !== undefined) return;
    const iv = setInterval(() => {
      setSimPct(prev => {
        if (prev >= 100) { clearInterval(iv); return 100; }
        // Slow down near the end (logarithmic deceleration)
        const bump = prev < 60 ? 4 : prev < 85 ? 2 : 0.5;
        return Math.min(100, prev + bump);
      });
    }, 400);
    return () => clearInterval(iv);
  }, [externalProgress]);

  const pct = externalProgress !== undefined ? externalProgress : simPct;

  // Advance step label based on %
  useEffect(() => {
    const idx = Math.min(Math.floor(pct / (100 / STEPS.length)), STEPS.length - 1);
    setStepIdx(idx);
  }, [pct]);

  // Notify parent on completion
  useEffect(() => {
    if (pct >= 100 && onComplete) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [pct, onComplete]);

  const done = pct >= 100;

  return (
    <div style={{
      maxWidth: 480,
      margin: '80px auto',
      textAlign: 'center',
    }}>
      {/* Pulsing icon */}
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: done
          ? 'linear-gradient(135deg, #10B981, #34D399)'
          : `linear-gradient(135deg, ${BRAND}, #A78BFA)`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: done
          ? '0 12px 36px rgba(16,185,129,0.35)'
          : '0 12px 36px rgba(108,99,255,0.35)',
        marginBottom: 28,
        animation: done ? 'none' : 'pulse 2s ease-in-out infinite',
      }}>
        {done
          ? <CheckCircleOutlined style={{ fontSize: 40, color: '#fff' }} />
          : <ShopOutlined style={{ fontSize: 40, color: '#fff' }} />
        }
      </div>

      <Title level={3} style={{ marginBottom: 6 }}>
        {done ? 'All set!' : 'Setting up your workspace'}
      </Title>
      <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 28 }}>
        {done
          ? 'Your shop data is ready. Redirecting to your dashboard…'
          : STEPS[stepIdx]}
      </Text>

      <div style={{
        background: tok.colorBgContainer,
        border: `1px solid ${tok.colorBorderSecondary}`,
        borderRadius: radii.lg,
        padding: '24px 28px',
        boxShadow: '0 2px 12px rgba(108,99,255,0.06)',
      }}>
        <Progress
          percent={Math.round(pct)}
          strokeColor={done
            ? { from: '#10B981', to: '#34D399' }
            : { from: BRAND, to: '#A78BFA' }}
          style={{ marginBottom: 8 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          This usually takes less than a minute
        </Text>
      </div>

      {/* Inline CSS keyframe for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
};

export default SyncingState;
