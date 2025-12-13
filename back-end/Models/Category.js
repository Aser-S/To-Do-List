const mongoose = require('mongoose');
const { Schema } = mongoose;

const CategorySchema = new Schema({
    category_name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref: 'Item'
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Category', CategorySchema);