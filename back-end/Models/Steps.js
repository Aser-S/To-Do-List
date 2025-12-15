const mongoose = require('mongoose');
const { Schema } = mongoose;

const StepSchema = new Schema({
    step_name: {
        type: String,
        required: [true, 'Step name is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed','Urgent'],
        default: 'Pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    item_id: {
        type: Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

StepSchema.post('save', async function() {
    try {
        const Item = mongoose.model('Item');
        const item = await Item.findById(this.item_id);
        
        if (item) {
            // Trigger item's save middleware to recalculate progress
            await item.save();
        }
    } catch (error) {
        console.error('Error updating parent item:', error);
    }
});

// Update parent item when step status changes (for save only)
StepSchema.post('save', async function() {
    try {
        const Item = mongoose.model('Item');
        const item = await Item.findById(this.item_id);
        
        if (item) {
            // Make sure this step is in the item's steps array
            if (!item.steps.includes(this._id)) {
                item.steps.push(this._id);
            }
            // Trigger item's save middleware to recalculate progress
            await item.save();
        }
    } catch (error) {
        console.error('Error updating parent item:', error);
    }
});


// Remove step from parent item when step is deleted
StepSchema.pre('remove', async function(next) {
    try {
        const Item = mongoose.model('Item');
        // Remove this step from its parent item's steps array
        await Item.findByIdAndUpdate(
            this.item_id,
            { $pull: { steps: this._id } }
        );
        next();
    } catch (error) {
        next(error);
    }
});

// Add middleware for findOneAndDelete as well
StepSchema.pre('findOneAndDelete', async function(next) {
    try {
        const Item = mongoose.model('Item');
        const doc = await this.model.findOne(this.getFilter());
        if (doc) {
            // Remove this step from its parent item's steps array
            await Item.findByIdAndUpdate(
                doc.item_id,
                { $pull: { steps: doc._id } }
            );
        }
        next();
    } catch (error) {
        next(error);
    }
});
module.exports = mongoose.model('Step', StepSchema);