const express = require('express');
const router = express.Router();
const checklistController = require('../Controller/checklistController');

// GET /api/checklists - Get all checklists (with filters: ?title=xxx&space_id=xxx)
router.get('/', checklistController.getAllChecklists);

// GET /api/checklists/space/:spaceName - Get all checklists for a space by space name
router.get('/space/:spaceName', checklistController.getSpaceChecklists);

// GET /api/checklists/title/:title - Get checklist by title
router.get('/title/:title', checklistController.getChecklistByTitle);

// POST /api/checklists - Create new checklist
router.post('/', checklistController.createChecklist);


// PUT /api/checklists/title/:title - Update checklist by title
router.put('/title/:title', checklistController.updateChecklistByTitle);

// DELETE /api/checklists/title/:title - Delete checklist by title
router.delete('/title/:title', checklistController.deleteChecklistByTitle);

module.exports = router;