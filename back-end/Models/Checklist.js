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
    space_title: { // ADD THIS: Store readable space name
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
// Remove checklist items when checklist is deleted
ChecklistSchema.pre('remove', async function(next) {
    try {
        await this.model('Item').deleteMany({ _id: { $in: this.items } });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Checklist', ChecklistSchema);