const express = require('express');
const router = express.Router();
const aggregationController = require('../controllers/aggregationController');

// Agent productivity report
router.get('/agent/:agentId/productivity', aggregationController.getAgentProductivityReport);

// Checklist progress report  
router.get('/checklist/:checklistId/progress', aggregationController.getChecklistProgressReport);

// Deadline analysis report
router.get('/deadline/analysis', aggregationController.getDeadlineAnalysisReport);

// Space overview report
router.get('/space/overview', aggregationController.getSpaceOverviewReport);

module.exports = router;