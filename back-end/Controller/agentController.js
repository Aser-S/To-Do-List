const Agent = require('../Models/Agents');
const Space = require('../Models/Space');

// Get all agents
exports.getAllAgents = async (req, res) => {
    try {
        const { name, email } = req.query;
        let filter = {};
        
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        const agents = await Agent.find(filter).select('-password');
        res.status(200).json({
            success: true,
            count: agents.length,
            data: agents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching agents',
            error: error.message
        });
    }
};

// Get agent by name (new)
exports.getAgentByName = async (req, res) => {
    try {
        const agent = await Agent.findOne({ 
            name: { $regex: new RegExp(req.params.name, 'i') }
        }).select('-password');

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        res.status(200).json({
            success: true,
            data: agent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching agent',
            error: error.message
        });
    }
};

// Create agent
exports.createAgent = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if agent already exists
        const existingAgent = await Agent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({
                success: false,
                message: 'Agent with this email already exists'
            });
        }

        const agent = await Agent.create({ name, email, password });

        res.status(201).json({
            success: true,
            message: 'Agent created successfully',
            data: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                spaces: agent.spaces
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating agent',
            error: error.message
        });
    }
};

// Update agent by name (new)
exports.updateAgentByName = async (req, res) => {
    try {
        const { name } = req.params;
        const updateData = req.body;

        // Check if email update conflicts
        if (updateData.email) {
            const existingAgent = await Agent.findOne({ 
                email: updateData.email,
                name: { $ne: name }
            });
            if (existingAgent) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another agent'
                });
            }
        }

        const agent = await Agent.findOneAndUpdate(
            { name: { $regex: new RegExp(name, 'i') } },
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Agent updated successfully',
            data: agent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating agent',
            error: error.message
        });
    }
};
// Delete agent by name 
exports.deleteAgentByName = async (req, res) => {
    try {
        const { name } = req.params;
        
        const agent = await Agent.findOne({ 
            name: { $regex: new RegExp(name, 'i') } 
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        // Delete all spaces and their associated data
        await Space.deleteMany({ agent_id: agent._id });

        // Delete the agent
        await agent.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Agent and all associated data deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting agent',
            error: error.message
        });
    }
};

// Agent login
exports.loginAgent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find agent by email
        const agent = await Agent.findOne({ email });

        if (!agent) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        if (agent.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Populate spaces
        await agent.populate({
            path: 'spaces',
            populate: {
                path: 'checklist',
                select: 'checklist_title'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                spaces: agent.spaces
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};