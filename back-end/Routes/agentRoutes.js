const express = require('express');
const router = express.Router();
const agentController = require('../Controller/agentController');

// GET /api/agents - Get all agents (with filters: ?name=xxx&email=xxx)
router.get('/', agentController.getAllAgents);

// GET /api/agents/name/:name - Get agent by name
router.get('/name/:name', agentController.getAgentByName);

// POST /api/agents - Create new agent
router.post('/', agentController.createAgent);

// PUT /api/agents/name/:name - Update agent by name
router.put('/name/:name', agentController.updateAgentByName);

// DELETE /api/agents/name/:name - Delete agent by name
router.delete('/name/:name', agentController.deleteAgentByName);

// POST /api/agents/login - Agent login
router.post('/login', agentController.loginAgent);

module.exports = router;