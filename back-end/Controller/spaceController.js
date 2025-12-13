const Space = require('../Models/Space');
const Agent = require('../Models/Agents');
const Checklist = require('../Models/Checklist');

// Get all spaces with filters
exports.getAllSpaces = async (req, res) => {
    try {
        const { title, agent_id } = req.query;
        let filter = {};
        
        if (title) filter.space_title = { $regex: title, $options: 'i' };
        if (agent_id) filter.agent_id = agent_id;
        
        const spaces = await Space.find(filter).populate('checklist');
        res.status(200).json({
            success: true,
            count: spaces.length,
            data: spaces
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching spaces',
            error: error.message
        });
    }
};

// Get all spaces for an agent by agent name
exports.getAgentSpacesByName = async (req, res) => {
    try {
        const { agentName } = req.params;
        
        // First, find the agent by name (case-insensitive)
        const agent = await Agent.findOne({ 
            name: { $regex: new RegExp(agentName, 'i') } 
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        // Then get all spaces for this agent
        const spaces = await Space.find({ agent_id: agent._id })
            .populate({
                path: 'checklist',
                populate: {
                    path: 'items',
                    select: 'name status priority deadline'
                }
            });

        res.status(200).json({
            success: true,
            count: spaces.length,
            agent: {
                id: agent._id,
                name: agent.name,
                email: agent.email
            },
            data: spaces
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching spaces',
            error: error.message
        });
    }
};

// Get space by title 
exports.getSpaceByTitle = async (req, res) => {
    try {
        const space = await Space.findOne({ 
            space_title: { $regex: new RegExp(req.params.title, 'i') }
        }).populate('checklist');

        if (!space) {
            return res.status(404).json({
                success: false,
                message: 'Space not found'
            });
        }

        res.status(200).json({
            success: true,
            data: space
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching space',
            error: error.message
        });
    }
};

// Create space
exports.createSpace = async (req, res) => {
    try {
        const { space_title, agent_id } = req.body;

        // Check if agent exists
        const agent = await Agent.findById(agent_id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        const space = await Space.create({
            space_title,
            agent_id,
            checklist: []
        });

        // Add space to agent's spaces array
        agent.spaces.push(space._id);
        await agent.save();

        res.status(201).json({
            success: true,
            message: 'Space created successfully',
            data: space
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating space',
            error: error.message
        });
    }
};
// Update space by title 
exports.updateSpaceByTitle = async (req, res) => {
    try {
        const { title } = req.params;
        const updateData = req.body;

        const space = await Space.findOneAndUpdate(
            { space_title: { $regex: new RegExp(title, 'i') } },
            updateData,
            { new: true, runValidators: true }
        );

        if (!space) {
            return res.status(404).json({
                success: false,
                message: 'Space not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Space updated successfully',
            data: space
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating space',
            error: error.message
        });
    }
};
// Delete space by title 
exports.deleteSpaceByTitle = async (req, res) => {
    try {
        const { title } = req.params;
        
        const space = await Space.findOne({ 
            space_title: { $regex: new RegExp(title, 'i') } 
        });

        if (!space) {
            return res.status(404).json({
                success: false,
                message: 'Space not found'
            });
        }

        // Remove space from agent's spaces array
        await Agent.findByIdAndUpdate(
            space.agent_id,
            { $pull: { spaces: space._id } }
        );

        // Delete the space (this will trigger cascade delete)
        await space.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Space and all associated checklists deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting space',
            error: error.message
        });
    }
};