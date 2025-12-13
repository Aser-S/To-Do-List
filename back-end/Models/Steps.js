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

// Update parent item when step status changes
StepSchema.post('save', async function() {
    try {
        const Item = mongoose.model('Item');
        await Item.findById(this.item_id);
    } catch (error) {
        console.error('Error updating parent item:', error);
    }
});

module.exports = mongoose.model('Step', StepSchema);