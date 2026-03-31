const express = require('express');
const router = express.Router();
const snapshotCtrl = require('../../../controllers/admin/keywordSnapshotController');
const { checkPermission } = require('../../../middleware/security');

// All routes require settings.view permission
router.get('/summary', checkPermission('settings.view'), snapshotCtrl.getSummary);
router.get('/', checkPermission('settings.view'), snapshotCtrl.listSnapshots);
router.get('/trend/:keyword', checkPermission('settings.view'), snapshotCtrl.getKeywordTrend);

module.exports = router;
