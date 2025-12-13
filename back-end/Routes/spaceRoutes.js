const express = require('express');
const router = express.Router();
const spaceController = require('../Controller/spaceController');

// GET /api/spaces - Get all spaces (with filters: ?title=xxx&agent_id=xxx)
router.get('/', spaceController.getAllSpaces);

// GET /api/spaces/agent/name/:agentName - Get all spaces for an agent by name
router.get('/agent/name/:agentName', spaceController.getAgentSpacesByName);

// GET /api/spaces/title/:title - Get space by title
router.get('/title/:title', spaceController.getSpaceByTitle);

// POST /api/spaces - Create new space
router.post('/', spaceController.createSpace);

// PUT /api/spaces/title/:title - Update space by title
router.put('/title/:title', spaceController.updateSpaceByTitle);


// DELETE /api/spaces/title/:title - Delete space by title
router.delete('/title/:title', spaceController.deleteSpaceByTitle);

module.exports = router;