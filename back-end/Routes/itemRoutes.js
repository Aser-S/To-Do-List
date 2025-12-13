const express = require('express');
const router = express.Router();
const itemController = require('../Controller/itemController');

// GET /api/items - Get all items (with filters: ?name=xxx&status=xxx&priority=xxx&checklist_id=xxx)
router.get('/', itemController.getAllItems);

// GET /api/items/checklist/:checklistName - Get all items for a checklist by checklist name
router.get('/checklist/:checklistName', itemController.getChecklistItems);

// GET /api/items/name/:name - Get item by name
router.get('/name/:name', itemController.getItemByName);

// POST /api/items - Create new item
router.post('/', itemController.createItem);

// PUT /api/items/name/:name - Update item by name
router.put('/name/:name', itemController.updateItemByName);

// PUT /api/items/:id/progress - Update item progress
router.put('/:id/progress', itemController.updateItemProgress);

// DELETE /api/items/name/:name - Delete item by name
router.delete('/name/:name', itemController.deleteItemByName);

module.exports = router;