import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Input, Button, Table, Tag, Typography, Row, Col, Avatar,
  Space, Empty, Statistic, message, theme, Tooltip, Badge, Popconfirm,
} from 'antd';
import {
  PlusOutlined, ShopOutlined, TrophyOutlined, StarFilled,
  RiseOutlined, FallOutlined, DeleteOutlined, TeamOutlined,
  ReloadOutlined, DollarOutlined, LinkOutlined, HeartOutlined,
  EyeOutlined, TagOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import AppLayout from '../components/AppLayout';
import FeatureGate from '../components/common/FeatureGate';
import QuotaBanner from '../components/common/QuotaBanner';
import UsageBadge from '../components/common/UsageBadge';
import { usePermissions } from '../context/PermissionsContext';
import { useTheme } from '../context/ThemeContext';
import { colors, radii } from '../theme/tokens';
import etsyApi from '../api/etsyApi';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const CompetitorTrackerPage = () => {
  const { isDark } = useTheme();
  const { token: tok } = theme.useToken();
  const { getFeatureAccess, incrementUsage } = usePermissions();
  const access = getFeatureAccess('competitor_tracking');

  const [shopUrl, setShopUrl] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const card = {
    borderRadius: radii.lg,
    border: `1px solid ${isDark ? colors.darkBorder : colors.lightBorder}`,
    background: tok.colorBgContainer,
  };

  /* ─── Fetch watch list ─── */

  const fetchWatchList = useCallback(async () => {
    try {
      const res = await etsyApi.getWatchList();
      const list = (res.data?.watches || []).map(w => ({
        key: w._id,
        _id: w._id,
        shopName: w.shopName,
        etsyShopId: w.etsyShopId,
        iconUrl: w.iconUrl || '',
        shopCountry: w.shopCountry || '',
        totalSales: w.latestSnapshot?.totalSales || 0,
        totalListings: w.latestSnapshot?.totalListings || 0,
        avgPrice: w.latestSnapshot?.avgPrice || 0,
        rating: w.latestSnapshot?.rating || 0,
        reviewCount: w.latestSnapshot?.reviewCount || 0,
        dailySalesDelta: w.latestSnapshot?.dailySalesDelta || 0,
        capturedAt: w.latestSnapshot?.capturedAt || w.addedAt,
        status: w.status || 'active',
        addedAt: w.addedAt,
      }));
      setShops(list);
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.warn('Failed to load watch list');
      }
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => { fetchWatchList(); }, [fetchWatchList]);

  /* ─── Add competitor ─── */

  const handleAdd = async () => {
    const raw = shopUrl.trim();
    if (!raw) { message.warning('Enter an Etsy shop URL or name'); return; }
    setLoading(true);
    try {
      let shopName = raw;
      // Extract shop name from various URL formats
      const urlMatch = raw.match(/etsy\.com\/shop\/([A-Za-z0-9_-]+)/i);
      if (urlMatch) shopName = urlMatch[1];
      else shopName = raw.replace(/[^a-zA-Z0-9\-_]/g, '');

      await etsyApi.addCompetitor({ shopName });
      incrementUsage('competitor_tracking');
      message.success(`Now tracking ${shopName}`);
      setShopUrl('');
      fetchWatchList();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to add competitor');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Remove competitor ─── */

  const handleRemove = async (record) => {
    try {
      await etsyApi.removeCompetitor(record._id);
      setShops(prev => prev.filter(s => s.key !== record.key));
      message.success(`${record.shopName} removed`);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to remove competitor');
    }
  };

  /* ─── Refresh single ─── */

  const handleRefresh = async (record) => {
    setRefreshingId(record._id);
    try {
      await etsyApi.refreshCompetitor(record._id);
      message.success(`${record.shopName} refreshed`);
      fetchWatchList();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Refresh failed');
    } finally {
      setRefreshingId(null);
    }
  };

  /* ─── Refresh all ─── */

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    try {
      const res = await etsyApi.refreshAllCompetitors();
      const d = res.data || {};
      message.success(`Refreshed ${d.refreshed || 0} shops${d.failed ? ` (${d.failed} failed)` : ''}`);
      fetchWatchList();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Refresh all failed');
    } finally {
      setRefreshingAll(false);
    }
  };

  /* ─── Stats ─── */

  const totalSales = shops.reduce((s, r) => s + r.totalSales, 0);
  const avgRating = shops.length
    ? Math.round(shops.reduce((s, r) => s + r.rating, 0) / shops.length * 10) / 10
    : 0;
  const avgPrice = shops.length
    ? Math.round(shops.reduce((s, r) => s + r.avgPrice, 0) / shops.length * 100) / 100
    : 0;

  /* ─── Expandable row – top listings ─── */

  const expandedRowRender = (record) => {
    const [snaps, setSnaps] = useState([]);
    const [snapLoading, setSnapLoading] = useState(true);

    useEffect(() => {
      (async () => {
        try {
          const res = await etsyApi.getSnapshots(record._id, { limit: 1 });
          const latest = res.data?.snapshots?.[0];
          setSnaps(latest?.topListings || []);
        } catch { setSnaps([]); }
        finally { setSnapLoading(false); }
      })();
    }, [record._id]);

    if (snapLoading) return <Text type="secondary">Loading top listings...</Text>;
    if (!snaps.length) return <Text type="secondary">No listing data captured yet.</Text>;

    return (
      <div style={{ padding: '8px 0' }}>
        <Text strong style={{ marginBottom: 8, display: 'block', fontSize: 13 }}>
          Top Listings ({snaps.length})
        </Text>
        <Table
          dataSource={snaps.map((l, i) => ({ key: i, ...l }))}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Title',
              dataIndex: 'title',
              key: 'title',
              ellipsis: true,
              render: (t, r) => (
                <a
                  href={`https://www.etsy.com/listing/${r.listingId}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: colors.brand, fontSize: 12 }}
                >
                  {t}
                </a>
              ),
            },
            {
              title: 'Price',
              dataIndex: 'price',
              key: 'price',
              width: 80,
              align: 'right',
              render: v => <Text style={{ fontSize: 12 }}>${v?.toFixed(2)}</Text>,
            },
            {
              title: <><EyeOutlined /> Views</>,
              dataIndex: 'views',
              key: 'views',
              width: 80,
              align: 'center',
              render: v => <Text style={{ fontSize: 12 }}>{(v || 0).toLocaleString()}</Text>,
            },
            {
              title: <><HeartOutlined /> Faves</>,
              dataIndex: 'favorites',
              key: 'favorites',
              width: 80,
              align: 'center',
              render: v => <Text style={{ fontSize: 12 }}>{(v || 0).toLocaleString()}</Text>,
            },
            {
              title: <><TagOutlined /> Tags</>,
              dataIndex: 'tags',
              key: 'tags',
              width: 200,
              render: tags => (
                <Space size={2} wrap>
                  {(tags || []).slice(0, 5).map((t, i) => (
                    <Tag key={i} style={{ fontSize: 10, margin: 0, lineHeight: '18px' }}>{t}</Tag>
                  ))}
                  {(tags || []).length > 5 && (
                    <Tag style={{ fontSize: 10, margin: 0, lineHeight: '18px' }}>+{tags.length - 5}</Tag>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </div>
    );
  };

  /* ─── Main table columns ─── */

  const columns = [
    {
      title: 'Shop',
      dataIndex: 'shopName',
      key: 'shopName',
      render: (text, record) => (
        <Space>
          <Avatar
            src={record.iconUrl || undefined}
            icon={!record.iconUrl && <ShopOutlined />}
            size={36}
            style={{ background: !record.iconUrl ? colors.brand : undefined }}
          />
          <div style={{ lineHeight: 1.3 }}>
            <a
              href={`https://www.etsy.com/shop/${encodeURIComponent(text)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontWeight: 600, fontSize: 13, color: 'inherit' }}
            >
              {text} <LinkOutlined style={{ fontSize: 10, opacity: 0.5 }} />
            </a>
            {record.shopCountry && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  📍 {record.shopCountry}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.totalSales - b.totalSales,
      render: v => <Text strong>{v.toLocaleString()}</Text>,
    },
    {
      title: 'Listings',
      dataIndex: 'totalListings',
      key: 'totalListings',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.totalListings - b.totalListings,
      render: v => v.toLocaleString(),
    },
    {
      title: 'Daily Δ',
      dataIndex: 'dailySalesDelta',
      key: 'dailySalesDelta',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.dailySalesDelta - b.dailySalesDelta,
      render: v => {
        if (v > 0) return <Tag color="success" style={{ fontWeight: 600 }}><RiseOutlined /> +{v}</Tag>;
        if (v < 0) return <Tag color="error" style={{ fontWeight: 600 }}><FallOutlined /> {v}</Tag>;
        return <Tag>0</Tag>;
      },
    },
    {
      title: 'Avg Price',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: 90,
      align: 'right',
      sorter: (a, b) => a.avgPrice - b.avgPrice,
      render: v => <Text>${v.toFixed(2)}</Text>,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 110,
      align: 'center',
      sorter: (a, b) => a.rating - b.rating,
      render: (v, record) => (
        <Tooltip title={`${record.reviewCount.toLocaleString()} reviews`}>
          <Tag color="gold" style={{ fontWeight: 600 }}>
            <StarFilled /> {v > 0 ? v.toFixed(1) : '—'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: v => (
        <Badge
          status={v === 'active' ? 'success' : 'error'}
          text={<Text style={{ fontSize: 12 }}>{v === 'active' ? 'Active' : 'Error'}</Text>}
        />
      ),
    },
    {
      title: 'Last Synced',
      dataIndex: 'capturedAt',
      key: 'capturedAt',
      width: 120,
      render: v => (
        <Tooltip title={v ? dayjs(v).format('MMM D, YYYY h:mm A') : '—'}>
          <Text type="secondary" style={{ fontSize: 12 }}>{v ? dayjs(v).fromNow() : '—'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Refresh data">
            <Button
              type="text" size="small"
              icon={<ReloadOutlined spin={refreshingId === record._id} />}
              onClick={() => handleRefresh(record)}
              disabled={refreshingId === record._id}
            />
          </Tooltip>
          <Popconfirm
            title="Remove this shop?"
            onConfirm={() => handleRemove(record)}
            okText="Remove"
            cancelText="Cancel"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <TeamOutlined style={{ color: colors.brand, marginRight: 8 }} />
            Shop Tracker
          </Title>
          <Text type="secondary">Monitor competitor shops, listings, prices, and daily sales</Text>
        </div>
        <Space>
          {shops.length > 0 && (
            <Button
              icon={<ReloadOutlined spin={refreshingAll} />}
              onClick={handleRefreshAll}
              loading={refreshingAll}
              style={{ borderRadius: radii.sm }}
            >
              Refresh All
            </Button>
          )}
          {access.state === 'unlocked' && (
            <UsageBadge used={access.used} limit={access.unlimited ? null : access.limit} showLabel />
          )}
        </Space>
      </div>

      <QuotaBanner featureKey="competitor_tracking" featureName="Tracked Shops" />

      <FeatureGate featureKey="competitor_tracking">
        {/* Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} md={6}>
            <Card style={card}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Tracked Shops</Text>}
                value={shops.length}
                prefix={<ShopOutlined style={{ color: colors.brand }} />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={card}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Sales</Text>}
                value={totalSales}
                prefix={<TrophyOutlined style={{ color: colors.success }} />}
                formatter={v => Number(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={card}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Avg Rating</Text>}
                value={avgRating || '—'}
                prefix={<StarFilled style={{ color: '#faad14' }} />}
                precision={avgRating ? 1 : 0}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={card}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Avg Price</Text>}
                value={avgPrice}
                prefix={<DollarOutlined style={{ color: colors.brand }} />}
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        {/* Add shop */}
        <Card style={{ ...card, marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Input
                placeholder="Enter Etsy shop URL or name (e.g. CraftedByEmma or https://etsy.com/shop/CraftedByEmma)"
                prefix={<ShopOutlined />}
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                onPressEnter={handleAdd}
                size="large"
              />
            </Col>
            <Col xs={24} md={8}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                loading={loading}
                size="large"
                block
                style={{
                  background: `linear-gradient(135deg, ${colors.brand}, ${colors.brandLight})`,
                  border: 'none', borderRadius: radii.sm, fontWeight: 600,
                }}
              >
                Track Shop
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card style={card}>
          {shops.length > 0 ? (
            <Table
              columns={columns}
              dataSource={shops}
              pagination={shops.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
              size="middle"
              loading={fetchLoading}
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
              }}
              scroll={{ x: 900 }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    No shops tracked yet
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Add a competitor's Etsy shop above to start monitoring their sales, listings, and pricing.
                  </Text>
                </div>
              }
            />
          )}
        </Card>
      </FeatureGate>
    </AppLayout>
  );
};

export default CompetitorTrackerPage;
