const Item = require('../Models/Item');
const Checklist = require('../Models/Checklist');
const Category = require('../Models/Category');
const Step = require('../Models/Steps');

// Get all items with filters
exports.getAllItems = async (req, res) => {
    try {
        const { name, status, priority, checklist_id } = req.query;
        let filter = {};
        
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (checklist_id) filter.checklist_id = checklist_id;
        
        const items = await Item.find(filter)
            .populate('steps')
            .populate('category_id');

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching items',
            error: error.message
        });
    }
};

// Get all items for a checklist by checklist name
exports.getChecklistItems = async (req, res) => {
    try {
        const { checklistName } = req.params;
        
        // First, find the checklist by name (case-insensitive)
        const checklist = await Checklist.findOne({ 
            checklist_title: { $regex: new RegExp(checklistName, 'i') } 
        });

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        // Then get all items for this checklist
        const items = await Item.find({ checklist_id: checklist._id })
            .populate({
                path: 'steps',
                select: 'step_name status created_at completed_at'
            })
            .populate({
                path: 'category_id',
                select: 'category_name'
            })
            .sort({ priority: -1, deadline: 1 }); // Sort by priority (High first) then deadline

        // Calculate checklist statistics
        const totalItems = items.length;
        const completedItems = items.filter(item => item.status === 'Completed').length;
        const inProgressItems = items.filter(item => item.status === 'In Progress').length;
        const pendingItems = items.filter(item => item.status === 'Pending').length;
        const highPriorityItems = items.filter(item => item.priority === 'High').length;
        const overdueItems = items.filter(item => 
            item.deadline && 
            item.deadline < new Date() && 
            item.status !== 'Completed'
        ).length;

        res.status(200).json({
            success: true,
            count: totalItems,
            checklist: {
                id: checklist._id,
                title: checklist.checklist_title,
                created_at: checklist.created_at,
                space_id: checklist.space_id,
                statistics: {
                    total: totalItems,
                    completed: completedItems,
                    in_progress: inProgressItems,
                    pending: pendingItems,
                    high_priority: highPriorityItems,
                    overdue: overdueItems,
                    completion_rate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                }
            },
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching items',
            error: error.message
        });
    }
};

// Get item by name
exports.getItemByName = async (req, res) => {
    try {
        const item = await Item.findOne({ 
            name: { $regex: new RegExp(req.params.name, 'i') }
        })
        .populate('steps')
        .populate('category_id');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching item',
            error: error.message
        });
    }
};

// Create item
exports.createItem = async (req, res) => {
    try {
        const { name, checklist_id, category_id, ...itemData } = req.body;

        // Check if checklist exists
        const checklist = await Checklist.findById(checklist_id);
        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Checklist not found'
            });
        }

        // Check if category exists (if provided)
        if (category_id) {
            const category = await Category.findById(category_id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
        }

        const item = await Item.create({
            name,
            checklist_id,
            category_id: category_id || null,
            ...itemData
        });

        // Add item to checklist's items array
        checklist.items.push(item._id);
        await checklist.save();

        // Add item to category's items array (if category provided)
        if (category_id) {
            await Category.findByIdAndUpdate(
                category_id,
                { $push: { items: item._id } }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Item created successfully',
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating item',
            error: error.message
        });
    }
};

// Update item by name 
exports.updateItemByName = async (req, res) => {
    try {
        const { name } = req.params;
        const updateData = req.body;

        // Find item first to handle category changes
        const currentItem = await Item.findOne({ 
            name: { $regex: new RegExp(name, 'i') } 
        });

        if (!currentItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Handle category change
        if (updateData.category_id && updateData.category_id !== currentItem.category_id.toString()) {
            const newCategory = await Category.findById(updateData.category_id);

            if (!newCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Remove from old category if exists
            if (currentItem.category_id) {
                await Category.findByIdAndUpdate(
                    currentItem.category_id,
                    { $pull: { items: currentItem._id } }
                );
            }

            // Add to new category
            await Category.findByIdAndUpdate(
                updateData.category_id,
                { $push: { items: currentItem._id } }
            );
        }

        const item = await Item.findOneAndUpdate(
            { name: { $regex: new RegExp(name, 'i') } },
            updateData,
            { new: true, runValidators: true }
        ).populate('steps');

        res.status(200).json({
            success: true,
            message: 'Item updated successfully',
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating item',
            error: error.message
        });
    }
};

// Delete item by name 
exports.deleteItemByName = async (req, res) => {
    try {
        const { name } = req.params;
        
        const item = await Item.findOne({ 
            name: { $regex: new RegExp(name, 'i') } 
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Remove item from checklist's items array
        await Checklist.findByIdAndUpdate(
            item.checklist_id,
            { $pull: { items: item._id } }
        );

        // Remove item from category's items array (if exists)
        if (item.category_id) {
            await Category.findByIdAndUpdate(
                item.category_id,
                { $pull: { items: item._id } }
            );
        }

        // Delete the item (this will trigger cascade delete of steps)
        await item.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Item and all steps deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting item',
            error: error.message
        });
    }
};

// Update item progress
exports.updateItemProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        
        if (progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be between 0 and 100'
            });
        }

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { 
                progress,
                status: progress === 100 ? 'Completed' : 
                       progress > 0 ? 'In Progress' : 'Pending'
            },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item progress updated successfully',
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating item progress',
            error: error.message
        });
    }
};