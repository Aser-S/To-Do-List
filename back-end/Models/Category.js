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
// Cascade delete: When category is deleted, remove category reference from all items
CategorySchema.pre('remove', async function(next) {
    try {
        await mongoose.model('Item').updateMany(
            { category_id: this._id },
            { $set: { category_id: null } }
        );
        next();
    } catch (error) {
        next(error);
    }
});
// Add middleware for findOneAndDelete as well
CategorySchema.pre('findOneAndDelete', async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            // Remove category reference from all items
            await mongoose.model('Item').updateMany(
                { category_id: doc._id },
                { $set: { category_id: null } }
            );
        }
        next();
    } catch (error) {
        next(error);
    }
});
module.exports = mongoose.model('Category', CategorySchema);