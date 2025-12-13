const mongoose = require('mongoose');
const { Schema } = mongoose;

const SpaceSchema = new Schema({
    space_title: {
        type: String,
        required: [true, 'Space title is required'],
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    agent_id: {
        type: Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    checklist: [{
        type: Schema.Types.ObjectId,
        ref: 'Checklist'
    }]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove space when agent is deleted
SpaceSchema.pre('remove', async function(next) {
    try {
        await this.model('Checklist').deleteMany({ _id: { $in: this.checklist } });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Space', SpaceSchema);