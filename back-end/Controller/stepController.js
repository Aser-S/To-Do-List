const Step = require('../Models/Steps');
const Item = require('../Models/Item');

// Get all steps with filters
exports.getAllSteps = async (req, res) => {
    try {
        const { name, status, item_id } = req.query;
        let filter = {};
        
        if (name) filter.step_name = { $regex: name, $options: 'i' };
        if (status) filter.status = status;
        if (item_id) filter.item_id = item_id;
        
        const steps = await Step.find(filter);
        res.status(200).json({
            success: true,
            count: steps.length,
            data: steps
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching steps',
            error: error.message
        });
    }
};

// Get all steps for an item by item name
exports.getItemSteps = async (req, res) => {
    try {
        const { itemName } = req.params;
        
        // First, find the item by name (case-insensitive)
        const item = await Item.findOne({ 
            name: { $regex: new RegExp(itemName, 'i') } 
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Then get all steps for this item
        const steps = await Step.find({ item_id: item._id })
            .sort({ created_at: 1 }); // Sort by creation date (oldest first)

        // Calculate step statistics
        const totalSteps = steps.length;
        const completedSteps = steps.filter(step => step.status === 'Completed').length;
        const inProgressSteps = steps.filter(step => step.status === 'In Progress').length;
        const pendingSteps = steps.filter(step => step.status === 'Pending').length;

        res.status(200).json({
            success: true,
            count: totalSteps,
            item: {
                id: item._id,
                name: item.name,
                description: item.description,
                priority: item.priority,
                status: item.status,
                progress: item.progress,
                deadline: item.deadline,
                checklist_id: item.checklist_id,
                statistics: {
                    total: totalSteps,
                    completed: completedSteps,
                    in_progress: inProgressSteps,
                    pending: pendingSteps,
                    completion_rate: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
                }
            },
            steps: steps
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching steps',
            error: error.message
        });
    }
};

// Get step by name 
exports.getStepByName = async (req, res) => {
    try {
        const step = await Step.findOne({ 
            step_name: { $regex: new RegExp(req.params.name, 'i') }
        });

        if (!step) {
            return res.status(404).json({
                success: false,
                message: 'Step not found'
            });
        }

        res.status(200).json({
            success: true,
            data: step
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching step',
            error: error.message
        });
    }
};

// Create step
exports.createStep = async (req, res) => {
    try {
        const { step_name, item_id } = req.body;

        // Check if item exists
        const item = await Item.findById(item_id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const step = await Step.create({
            step_name,
            item_id,
            status: 'Pending'
        });

        // Add step to item's steps array
        item.steps.push(step._id);
        await item.save();

        res.status(201).json({
            success: true,
            message: 'Step created successfully',
            data: step
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating step',
            error: error.message
        });
    }
};

// Update step by name (new)
exports.updateStepByName = async (req, res) => {
    try {
        const { name } = req.params;
        const updateData = req.body;

        const step = await Step.findOneAndUpdate(
            { step_name: { $regex: new RegExp(name, 'i') } },
            updateData,
            { new: true, runValidators: true }
        );

        if (!step) {
            return res.status(404).json({
                success: false,
                message: 'Step not found'
            });
        }

        // The Step model's post-save hook will update the parent item

        res.status(200).json({
            success: true,
            message: 'Step updated successfully',
            data: step
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating step',
            error: error.message
        });
    }
};

// Update step status
exports.updateStepStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const step = await Step.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!step) {
            return res.status(404).json({
                success: false,
                message: 'Step not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Step status updated successfully',
            data: step
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating step',
            error: error.message
        });
    }
};

// Delete step by name 
exports.deleteStepByName = async (req, res) => {
    try {
        const { name } = req.params;
        
        const step = await Step.findOne({ 
            step_name: { $regex: new RegExp(name, 'i') } 
        });

        if (!step) {
            return res.status(404).json({
                success: false,
                message: 'Step not found'
            });
        }

        // Remove step from item's steps array
        await Item.findByIdAndUpdate(
            step.item_id,
            { $pull: { steps: step._id } }
        );

        // Delete the step
        await step.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Step deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting step',
            error: error.message
        });
    }
};