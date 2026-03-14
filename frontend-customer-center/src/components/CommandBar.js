import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Typography, Tag, theme } from 'antd';
import {
  SearchOutlined, DashboardOutlined, SettingOutlined,
  KeyOutlined, FileSearchOutlined, TeamOutlined,
  TruckOutlined, EnvironmentOutlined, HistoryOutlined,
  CreditCardOutlined, CrownOutlined, UserOutlined,
  TagsOutlined, OrderedListOutlined, BarChartOutlined,
  ShopOutlined, LineChartOutlined, AuditOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { colors, radii } from '../theme/tokens';

const { Text } = Typography;
const BRAND = '#6C63FF';

/* ── Registry of every navigable destination ── */
const COMMANDS = [
  // Pages
  { id: 'dashboard',        label: 'Dashboard',             section: 'Pages',    icon: <DashboardOutlined />,  path: '/dashboard',          keywords: 'home overview' },
  { id: 'audit',            label: 'Listing Audit',         section: 'Pages',    icon: <AuditOutlined />,      path: '/audit',              keywords: 'seo listing check' },
  { id: 'keyword-search',   label: 'Keyword Search',        section: 'Pages',    icon: <SearchOutlined />,     path: '/keywords',           keywords: 'keyword research search' },
  { id: 'deep-analyzer',    label: 'Deep Keyword Analyzer', section: 'Pages',    icon: <BarChartOutlined />,   path: '/keywords/deep',      keywords: 'deep keyword analysis volume' },
  { id: 'bulk-rank',        label: 'Bulk Rank Checker',     section: 'Pages',    icon: <OrderedListOutlined />,path: '/keywords/bulk',      keywords: 'rank check bulk' },
  { id: 'tag-analyzer',     label: 'Tag Analyzer',          section: 'Pages',    icon: <TagsOutlined />,       path: '/keywords/tags',      keywords: 'tags analysis quality' },
  { id: 'active-listings',  label: 'Active Listings',       section: 'Pages',    icon: <ShopOutlined />,       path: '/listings/active',    keywords: 'listings manage shop' },
  { id: 'history',          label: 'Analysis History',       section: 'Pages',    icon: <HistoryOutlined />,    path: '/history',            keywords: 'past reports analyses' },
  { id: 'competitor',       label: 'Competitor Tracker',     section: 'Pages',    icon: <TeamOutlined />,       path: '/competitors',        keywords: 'competitor shop track' },
  { id: 'competitor-sales', label: 'Competitor Sales',       section: 'Pages',    icon: <LineChartOutlined />,  path: '/competitors/sales',  keywords: 'competitor sales daily' },
  { id: 'delivery',         label: 'Delivery Status',        section: 'Pages',    icon: <TruckOutlined />,      path: '/delivery',           keywords: 'shipping delivery orders' },
  { id: 'sales-map',        label: 'Sales Map',              section: 'Pages',    icon: <EnvironmentOutlined />,path: '/sales-map',          keywords: 'geography region sales map' },
  // Settings tabs
  { id: 'settings-profile',  label: 'Profile Settings',      section: 'Settings', icon: <UserOutlined />,       path: '/settings?tab=profile',       keywords: 'name email phone profile' },
  { id: 'settings-security', label: 'Security Settings',     section: 'Settings', icon: <SettingOutlined />,    path: '/settings?tab=security',      keywords: 'password security' },
  { id: 'settings-sub',      label: 'Subscription',          section: 'Settings', icon: <CrownOutlined />,      path: '/settings?tab=subscription',  keywords: 'subscription plan status' },
  { id: 'settings-plans',    label: 'Change Plan',           section: 'Settings', icon: <CrownOutlined />,      path: '/settings?tab=plans',         keywords: 'upgrade plan pricing' },
  { id: 'settings-billing',  label: 'Billing & Invoices',    section: 'Settings', icon: <CreditCardOutlined />, path: '/settings?tab=billing',       keywords: 'payment invoice billing history' },
  // Quick actions
  { id: 'billing-page',      label: 'Usage & Quotas',        section: 'Quick',    icon: <FileSearchOutlined />, path: '/billing',                    keywords: 'usage quota billing limits' },
];

/**
 * CommandBar — global ⌘K / Ctrl+K search modal.
 * Provides instant navigation to any page, setting, or action.
 * Zero clutter — lives entirely as a keyboard-triggered overlay.
 */
const CommandBar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { token: tok } = theme.useToken();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  // Filter commands by query
  const results = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.keywords.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      navigate(results[activeIdx].path);
      onClose();
    }
  }, [results, activeIdx, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Group results by section
  const grouped = useMemo(() => {
    const map = {};
    results.forEach((r, i) => {
      if (!map[r.section]) map[r.section] = [];
      map[r.section].push({ ...r, _idx: i });
    });
    return map;
  }, [results]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={520}
      centered
      styles={{
        content: {
          padding: 0,
          borderRadius: radii.xl,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        },
        mask: { backdropFilter: 'blur(4px)' },
      }}
    >
      {/* Search input */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${tok.colorBorderSecondary}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <SearchOutlined style={{ fontSize: 18, color: colors.muted }} />
        <Input
          ref={inputRef}
          placeholder="Search pages, settings, actions…"
          variant="borderless"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKeyDown}
          style={{ fontSize: 15, flex: 1 }}
        />
        <Tag style={{
          fontSize: 11, padding: '1px 8px', borderRadius: 6,
          color: colors.muted, background: tok.colorBgLayout,
          border: `1px solid ${tok.colorBorderSecondary}`,
          fontFamily: 'monospace', fontWeight: 600,
        }}>
          ESC
        </Tag>
      </div>

      {/* Results list */}
      <div ref={listRef} style={{
        maxHeight: 380, overflowY: 'auto', padding: '8px 0',
      }}>
        {results.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Text type="secondary">No results for "{query}"</Text>
          </div>
        )}

        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            <div style={{
              padding: '8px 18px 4px',
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: colors.muted,
            }}>
              {section}
            </div>
            {items.map(item => {
              const isActive = item._idx === activeIdx;
              return (
                <div
                  key={item.id}
                  data-idx={item._idx}
                  onClick={() => { navigate(item.path); onClose(); }}
                  onMouseEnter={() => setActiveIdx(item._idx)}
                  style={{
                    padding: '10px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer',
                    borderRadius: 8,
                    margin: '0 8px',
                    background: isActive ? `${BRAND}12` : 'transparent',
                    transition: 'background 0.12s',
                  }}
                >
                  <span style={{
                    fontSize: 16,
                    color: isActive ? BRAND : colors.muted,
                    width: 24, textAlign: 'center',
                  }}>
                    {item.icon}
                  </span>
                  <Text strong={isActive} style={{
                    flex: 1, fontSize: 14,
                    color: isActive ? tok.colorText : tok.colorTextSecondary,
                  }}>
                    {item.label}
                  </Text>
                  {isActive && (
                    <RightOutlined style={{ fontSize: 11, color: BRAND, opacity: 0.6 }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '10px 18px',
        borderTop: `1px solid ${tok.colorBorderSecondary}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          <span style={{ fontFamily: 'monospace', padding: '1px 4px', borderRadius: 3, border: `1px solid ${tok.colorBorderSecondary}`, marginRight: 4 }}>↑↓</span>
          Navigate
          <span style={{ fontFamily: 'monospace', padding: '1px 4px', borderRadius: 3, border: `1px solid ${tok.colorBorderSecondary}`, marginLeft: 12, marginRight: 4 }}>↵</span>
          Open
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Text>
      </div>
    </Modal>
  );
};

export default CommandBar;
