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

// Remove checklists when space is deleted - UPDATED
SpaceSchema.pre('remove', async function(next) {
    try {
        if (this.checklist && this.checklist.length > 0) {
            // Get the Checklist model
            const Checklist = mongoose.model('Checklist');
            
            // Delete each checklist individually
            for (const checklistId of this.checklist) {
                await Checklist.findOneAndDelete({ _id: checklistId });
            }
        }
        next();
    } catch (error) {
        console.error('Error in Space remove middleware:', error);
        next(error);
    }
});

// Add middleware for findOneAndDelete as well - WITH DEBUG LOGGING
SpaceSchema.pre('findOneAndDelete', async function(next) {
    try {
        console.log('=== SPACE MIDDLEWARE TRIGGERED ===');
        console.log('Getting space document...');
        
        const doc = await this.model.findOne(this.getFilter());
        console.log('Document found:', doc ? `ID: ${doc._id}` : 'Not found');
        
        if (doc && doc.checklist && doc.checklist.length > 0) {
            console.log(`Found ${doc.checklist.length} checklists to delete`);
            
            // Get the Checklist model
            console.log('Loading Checklist model...');
            const Checklist = mongoose.model('Checklist');
            console.log('Checklist model loaded');
            
            // Delete each checklist individually
            for (let i = 0; i < doc.checklist.length; i++) {
                const checklistId = doc.checklist[i];
                console.log(`Deleting checklist ${i+1}/${doc.checklist.length}: ${checklistId}`);
                try {
                    await Checklist.findOneAndDelete({ _id: checklistId });
                    console.log(`Checklist ${checklistId} deleted`);
                } catch (err) {
                    console.error(`Failed to delete checklist ${checklistId}:`, err.message);
                    throw err;
                }
            }
        } else {
            console.log('No checklists to delete or empty checklist array');
        }
        
        console.log('=== SPACE MIDDLEWARE COMPLETED ===');
        next();
    } catch (error) {
        console.error('=== ERROR IN SPACE MIDDLEWARE ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        next(error);
    }
});
SpaceSchema.index({ agent_id: 1 }); // For agent productivity reports

module.exports = mongoose.model('Space', SpaceSchema);