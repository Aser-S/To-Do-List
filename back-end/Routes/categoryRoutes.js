const express = require('express');
const router = express.Router();
const categoryController = require('../Controller/categoryController');

// GET /api/categories - Get all categories (with filters: ?name=xxx)
router.get('/', categoryController.getAllCategories);

// GET /api/categories/name/:name - Get category by name
router.get('/name/:name', categoryController.getCategoryByName);

// POST /api/categories - Create new category
router.post('/', categoryController.createCategory);

// PUT /api/categories/name/:name - Update category by name
router.put('/name/:name', categoryController.updateCategoryByName);

// DELETE /api/categories/name/:name - Delete category by name
router.delete('/name/:name', categoryController.deleteCategoryByName);

module.exports = router;