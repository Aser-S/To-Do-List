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
// Delete agent by name - MANUAL CASCADE DELETE
exports.deleteAgentByName = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { name } = req.params;
        
        console.log(`=== MANUAL AGENT DELETE FOR: ${name} ===`);
        
        // Find agent with all related data
        const agent = await Agent.findOne({ 
            name: { $regex: new RegExp(name, 'i') } 
        }).session(session);

        if (!agent) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        console.log(`Found agent: ${agent._id} (${agent.name})`);
        
        // Step 1: Find all spaces for this agent
        const spaces = await Space.find({ agent_id: agent._id }).session(session);
        console.log(`Found ${spaces.length} spaces for this agent`);
        
        // Step 2: For each space, find and delete checklists
        for (const space of spaces) {
            console.log(`Processing space: ${space._id} (${space.space_title})`);
            
            // Find checklists for this space
            const checklists = await Checklist.find({ space_id: space._id }).session(session);
            console.log(`  Found ${checklists.length} checklists in this space`);
            
            // Step 3: For each checklist, find and delete items
            for (const checklist of checklists) {
                console.log(`  Processing checklist: ${checklist._id} (${checklist.checklist_title})`);
                
                // Find items for this checklist
                const items = await Item.find({ checklist_id: checklist._id }).session(session);
                console.log(`    Found ${items.length} items in this checklist`);
                
                // Step 4: For each item, delete steps
                for (const item of items) {
                    console.log(`    Processing item: ${item._id} (${item.name})`);
                    
                    // Delete all steps for this item
                    await Step.deleteMany({ item_id: item._id }).session(session);
                    console.log(`      Deleted steps for item ${item._id}`);
                    
                    // Remove item from category if exists
                    if (item.category_id) {
                        await Category.findByIdAndUpdate(
                            item.category_id,
                            { $pull: { items: item._id } },
                            { session }
                        );
                    }
                    
                    // Delete the item
                    await Item.findByIdAndDelete(item._id).session(session);
                    console.log(`      Deleted item ${item._id}`);
                }
                
                // Delete the checklist
                await Checklist.findByIdAndDelete(checklist._id).session(session);
                console.log(`  Deleted checklist ${checklist._id}`);
            }
            
            // Delete the space
            await Space.findByIdAndDelete(space._id).session(session);
            console.log(`Deleted space ${space._id}`);
        }
        
        // Step 5: Finally, delete the agent
        await Agent.findByIdAndDelete(agent._id).session(session);
        console.log(`Deleted agent ${agent._id}`);
        
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
        
        console.log('=== AGENT DELETE COMPLETED SUCCESSFULLY ===');
        
        res.status(200).json({
            success: true,
            message: 'Agent and all associated data (spaces, checklists, items, steps) deleted successfully'
        });
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();
        session.endSession();
        
        console.error('=== ERROR IN MANUAL AGENT DELETE ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error deleting agent',
            error: error.message
        });
    }
};
// Delete agent by name - MANUAL CASCADE DELETE
exports.deleteAgentByName = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { name } = req.params;
        
        console.log(`=== MANUAL AGENT DELETE FOR: ${name} ===`);
        
        // Find agent with all related data
        const agent = await Agent.findOne({ 
            name: { $regex: new RegExp(name, 'i') } 
        }).session(session);

        if (!agent) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        console.log(`Found agent: ${agent._id} (${agent.name})`);
        
        // Step 1: Find all spaces for this agent
        const spaces = await Space.find({ agent_id: agent._id }).session(session);
        console.log(`Found ${spaces.length} spaces for this agent`);
        
        // Step 2: For each space, find and delete checklists
        for (const space of spaces) {
            console.log(`Processing space: ${space._id} (${space.space_title})`);
            
            // Find checklists for this space
            const checklists = await Checklist.find({ space_id: space._id }).session(session);
            console.log(`  Found ${checklists.length} checklists in this space`);
            
            // Step 3: For each checklist, find and delete items
            for (const checklist of checklists) {
                console.log(`  Processing checklist: ${checklist._id} (${checklist.checklist_title})`);
                
                // Find items for this checklist
                const items = await Item.find({ checklist_id: checklist._id }).session(session);
                console.log(`    Found ${items.length} items in this checklist`);
                
                // Step 4: For each item, delete steps
                for (const item of items) {
                    console.log(`    Processing item: ${item._id} (${item.name})`);
                    
                    // Delete all steps for this item
                    await Step.deleteMany({ item_id: item._id }).session(session);
                    console.log(`      Deleted steps for item ${item._id}`);
                    
                    // Remove item from category if exists
                    if (item.category_id) {
                        await Category.findByIdAndUpdate(
                            item.category_id,
                            { $pull: { items: item._id } },
                            { session }
                        );
                    }
                    
                    // Delete the item
                    await Item.findByIdAndDelete(item._id).session(session);
                    console.log(`      Deleted item ${item._id}`);
                }
                
                // Delete the checklist
                await Checklist.findByIdAndDelete(checklist._id).session(session);
                console.log(`  Deleted checklist ${checklist._id}`);
            }
            
            // Delete the space
            await Space.findByIdAndDelete(space._id).session(session);
            console.log(`Deleted space ${space._id}`);
        }
        
        // Step 5: Finally, delete the agent
        await Agent.findByIdAndDelete(agent._id).session(session);
        console.log(`Deleted agent ${agent._id}`);
        
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
        
        console.log('=== AGENT DELETE COMPLETED SUCCESSFULLY ===');
        
        res.status(200).json({
            success: true,
            message: 'Agent and all associated data (spaces, checklists, items, steps) deleted successfully'
        });
    } catch (error) {
        // Rollback on error
        await session.abortTransaction();
        session.endSession();
        
        console.error('=== ERROR IN MANUAL AGENT DELETE ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
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