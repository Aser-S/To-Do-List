const mongoose = require('mongoose');
const { Schema } = mongoose;

const ItemSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        validate: {
            validator: Number.isInteger,
            message: 'Progress must be an integer'
        }
    },
    deadline: {
        type: Date,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    checklist_id: {
        type: Schema.Types.ObjectId,
        ref: 'Checklist',
        required: true
    },
    category_id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    steps: [{
        type: Schema.Types.ObjectId,
        ref: 'Step'
    }]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-update progress and status based on steps
ItemSchema.pre('save', async function(next) {
    if (this.steps && this.steps.length > 0) {
        const Step = mongoose.model('Step');
        const steps = await Step.find({ _id: { $in: this.steps } });
        
        const completedSteps = steps.filter(step => step.status === 'Completed').length;
        const totalSteps = steps.length;
        
        if (totalSteps > 0) {
            this.progress = Math.round((completedSteps / totalSteps) * 100);
            
            if (this.progress === 100) {
                this.status = 'Completed';
            } else if (this.progress > 0) {
                this.status = 'In Progress';
            }
        }
    }
    next();
});

// Remove steps when item is deleted
ItemSchema.pre('remove', async function(next) {
    try {
        await this.model('Step').deleteMany({ _id: { $in: this.steps } });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Item', ItemSchema);