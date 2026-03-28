import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Statistic, Button, Typography,
  Tag, Progress, theme, Alert, Space, List, Empty, message,
  Modal, Tooltip, Spin,
} from "antd";
import {
  ThunderboltOutlined, RocketOutlined,
  ClockCircleOutlined,
  SyncOutlined, SearchOutlined, KeyOutlined,
  TeamOutlined, HistoryOutlined, EyeOutlined, LockOutlined,
  ShopOutlined, DisconnectOutlined, ExportOutlined,
  CheckCircleOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import SuccessTracker from "../components/dashboard/SuccessTracker";
import ConnectShopPrompt from "../components/ConnectShopPrompt";
import SyncingState from "../components/SyncingState";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSite } from "../context/SiteContext";
import { usePermissions } from "../context/PermissionsContext";
import { colors, radii } from "../theme/tokens";
import analysisApi from "../api/analysisApi";
import etsyApi from "../api/etsyApi";

const { Title, Text } = Typography;
const BRAND = "#6C63FF";

const DashboardPage = () => {
  const { user, fetchMe, token } = useAuth();
  const { isDark } = useTheme();
  const { siteConfig } = useSite();
  const { getFeatureAccess } = usePermissions();
  const { token: tok } = theme.useToken();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [shopSyncing, setShopSyncing] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const subStatus = user?.subscriptionStatus || "inactive";
  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000)) : null;

  // Detect OAuth callback redirect — ?etsy_connected=true&shop=ShopName
  useEffect(() => {
    const connected = searchParams.get('etsy_connected');
    const etsyError = searchParams.get('etsy_error');
    if (connected === 'true') {
      const shopName = searchParams.get('shop');
      message.success(`Etsy shop${shopName ? ` "${shopName}"` : ''} connected! Syncing your data...`);
      setShopSyncing(true);
      fetchMe(token);
      setSearchParams({}, { replace: true });
    } else if (etsyError) {
      const errorMessages = {
        access_denied: 'You declined the Etsy authorization request.',
        connection_failed: 'Failed to connect your Etsy shop. Please try again.',
      };
      message.error(errorMessages[etsyError] || 'Something went wrong connecting your Etsy shop.');
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine if user has connected their shop
  const hasShop = !!user?.etsyConnected;

  // Fetch shop info when connected
  useEffect(() => {
    if (hasShop) {
      setShopLoading(true);
      etsyApi.getShopInfo()
        .then(res => {
          if (res.success && res.data?.connected) {
            setShopInfo(res.data.shop);
          }
        })
        .catch(() => {})
        .finally(() => setShopLoading(false));
    }
  }, [hasShop]);

  const card = {
    border: `1px solid ${isDark ? "#2e2e4a" : "#ebebf8"}`,
    borderRadius: radii.lg,
    background: tok.colorBgContainer,
    boxShadow: isDark ? "none" : "0 2px 12px rgba(108,99,255,0.06)",
  };

  // Fetch recent analyses
  useEffect(() => {
    analysisApi.getHistory({ page: 1, limit: 5 })
      .then(res => setRecentAnalyses(res.analyses || []))
      .catch(() => {});
  }, []);

  // Disconnect shop handler
  const handleDisconnect = () => {
    Modal.confirm({
      title: 'Disconnect Etsy Shop',
      content: `Are you sure you want to disconnect "${shopInfo?.shopName || 'your shop'}"? You can reconnect anytime.`,
      okText: 'Disconnect',
      okButtonProps: { danger: true },
      onOk: async () => {
        setDisconnecting(true);
        try {
          const res = await etsyApi.disconnect();
          if (res.success) {
            message.success('Etsy shop disconnected');
            setShopInfo(null);
            fetchMe(token);
          }
        } catch {
          message.error('Failed to disconnect shop');
        } finally {
          setDisconnecting(false);
        }
      },
    });
  };

  /* ── Command Center Cards ── */
  const commandCards = [
    {
      key: 'listing_audit',
      title: 'Audit a Listing',
      desc: 'Get AI-powered SEO recommendations for your Etsy listing',
      icon: <SearchOutlined style={{ fontSize: 28 }} />,
      route: '/audit',
      gradient: `linear-gradient(135deg, ${colors.brand}, ${colors.brandLight})`,
    },
    {
      key: 'keyword_search',
      title: 'Research Keywords',
      desc: 'Find high-traffic keywords that drive sales',
      icon: <KeyOutlined style={{ fontSize: 28 }} />,
      route: '/keywords',
      gradient: `linear-gradient(135deg, ${colors.success}, #34D399)`,
    },
    {
      key: 'competitor_tracking',
      title: 'Track Competitors',
      desc: 'Monitor competitor shops and stay ahead',
      icon: <TeamOutlined style={{ fontSize: 28 }} />,
      route: '/competitors',
      gradient: `linear-gradient(135deg, ${colors.warning}, #FB923C)`,
    },
  ];

  // If user hasn't connected their Etsy shop, show the onboarding flow
  if (!hasShop && !shopSyncing) {
    return (
      <AppLayout>
        <ConnectShopPrompt
          onConnect={async () => {
            try {
              const res = await etsyApi.getAuthUrl();
              if (res.success && res.data?.authUrl) {
                window.location.href = res.data.authUrl;
              }
            } catch {
              setShopSyncing(true);
            }
          }}
        />
      </AppLayout>
    );
  }

  if (shopSyncing) {
    return (
      <AppLayout>
        <SyncingState
          onComplete={() => setShopSyncing(false)}
        />
      </AppLayout>
    );
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <AppLayout>
      {/* Trial / Expired Alert */}
      {subStatus === "trial" && daysLeft !== null && daysLeft <= 3 && (
        <Alert
          type="warning" showIcon icon={<ClockCircleOutlined />}
          message={`Trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          description="Upgrade now to keep all features."
          action={<Button type="primary" size="small" onClick={() => navigate("/settings?tab=plans")}>Upgrade</Button>}
          style={{ marginBottom: 20, borderRadius: 12 }}
        />
      )}
      {subStatus === "expired" && (
        <Alert
          type="error" showIcon
          message="Your trial has expired"
          description="Choose a paid plan to continue."
          action={<Button type="primary" danger size="small" onClick={() => navigate("/settings?tab=plans")}>Choose Plan</Button>}
          style={{ marginBottom: 20, borderRadius: 12 }}
        />
      )}

      {/* Success Tracker — Onboarding Gamification */}
      <SuccessTracker />

      {/* Welcome Banner — simplified */}
      <Card
        style={{
          ...card,
          background: `linear-gradient(135deg, ${BRAND} 0%, #A78BFA 100%)`,
          marginBottom: 24,
        }}
        styles={{ body: { padding: "24px 28px" } }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          Welcome back, {user?.name?.split(" ")[0] || "there"}!
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4, display: 'block' }}>
          Here's an overview of your Etsy shop and tools.
        </Text>
      </Card>

      {/* Connected Shop Card */}
      <Card
        style={{ ...card, marginBottom: 24 }}
        styles={{ body: { padding: 0 } }}
      >
        {shopLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        ) : shopInfo ? (
          <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
            {/* Shop icon + name */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '20px 24px', flex: '1 1 auto', minWidth: 240,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `linear-gradient(135deg, #F97316, #FB923C)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShopOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>{shopInfo.shopName}</Text>
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color="success"
                    style={{ borderRadius: 12, fontSize: 11, fontWeight: 600 }}
                  >
                    Connected
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Connected {formatDate(shopInfo.createdAt)}
                  {shopInfo.lastSyncAt && <> · Last synced {formatDate(shopInfo.lastSyncAt)}</>}
                </Text>
              </div>
            </div>

            {/* Shop stats */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 32,
              padding: '20px 24px',
              borderLeft: `1px solid ${isDark ? '#2e2e4a' : '#ebebf8'}`,
              flexShrink: 0,
            }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Listings</Text>
                <Text strong style={{ fontSize: 18, color: BRAND }}>{shopInfo.listingCount ?? '—'}</Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Sales</Text>
                <Text strong style={{ fontSize: 18, color: colors.success }}>{shopInfo.totalSales ?? '—'}</Text>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '20px 24px',
              borderLeft: `1px solid ${isDark ? '#2e2e4a' : '#ebebf8'}`,
              flexShrink: 0,
            }}>
              <Tooltip title="View listings">
                <Button
                  icon={<UnorderedListOutlined />}
                  onClick={() => navigate('/listings/active')}
                >
                  Listings
                </Button>
              </Tooltip>
              <Tooltip title="View on Etsy">
                <Button
                  icon={<ExportOutlined />}
                  href={`https://www.etsy.com/shop/${shopInfo.shopName}`}
                  target="_blank"
                />
              </Tooltip>
              <Tooltip title="Disconnect shop">
                <Button
                  danger
                  icon={<DisconnectOutlined />}
                  loading={disconnecting}
                  onClick={handleDisconnect}
                />
              </Tooltip>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', textAlign: 'center' }}>
            <Text type="secondary">Unable to load shop info</Text>
          </div>
        )}
      </Card>

      {/* Command Center — Feature Action Cards */}
      <Title level={4} style={{ marginBottom: 16 }}>
        <RocketOutlined style={{ color: BRAND, marginRight: 8 }} />
        Command Center
      </Title>
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {commandCards.map(cc => {
          const access = getFeatureAccess(cc.key);
          const isLocked = access.state === 'locked';
          return (
            <Col xs={24} sm={8} key={cc.key}>
              <Card
                hoverable
                style={{
                  ...card,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: '24px' } }}
                onClick={() => navigate(cc.route)}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: cc.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', marginBottom: 16,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.15)`,
                  opacity: isLocked ? 0.5 : 1,
                }}>
                  {cc.icon}
                </div>
                <Title level={5} style={{ margin: '0 0 4px', opacity: isLocked ? 0.6 : 1 }}>
                  {cc.title}
                  {isLocked && <LockOutlined style={{ marginLeft: 8, fontSize: 14, color: colors.muted }} />}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{cc.desc}</Text>
                {!isLocked && access.limit && !access.unlimited && (
                  <div style={{ marginTop: 12 }}>
                    <Progress
                      percent={Math.round((access.used / access.limit) * 100)}
                      size="small" showInfo={false}
                      strokeColor={cc.gradient}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>{access.used}/{access.limit} used</Text>
                  </div>
                )}
                {isLocked && (
                  <Tag color="default" style={{ marginTop: 12, fontSize: 11 }}>
                    <LockOutlined /> Upgrade to unlock
                  </Tag>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Recent Activity */}
      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <Card
            style={card}
            title={<><HistoryOutlined style={{ color: BRAND, marginRight: 8 }} /> Recent Analyses</>}
            extra={recentAnalyses.length > 0 && <Button type="link" onClick={() => navigate('/history')}>View All</Button>}
          >
            {recentAnalyses.length > 0 ? (
              <List
                dataSource={recentAnalyses}
                renderItem={item => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '12px 0' }}
                    onClick={() => navigate(`/history/${item.id}`)}
                    actions={[
                      <Button type="text" size="small" icon={<EyeOutlined />} key="view">View</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={<Text strong style={{ fontSize: 13 }}>{item.title}</Text>}
                      description={
                        <Space>
                          <Tag>{item.category}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </Space>
                      }
                    />
                    <Tag
                      color={item.score >= 80 ? 'green' : item.score >= 60 ? 'gold' : 'red'}
                      style={{ fontWeight: 700, fontSize: 14, padding: '2px 12px' }}
                    >
                      {item.score}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={8} style={{ textAlign: 'center' }}>
                    <Text type="secondary">No analyses yet</Text>
                    <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => navigate('/audit')}
                      style={{ background: `linear-gradient(135deg, ${BRAND}, #A78BFA)`, border: 'none' }}>
                      Run Your First Audit
                    </Button>
                  </Space>
                }
              />
            )}
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
};

export default DashboardPage;
