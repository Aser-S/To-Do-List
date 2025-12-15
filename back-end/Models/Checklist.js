const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChecklistSchema = new Schema({
    checklist_title: {
        type: String,
        required: [true, 'Checklist title is required'],
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    space_id: {
        type: Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    space_title: {
        type: String,
        required: true
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref: 'Item'
    }]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove checklist items when checklist is deleted - FIXED VERSION
ChecklistSchema.pre('remove', async function(next) {
    try {
        if (this.items && this.items.length > 0) {
            const Item = mongoose.model('Item');
            
            // Delete each item individually to trigger its middleware
            for (const itemId of this.items) {
                await Item.findOneAndDelete({ _id: itemId });
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Add middleware for findOneAndDelete as well - FIXED VERSION
ChecklistSchema.pre('findOneAndDelete', async function(next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc && doc.items && doc.items.length > 0) {
            const Item = mongoose.model('Item');
            
            // Delete each item individually to trigger its middleware
            for (const itemId of doc.items) {
                await Item.findOneAndDelete({ _id: itemId });
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

ChecklistSchema.index({ space_id: 1 }); // For space overview reports
module.exports = mongoose.model('Checklist', ChecklistSchema);