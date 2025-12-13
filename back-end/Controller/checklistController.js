const Checklist = require('../Models/Checklist');
const Space = require('../Models/Space');
const Item = require('../Models/Item');

// Get all checklists with filters
exports.getAllChecklists = async (req, res) => {
    try {
        const { title, space_id } = req.query;
        let filter = {};
        
        if (title) filter.checklist_title = { $regex: title, $options: 'i' };
        if (space_id) filter.space_id = space_id;
        
        const checklists = await Checklist.find(filter).populate('items');
        res.status(200).json({
            success: true,
            count: checklists.length,
            data: checklists
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching checklists',
            error: error.message
        });
    }
};

// Get all checklists for a space by space title/name
exports.getSpaceChecklists = async (req, res) => {
    try {
        const { spaceName } = req.params;
        
        // First, find the space by name (case-insensitive)
        const space = await Space.findOne({ 
            space_title: { $regex: new RegExp(spaceName, 'i') } 
        });

        if (!space) {
            return res.status(404).json({
                success: false,
                message: 'Space not found'
            });
        }

        // Then get all checklists for this space
        const checklists = await Checklist.find({ space_id: space._id })
            .populate({
                path: 'items',
                populate: [
                    { path: 'steps', select: 'step_name status' },
                    { path: 'category_id', select: 'category_name' }
                ]
            });

        res.status(200).json({
            success: true,
            count: checklists.length,
            space: {
                id: space._id,
                title: space.space_title,
                created_at: space.created_at,
                agent_id: space.agent_id
            },
            data: checklists
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching checklists',
            error: error.message
        });
    }
};

// Get checklist by title 
exports.getChecklistByTitle = async (req, res) => {
    try {
        const checklist = await Checklist.findOne({ 
            checklist_title: { $regex: new RegExp(req.params.title, 'i') }
        }).populate('items');

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        res.status(200).json({
            success: true,
            data: checklist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching checklist',
            error: error.message
        });
    }
};

// Create checklist with space name (not ID)
exports.createChecklist = async (req, res) => {
    try {
        const { checklist_title, space_title } = req.body; // Change space_id to space_title

        // Check if space exists by title (not ID)
        const space = await Space.findOne({ space_title: space_title });
        if (!space) {
            return res.status(404).json({
                success: false,
                message: 'Space not found with that title'
            });
        }

        const checklist = await Checklist.create({
            checklist_title,
            space_id: space._id, // Save the actual ObjectId
            space_title: space_title, // Save readable title too
            items: []
        });

        // Add checklist to space's checklist array
        space.checklist.push(checklist._id);
        await space.save();

        res.status(201).json({
            success: true,
            message: 'Checklist created successfully',
            data: {
                _id: checklist._id,
                checklist_title: checklist.checklist_title,
                space_title: space_title, // Return readable name
                created_at: checklist.created_at
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating checklist',
            error: error.message
        });
    }
};
// Update checklist by title 
exports.updateChecklistByTitle = async (req, res) => {
    try {
        const { title } = req.params;
        const updateData = req.body;

        const checklist = await Checklist.findOneAndUpdate(
            { checklist_title: { $regex: new RegExp(title, 'i') } },
            updateData,
            { new: true, runValidators: true }
        );

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Checklist updated successfully',
            data: checklist
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating checklist',
            error: error.message
        });
    }
};

// Delete checklist by title 
exports.deleteChecklistByTitle = async (req, res) => {
    try {
        const { title } = req.params;
        
        const checklist = await Checklist.findOne({ 
            checklist_title: { $regex: new RegExp(title, 'i') } 
        });

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        // Remove checklist from space's checklist array
        await Space.findByIdAndUpdate(
            checklist.space_id,
            { $pull: { checklist: checklist._id } }
        );

        // Delete the checklist (this will trigger cascade delete)
        await checklist.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Checklist and all items deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting checklist',
            error: error.message
        });
    }
};