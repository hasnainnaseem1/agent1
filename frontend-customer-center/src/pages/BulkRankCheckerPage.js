import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Input, Button, Table, Typography, Tag, Select,
  Space, Empty, message, theme, Row, Col, Statistic, Tabs,
  Tooltip, Modal, Spin,
} from 'antd';
import {
  OrderedListOutlined, ThunderboltOutlined, RiseOutlined,
  FallOutlined, MinusOutlined, GlobalOutlined, LockOutlined,
  CrownOutlined, HistoryOutlined, LineChartOutlined,
  ShopOutlined, CalendarOutlined, ExpandOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import FeatureGate from '../components/common/FeatureGate';
import QuotaBanner from '../components/common/QuotaBanner';
import UsageBadge from '../components/common/UsageBadge';
import { usePermissions } from '../context/PermissionsContext';
import { useTheme } from '../context/ThemeContext';
import { colors, radii } from '../theme/tokens';
import etsyApi from '../api/etsyApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const BRAND = '#6C63FF';

const FALLBACK_COUNTRIES = [
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'FR', label: '🇫🇷 France' },
];

const BulkRankCheckerPage = () => {
  const { isDark } = useTheme();
  const { token: tok } = theme.useToken();
  const { getFeatureAccess, incrementUsage, refresh, plan } = usePermissions();
  const navigate = useNavigate();
  getFeatureAccess('bulk_rank_check');

  // Core state
  const [keywords, setKeywords] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Country
  const [country, setCountry] = useState('US');
  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [lockedCountry, setLockedCountry] = useState(null);

  // Listing picker
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Trends
  const [trendKeyword, setTrendKeyword] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('results');

  const card = {
    borderRadius: radii.lg,
    border: `1px solid ${isDark ? colors.darkBorder : colors.lightBorder}`,
    background: tok.colorBgContainer,
  };

  // Fetch countries + listings on mount
  useEffect(() => {
    etsyApi.getCountries()
      .then(res => { if (res.success && res.data?.length) setCountries(res.data); })
      .catch(() => {});
    etsyApi.getListings({ limit: 200 })
      .then(res => {
        const items = res.data?.listings || res.listings || [];
        setListings(items);
      })
      .catch(() => {});
  }, []);

  // ── Check Rankings ──
  const handleCheck = async () => {
    const kws = keywords.split('\n').map(k => k.trim()).filter(Boolean);
    if (!kws.length) { message.warning('Enter at least one keyword'); return; }
    setLoading(true);
    try {
      const payload = { keywords: kws, country };
      if (selectedListing) {
        payload.etsyListingId = selectedListing.listingId || selectedListing.etsyListingId;
        payload.listingTitle = selectedListing.title || '';
      }
      const res = await etsyApi.checkRankings(payload);
      if (res.success === false) {
        if (res.errorCode === 'UPGRADE_REQUIRED') {
          message.warning(res.message);
        } else {
          message.error(res.message || 'Unable to check rankings');
        }
        setResults([]);
        return;
      }
      const rows = (res.data?.results || res.results || []).map((r, i) => ({
        key: i,
        keyword: r.keyword || kws[i] || '',
        rank: r.rank || 0,
        page: r.page || (r.rank ? Math.ceil(r.rank / 48) : 0),
        volume: r.volume || r.totalResults || 0,
        change: r.change || 0,
        trend: r.trend || 'stable',
        found: r.found,
      }));
      setResults(rows);
      if (rows.length) incrementUsage('bulk_rank_check');
      if (!rows.length) message.info('No ranking data found');
      setActiveTab('results');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Rank check failed');
      setResults([]);
    } finally {
      setLoading(false);
      refresh();
    }
  };

  // ── Fetch History ──
  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await etsyApi.getRankHistory({ page, limit: 10 });
      setHistory(res.data?.checks || []);
      setHistoryTotal(res.data?.pagination?.total || 0);
      setHistoryPage(page);
    } catch {
      message.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Fetch Trend ──
  const fetchTrend = useCallback(async (keyword) => {
    if (!keyword) return;
    setTrendKeyword(keyword);
    setTrendLoading(true);
    try {
      const res = await etsyApi.getRankTrend({
        keyword,
        etsyListingId: selectedListing?.listingId || selectedListing?.etsyListingId || undefined,
      });
      setTrendData(res.data?.trend || []);
    } catch {
      message.error('Failed to load trend data');
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  }, [selectedListing]);

  // On tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'history' && history.length === 0) fetchHistory(1);
    if (key === 'trends' && !trendKeyword && results.length > 0) fetchTrend(results[0].keyword);
  };

  // ── Stats ──
  const avgRank = results.length ? Math.round(results.reduce((s, r) => s + r.rank, 0) / results.length) : 0;
  const page1Count = results.filter(r => r.page === 1).length;
  const foundCount = results.filter(r => r.found).length;

  // ── Results Table Columns ──
  const columns = [
    {
      title: 'Keyword', dataIndex: 'keyword', key: 'keyword',
      render: (t) => (
        <Text strong style={{ fontSize: 13, cursor: 'pointer', color: BRAND }}
          onClick={() => { setActiveTab('trends'); fetchTrend(t); }}>
          {t}
        </Text>
      ),
    },
    {
      title: 'Rank', dataIndex: 'rank', key: 'rank', width: 80, align: 'center',
      render: (r, row) => row.found ? (
        <Tag style={{
          fontWeight: 700, fontSize: 13, borderRadius: radii.pill,
          background: r <= 10 ? `${colors.success}18` : r <= 30 ? `${colors.warning}18` : `${colors.danger}18`,
          color: r <= 10 ? colors.success : r <= 30 ? colors.warning : colors.danger,
          border: 'none', padding: '2px 12px',
        }}>
          #{r}
        </Tag>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Page', dataIndex: 'page', key: 'page', width: 70, align: 'center',
      render: (p, row) => row.found ? <Text type="secondary">Page {p}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Volume', dataIndex: 'volume', key: 'volume', width: 100,
      render: (v) => <Text>{v.toLocaleString()}</Text>,
    },
    {
      title: 'Change', dataIndex: 'change', key: 'change', width: 90, align: 'center',
      render: (c, row) => (
        <Space size={4}>
          {row.trend === 'up' ? <RiseOutlined style={{ color: colors.success }} /> :
            row.trend === 'down' ? <FallOutlined style={{ color: colors.danger }} /> :
              <MinusOutlined style={{ color: colors.muted }} />}
          <Text style={{ color: c > 0 ? colors.success : c < 0 ? colors.danger : colors.muted, fontWeight: 600 }}>
            {c > 0 ? `+${c}` : c}
          </Text>
        </Space>
      ),
    },
  ];

  // ── History Table Columns ──
  const historyColumns = [
    {
      title: 'Date', dataIndex: 'checkedAt', key: 'date', width: 160,
      render: (d) => <Text style={{ fontSize: 12 }}><CalendarOutlined style={{ marginRight: 4 }} />{dayjs(d).format('MMM D, YYYY h:mm A')}</Text>,
    },
    {
      title: 'Listing', dataIndex: 'listingTitle', key: 'listing',
      render: (t, row) => <Text style={{ fontSize: 12 }}>{t || (row.etsyListingId === 'shop' ? 'All Shop Listings' : `ID: ${row.etsyListingId}`)}</Text>,
    },
    {
      title: 'Country', dataIndex: 'country', key: 'country', width: 80, align: 'center',
      render: (c) => <Tag style={{ fontSize: 11 }}>{c || 'US'}</Tag>,
    },
    {
      title: 'Keywords', dataIndex: 'keywordCount', key: 'kwCount', width: 90, align: 'center',
      render: (n) => <Text>{n}</Text>,
    },
    {
      title: 'Avg Rank', key: 'avgRank', width: 90, align: 'center',
      render: (_, row) => {
        const ranked = (row.results || []).filter(r => r.found && r.rank);
        if (!ranked.length) return <Text type="secondary">—</Text>;
        const avg = Math.round(ranked.reduce((s, r) => s + r.rank, 0) / ranked.length);
        return <Text strong>#{avg}</Text>;
      },
    },
  ];

  // ── Trend chart ──
  const maxRank = trendData.length ? Math.max(...trendData.map(t => t.rank || 0), 1) : 1;

  // ── Country Select options ──
  const countryOptions = (() => {
    const pinned = ['Global', 'US'];
    const unlocked = countries.filter(c => !c.isLocked);
    const locked = countries.filter(c => c.isLocked);
    const pinnedItems = unlocked.filter(c => pinned.includes(c.value));
    const otherUnlocked = unlocked.filter(c => !pinned.includes(c.value));
    const groups = [];
    if (pinnedItems.length || otherUnlocked.length) {
      groups.push({
        label: <span style={{ fontSize: 11, fontWeight: 700, color: colors.brand, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available in Your Plan</span>,
        options: [...pinnedItems, ...otherUnlocked].map(c => ({ value: c.value, label: c.label })),
      });
    }
    if (locked.length) {
      groups.push({
        label: <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Premium Markets</span>,
        options: locked.map(c => ({ value: c.value, label: c.label })),
      });
    }
    return groups;
  })();

  return (
    <AppLayout>
      <QuotaBanner featureKey="bulk_rank_check" featureName="Bulk rank checks" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <OrderedListOutlined style={{ marginRight: 10, color: BRAND }} />
            Bulk Rank Checker
          </Title>
          <Text type="secondary">Check your ranking for multiple keywords at once</Text>
        </div>
        <UsageBadge featureKey="bulk_rank_check" />
      </div>

      <FeatureGate featureKey="bulk_rank_check">
        {/* ── Input Section ── */}
        <Card style={{ ...card, marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {/* Country Select */}
            <Col xs={24} md={8}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Market</Text>
              <Select
                value={country}
                onChange={(val) => {
                  const c = countries.find(ct => ct.value === val);
                  if (c?.isLocked) {
                    setLockedCountry(c);
                    setUpgradeOpen(true);
                    return;
                  }
                  setCountry(val);
                }}
                options={countryOptions}
                size="large"
                style={{ width: '100%' }}
                prefix={<GlobalOutlined />}
                showSearch
                optionFilterProp="label"
                optionRender={(option) => {
                  const c = countries.find(ct => ct.value === option.value);
                  const isLocked = c?.isLocked;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: isLocked ? (isDark ? '#6B7280' : '#9CA3AF') : undefined }}>{option.label}</span>
                      {isLocked && <LockOutlined style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginLeft: 8 }} />}
                    </div>
                  );
                }}
              />
            </Col>
            {/* Listing Picker */}
            <Col xs={24} md={16}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Listing</Text>
              <Select
                value={selectedListing?.listingId || selectedListing?.etsyListingId || 'all'}
                onChange={(val) => {
                  if (val === 'all') { setSelectedListing(null); return; }
                  const l = listings.find(li => String(li.listingId || li.etsyListingId) === String(val));
                  setSelectedListing(l || null);
                }}
                size="large"
                style={{ width: '100%' }}
                prefix={<ShopOutlined />}
                showSearch
                optionFilterProp="label"
                placeholder="Select a listing to check rank for"
                options={[
                  { value: 'all', label: '🏪 All Shop Listings (auto-detect)' },
                  ...listings.map(l => ({
                    value: String(l.listingId || l.etsyListingId),
                    label: l.title || `Listing #${l.listingId || l.etsyListingId}`,
                  })),
                ]}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col xs={24} md={18}>
                <TextArea
                  rows={4}
                  placeholder={"Enter keywords, one per line...\nhandmade earrings\nboho necklace\npersonalized bracelet"}
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  style={{ borderRadius: radii.sm, fontSize: 13 }}
                />
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                  {keywords.split('\n').filter(k => k.trim()).length} keyword(s) entered
                </Text>
              </Col>
              <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Button
                  type="primary" size="large" loading={loading} block
                  icon={<ThunderboltOutlined />}
                  onClick={handleCheck}
                  style={{
                    background: `linear-gradient(135deg, ${BRAND}, ${colors.brandLight})`,
                    border: 'none', borderRadius: radii.sm, fontWeight: 600, height: 48,
                    boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
                  }}
                >
                  Check Rankings
                </Button>
              </Col>
            </Row>
          </div>
        </Card>

        {/* ── Stat Cards ── */}
        {results.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card style={card}>
                <Statistic title="Keywords Checked" value={results.length} valueStyle={{ color: BRAND, fontWeight: 700 }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={card}>
                <Statistic title="Found / Ranked" value={foundCount} suffix={`/ ${results.length}`} valueStyle={{ color: colors.success, fontWeight: 700 }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={card}>
                <Statistic title="Avg Rank" value={avgRank} prefix="#" valueStyle={{ fontWeight: 700 }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={card}>
                <Statistic title="On Page 1" value={page1Count} suffix={`/ ${results.length}`} valueStyle={{ color: colors.success, fontWeight: 700 }} />
              </Card>
            </Col>
          </Row>
        )}

        {/* ── Tabs ── */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          style={{ marginBottom: 24 }}
          items={[
            /* ── Results Tab ── */
            {
              key: 'results',
              label: <span><OrderedListOutlined /> Results</span>,
              children: results.length > 0 ? (
                <Card style={card}>
                  <Table
                    columns={columns}
                    dataSource={results}
                    pagination={false}
                    size="middle"
                  />
                </Card>
              ) : !loading ? (
                <Card style={card}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Enter keywords above to check your rankings" />
                </Card>
              ) : null,
            },
            /* ── History Tab ── */
            {
              key: 'history',
              label: <span><HistoryOutlined /> History</span>,
              children: (
                <Card style={card}>
                  <Title level={5} style={{ marginBottom: 16 }}>Rank Check History</Title>
                  {historyLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                  ) : history.length > 0 ? (
                    <Table
                      columns={historyColumns}
                      dataSource={history.map((h, i) => ({ ...h, key: h._id || i }))}
                      size="middle"
                      pagination={{
                        current: historyPage,
                        total: historyTotal,
                        pageSize: 10,
                        onChange: (p) => fetchHistory(p),
                        showSizeChanger: false,
                      }}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '8px 0' }}>
                            <Row gutter={[8, 8]}>
                              {(record.results || []).map((r, i) => (
                                <Col xs={24} sm={12} md={8} key={i}>
                                  <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 12px', borderRadius: radii.sm,
                                    background: isDark ? 'rgba(255,255,255,0.04)' : '#f9f9fb',
                                  }}>
                                    <Text style={{ fontSize: 12 }}>{r.keyword}</Text>
                                    <Space size={8}>
                                      {r.found ? (
                                        <Tag style={{
                                          fontWeight: 700, fontSize: 11, borderRadius: radii.pill, border: 'none', padding: '1px 8px',
                                          background: r.rank <= 10 ? `${colors.success}18` : r.rank <= 30 ? `${colors.warning}18` : `${colors.danger}18`,
                                          color: r.rank <= 10 ? colors.success : r.rank <= 30 ? colors.warning : colors.danger,
                                        }}>
                                          #{r.rank}
                                        </Tag>
                                      ) : (
                                        <Text type="secondary" style={{ fontSize: 11 }}>Not found</Text>
                                      )}
                                      {r.change !== 0 && (
                                        <Text style={{ fontSize: 11, color: r.change > 0 ? colors.success : colors.danger, fontWeight: 600 }}>
                                          {r.change > 0 ? `+${r.change}` : r.change}
                                        </Text>
                                      )}
                                    </Space>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        ),
                        expandIcon: ({ expanded, onExpand, record }) => (
                          <ExpandOutlined
                            style={{ color: BRAND, cursor: 'pointer', transform: expanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s' }}
                            onClick={e => onExpand(record, e)}
                          />
                        ),
                      }}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No rank check history yet. Run a check to see your history here." />
                  )}
                </Card>
              ),
            },
            /* ── Trends Tab ── */
            {
              key: 'trends',
              label: <span><LineChartOutlined /> Trends</span>,
              children: (
                <Card style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={5} style={{ margin: 0 }}>Rank Over Time</Title>
                    {results.length > 0 && (
                      <Select
                        value={trendKeyword || undefined}
                        onChange={(val) => fetchTrend(val)}
                        placeholder="Select keyword"
                        style={{ width: 260 }}
                        options={results.map(r => ({ value: r.keyword, label: r.keyword }))}
                      />
                    )}
                  </div>

                  {trendLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                  ) : trendData.length > 0 ? (
                    <>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                        Showing rank positions for "<strong>{trendKeyword}</strong>" — lower is better (rank #1 = top)
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, height: 200, paddingTop: 8 }}>
                        {trendData.map((t, i) => {
                          const barHeight = t.rank ? Math.max(((t.rank / maxRank) * 160), 12) : 8;
                          const barColor = !t.found ? colors.muted : t.rank <= 10 ? colors.success : t.rank <= 30 ? colors.warning : colors.danger;
                          return (
                            <Tooltip key={i} title={
                              <div>
                                <div>{dayjs(t.date).format('MMM D, YYYY')}</div>
                                <div>Rank: {t.found ? `#${t.rank}` : 'Not found'}</div>
                                {t.change !== 0 && <div>Change: {t.change > 0 ? `+${t.change}` : t.change}</div>}
                              </div>
                            }>
                              <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                <div style={{
                                  height: barHeight,
                                  background: `linear-gradient(180deg, ${barColor}, ${barColor}88)`,
                                  borderRadius: '6px 6px 0 0',
                                  transition: 'height 0.3s',
                                  opacity: 0.85,
                                  minWidth: 16,
                                }} />
                                <Text style={{ fontSize: 9, display: 'block', marginTop: 4, whiteSpace: 'nowrap' }}>
                                  {dayjs(t.date).format('M/D')}
                                </Text>
                                <Text style={{ fontSize: 9, fontWeight: 700, color: barColor }}>
                                  {t.found ? `#${t.rank}` : '—'}
                                </Text>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
                        <Space size={4}><div style={{ width: 10, height: 10, borderRadius: 2, background: colors.success }} /><Text style={{ fontSize: 11 }}>Top 10</Text></Space>
                        <Space size={4}><div style={{ width: 10, height: 10, borderRadius: 2, background: colors.warning }} /><Text style={{ fontSize: 11 }}>Top 30</Text></Space>
                        <Space size={4}><div style={{ width: 10, height: 10, borderRadius: 2, background: colors.danger }} /><Text style={{ fontSize: 11 }}>30+</Text></Space>
                        <Space size={4}><div style={{ width: 10, height: 10, borderRadius: 2, background: colors.muted }} /><Text style={{ fontSize: 11 }}>Not found</Text></Space>
                      </div>
                    </>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={trendKeyword ? `No historical data for "${trendKeyword}" yet. Run multiple checks over time to see trends.` : 'Run a rank check first, then select a keyword to view its rank trend.'} />
                  )}
                </Card>
              ),
            },
          ]}
        />
      </FeatureGate>

      {/* ── Country Upgrade Modal ── */}
      <Modal
        open={upgradeOpen}
        onCancel={() => setUpgradeOpen(false)}
        footer={null}
        centered
        width={480}
        styles={{
          content: {
            borderRadius: radii.lg,
            background: isDark ? tok.colorBgContainer : '#fff',
            padding: 0,
            overflow: 'hidden',
          },
        }}
      >
        <div style={{
          background: `linear-gradient(135deg, ${colors.brand}, ${colors.brandLight})`,
          padding: '32px 32px 24px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🌍</span>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            Unlock {lockedCountry?.name || 'International'} Market Data!
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'block', marginTop: 8 }}>
            International rank checking is reserved for our premium sellers.
          </Text>
        </div>
        <div style={{ padding: '24px 32px 32px' }}>
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : '#f9f9fb',
            borderRadius: radii.sm,
            padding: '16px 20px',
            marginBottom: 20,
            textAlign: 'center',
          }}>
            <Text style={{ fontSize: 14 }}>
              Upgrade to the <Tag color="purple" style={{ fontWeight: 600, fontSize: 13 }}>{lockedCountry?.requiredPlan}</Tag> plan
              to check rankings in <strong>{lockedCountry?.name}</strong>.
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <Tag style={{ fontSize: 12, padding: '2px 10px' }}>Current Plan: {plan?.name || 'Free'}</Tag>
          </div>
          <Button
            type="primary" block size="large" icon={<CrownOutlined />}
            onClick={() => { setUpgradeOpen(false); navigate('/settings?tab=plans'); }}
            style={{
              background: `linear-gradient(135deg, ${colors.brand}, ${colors.brandLight})`,
              border: 'none', borderRadius: radii.sm,
              fontWeight: 600, height: 48,
              boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
            }}
          >
            View Upgrade Plans
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default BulkRankCheckerPage;
