import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Space, Typography, Statistic, Row, Col,
  DatePicker, Input, Button, Tooltip, Badge, Progress, Modal,
  message, Spin, Empty,
} from 'antd';
import {
  DatabaseOutlined, CalendarOutlined, SearchOutlined,
  ReloadOutlined, RiseOutlined, FallOutlined, MinusOutlined,
  FireOutlined, ThunderboltOutlined, LineChartOutlined,
  CloudOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import keywordSnapshotApi from '../../api/keywordSnapshotApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const BRAND = '#6C63FF';

const KeywordSnapshotsPage = () => {
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [filters, setFilters] = useState({ date: null, keyword: '', sort: 'fusionScore', order: 'desc' });
  const [trendModal, setTrendModal] = useState({ open: false, keyword: '', data: null, loading: false });

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await keywordSnapshotApi.getSummary();
      if (data.success) setSummary(data.summary);
    } catch {
      message.error('Failed to load snapshot summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchSnapshots = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (filters.date) params.date = filters.date;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.sort) params.sort = filters.sort;
      if (filters.order) params.order = filters.order;
      const data = await keywordSnapshotApi.listSnapshots(params);
      if (data.success) {
        setSnapshots(data.snapshots);
        setPagination(data.pagination);
      }
    } catch {
      message.error('Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchSnapshots(1); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTrend = async (keyword) => {
    setTrendModal({ open: true, keyword, data: null, loading: true });
    try {
      const data = await keywordSnapshotApi.getKeywordTrend(keyword, 30);
      if (data.success) {
        setTrendModal((prev) => ({ ...prev, data, loading: false }));
      }
    } catch {
      message.error('Failed to load trend');
      setTrendModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const trendIcon = (trend) => {
    if (trend === 'rising') return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'declining') return <FallOutlined style={{ color: '#ff4d4f' }} />;
    return <MinusOutlined style={{ color: '#faad14' }} />;
  };

  const columns = [
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
      fixed: 'left',
      width: 180,
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Fusion Score',
      dataIndex: 'fusionScore',
      key: 'fusionScore',
      width: 130,
      align: 'center',
      sorter: true,
      defaultSortOrder: 'descend',
      render: (score) => {
        if (score === null || score === undefined) return <Text type="secondary">—</Text>;
        const color = score >= 70 ? '#52c41a' : score >= 40 ? '#faad14' : '#ff4d4f';
        return (
          <Space>
            <Progress
              type="circle"
              percent={score}
              size={36}
              strokeColor={color}
              format={(p) => <span style={{ fontSize: 11, fontWeight: 700 }}>{p}</span>}
            />
          </Space>
        );
      },
    },
    {
      title: 'Etsy Results',
      dataIndex: 'totalResults',
      key: 'totalResults',
      width: 110,
      align: 'right',
      sorter: true,
      render: (v) => v?.toLocaleString() || '0',
    },
    {
      title: 'Avg Views',
      dataIndex: 'avgViews',
      key: 'avgViews',
      width: 95,
      align: 'right',
      sorter: true,
      render: (v) => v?.toLocaleString() || '0',
    },
    {
      title: 'Competition',
      dataIndex: 'competitionPct',
      key: 'competitionPct',
      width: 110,
      align: 'center',
      sorter: true,
      render: (v) => {
        const color = v >= 60 ? 'red' : v >= 30 ? 'orange' : 'green';
        return <Tag color={color}>{v?.toFixed(1)}%</Tag>;
      },
    },
    {
      title: <><CloudOutlined /> Google Trends</>,
      key: 'googleTrends',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const gt = record.googleTrends;
        if (!gt || gt.interest === null) return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
            <Space size={4}>
              {trendIcon(gt.trend)}
              <Text strong>{gt.interest}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>/100</Text>
            </Space>
            <Tag style={{ fontSize: 10, margin: 0 }} color={
              gt.seasonality === 'seasonal' ? 'volcano' : 'cyan'
            }>
              {gt.seasonality || 'unknown'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: <><FireOutlined /> Freshness</>,
      key: 'freshness',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const f = record.freshness;
        if (!f || f.newListingPct === null) return <Text type="secondary">—</Text>;
        const color = f.marketSignal === 'hot' ? 'green' : f.marketSignal === 'warm' ? 'orange' : 'default';
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{f.newListingPct?.toFixed(1)}% new</Text>
            <Tag color={color} style={{ fontSize: 10, margin: 0 }}>
              {f.marketSignal?.toUpperCase() || '—'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: <><ThunderboltOutlined /> Velocity</>,
      key: 'velocity',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const v = record.velocity;
        if (!v || v.avgViewsPerDay === null) return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 12 }}>{v.avgViewsPerDay?.toFixed(1)} views/d</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{v.avgFavoritesPerDay?.toFixed(1)} favs/d</Text>
          </Space>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'snapshotDate',
      key: 'snapshotDate',
      width: 100,
      render: (v) => v ? dayjs(v).format('MMM D, YYYY') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View 30-day trend">
          <Button
            size="small"
            type="primary"
            ghost
            icon={<LineChartOutlined />}
            onClick={() => openTrend(record.keyword)}
          />
        </Tooltip>
      ),
    },
  ];

  const handleTableChange = (pag, _filters, sorter) => {
    if (sorter?.field) {
      setFilters((prev) => ({
        ...prev,
        sort: sorter.field,
        order: sorter.order === 'ascend' ? 'asc' : 'desc',
      }));
    }
    if (pag?.current) {
      fetchSnapshots(pag.current);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <DatabaseOutlined style={{ marginRight: 8, color: BRAND }} />
          Keyword Snapshots
        </Title>
        <Text type="secondary">
          Daily keyword data dumps — Etsy metrics, Google Trends, freshness &amp; fusion scores
        </Text>
      </div>

      {/* Summary Cards */}
      <Spin spinning={summaryLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Total Snapshots"
                value={summary?.totalSnapshots || 0}
                prefix={<DatabaseOutlined style={{ color: BRAND }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Unique Keywords"
                value={summary?.uniqueKeywords || 0}
                prefix={<SearchOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="First Snapshot"
                value={summary?.firstDate ? dayjs(summary.firstDate).format('MMM D') : 'None'}
                prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Latest Snapshot"
                value={summary?.lastDate ? dayjs(summary.lastDate).format('MMM D') : 'None'}
                prefix={<FieldTimeOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Daily Dump History */}
      {summary?.dailyCounts?.length > 0 && (
        <Card title="Daily Dump History (Last 30 Days)" style={{ borderRadius: 12, marginBottom: 24 }} size="small">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[...(summary.dailyCounts || [])].reverse().map((d) => {
              const height = Math.max(8, Math.min(60, (d.count / Math.max(...summary.dailyCounts.map((x) => x.count))) * 60));
              return (
                <Tooltip
                  key={d.date}
                  title={
                    <div>
                      <div>{dayjs(d.date).format('MMM D, YYYY')}</div>
                      <div>{d.count} keywords captured</div>
                      <div>Avg Fusion: {d.avgFusion ?? '—'}</div>
                      <div>Trends: {d.trendsCollected} collected</div>
                    </div>
                  }
                >
                  <div
                    style={{
                      width: 14,
                      height,
                      background: d.count > 0 ? BRAND : '#f0f0f0',
                      borderRadius: 3,
                      cursor: 'pointer',
                      opacity: d.trendsCollected > 0 ? 1 : 0.5,
                    }}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, date: dayjs(d.date).format('YYYY-MM-DD') }));
                    }}
                  />
                </Tooltip>
              );
            })}
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Click a bar to filter snapshots by that date. Full opacity = Google Trends data collected.
            </Text>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small">
        <Space wrap>
          <DatePicker
            placeholder="Filter by date"
            value={filters.date ? dayjs(filters.date) : null}
            onChange={(d) => setFilters((prev) => ({ ...prev, date: d ? d.format('YYYY-MM-DD') : null }))}
            allowClear
          />
          <Input
            placeholder="Search keyword..."
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={() => fetchSnapshots(1)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<SearchOutlined />} type="primary" onClick={() => fetchSnapshots(1)}
            style={{ background: BRAND, borderColor: BRAND }}>
            Search
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setFilters({ date: null, keyword: '', sort: 'fusionScore', order: 'desc' });
          }}>
            Reset
          </Button>
        </Space>
      </Card>

      {/* Main Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={snapshots}
          rowKey="_id"
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} snapshots`,
          }}
          locale={{
            emptyText: <Empty description="No snapshots yet. The cron job runs daily at 2:00 AM UTC." />,
          }}
        />
      </Card>

      {/* Trend Modal */}
      <Modal
        title={
          <Space>
            <LineChartOutlined style={{ color: BRAND }} />
            <span>30-Day Trend: <Text strong>{trendModal.keyword}</Text></span>
          </Space>
        }
        open={trendModal.open}
        onCancel={() => setTrendModal({ open: false, keyword: '', data: null, loading: false })}
        footer={null}
        width={700}
      >
        {trendModal.loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
        ) : trendModal.data ? (
          <div>
            {/* Week-over-Week */}
            {trendModal.data.weekOverWeek && !trendModal.data.weekOverWeek.insufficient && (
              <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="This Week Avg" value={trendModal.data.weekOverWeek.thisWeekAvg} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Last Week Avg" value={trendModal.data.weekOverWeek.lastWeekAvg} />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Change"
                      value={trendModal.data.weekOverWeek.changePct}
                      suffix="%"
                      valueStyle={{
                        color: trendModal.data.weekOverWeek.changePct > 0 ? '#52c41a' :
                               trendModal.data.weekOverWeek.changePct < 0 ? '#ff4d4f' : '#faad14',
                      }}
                      prefix={trendModal.data.weekOverWeek.changePct > 0 ? <RiseOutlined /> :
                              trendModal.data.weekOverWeek.changePct < 0 ? <FallOutlined /> : <MinusOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            )}
            {trendModal.data.weekOverWeek?.insufficient && (
              <Badge.Ribbon text="Needs 14+ days of data" color="orange">
                <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
                  <Text type="secondary">
                    Week-over-week comparison requires at least 14 days of snapshot data. Keep the cron job running!
                  </Text>
                </Card>
              </Badge.Ribbon>
            )}

            {/* Trend data table */}
            <Table
              size="small"
              dataSource={trendModal.data.trend || []}
              rowKey="snapshotDate"
              pagination={false}
              scroll={{ y: 300 }}
              columns={[
                {
                  title: 'Date', dataIndex: 'snapshotDate', key: 'date',
                  render: (v) => dayjs(v).format('MMM D'),
                },
                { title: 'Results', dataIndex: 'totalResults', key: 'tr', render: (v) => v?.toLocaleString() },
                { title: 'Avg Views', dataIndex: 'avgViews', key: 'av' },
                { title: 'Avg Favs', dataIndex: 'avgFavorites', key: 'af' },
                {
                  title: 'Competition', dataIndex: 'competitionPct', key: 'cp',
                  render: (v) => <Tag color={v >= 60 ? 'red' : v >= 30 ? 'orange' : 'green'}>{v?.toFixed(1)}%</Tag>,
                },
                {
                  title: 'Fusion', dataIndex: 'fusionScore', key: 'fs',
                  render: (v) => v != null ? (
                    <Tag color={v >= 70 ? 'green' : v >= 40 ? 'orange' : 'red'}>{v}</Tag>
                  ) : '—',
                },
                {
                  title: 'Trends', key: 'gt',
                  render: (_, r) => r.googleTrends?.interest != null ? (
                    <Space size={4}>{trendIcon(r.googleTrends?.trend)} {r.googleTrends.interest}</Space>
                  ) : '—',
                },
              ]}
            />
          </div>
        ) : (
          <Empty description="No trend data available" />
        )}
      </Modal>
    </div>
  );
};

export default KeywordSnapshotsPage;
