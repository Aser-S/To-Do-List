const Category = require('../Models/Category');
const Item = require('../Models/Item');

// Get all categories with filters
exports.getAllCategories = async (req, res) => {
    try {
        const { name } = req.query;
        let filter = {};
        
        if (name) filter.category_name = { $regex: name, $options: 'i' };
        
        const categories = await Category.find(filter).populate('items');
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get category by name 
exports.getCategoryByName = async (req, res) => {
    try {
        const category = await Category.findOne({ 
            category_name: { $regex: new RegExp(req.params.name, 'i') }
        }).populate('items');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            category_name: { $regex: new RegExp(`^${category_name}$`, 'i') }
        });
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.create({
            category_name,
            items: []
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Update category by name 
exports.updateCategoryByName = async (req, res) => {
    try {
        const { name } = req.params;
        const { category_name: newName } = req.body;

        // Find current category
        const currentCategory = await Category.findOne({ 
            category_name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (!currentCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if new name already exists (excluding current category)
        if (newName) {
            const existingCategory = await Category.findOne({ 
                category_name: { $regex: new RegExp(`^${newName}$`, 'i') },
                _id: { $ne: currentCategory._id }
            });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name already in use'
                });
            }
        }

        const category = await Category.findOneAndUpdate(
            { category_name: { $regex: new RegExp(`^${name}$`, 'i') } },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category by name (new)
exports.deleteCategoryByName = async (req, res) => {
    try {
        const { name } = req.params;
        
        const category = await Category.findOne({ 
            category_name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Remove category reference from all items
        await Item.updateMany(
            { category_id: category._id },
            { $set: { category_id: null } }
        );

        // Delete the category
        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};