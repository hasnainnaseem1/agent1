import axiosInstance from './axiosInstance';

const keywordSnapshotApi = {
  /**
   * GET /api/v1/admin/keyword-snapshots/summary
   */
  getSummary: () =>
    axiosInstance.get('/api/v1/admin/keyword-snapshots/summary').then((r) => r.data),

  /**
   * GET /api/v1/admin/keyword-snapshots
   */
  listSnapshots: (params = {}) =>
    axiosInstance.get('/api/v1/admin/keyword-snapshots', { params }).then((r) => r.data),

  /**
   * GET /api/v1/admin/keyword-snapshots/trend/:keyword
   */
  getKeywordTrend: (keyword, days = 30) =>
    axiosInstance.get(`/api/v1/admin/keyword-snapshots/trend/${encodeURIComponent(keyword)}`, { params: { days } }).then((r) => r.data),
};

export default keywordSnapshotApi;
