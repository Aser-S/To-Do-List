const mongoose = require('mongoose');
const { Schema } = mongoose;

const AgentSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Agent name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    spaces: [{
        type: Schema.Types.ObjectId,
        ref: 'Space'
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove password when converting to JSON
AgentSchema.methods.toJSON = function() {
    const agent = this.toObject();
    delete agent.password;
    return agent;
};
// Agent.js - FIXED VERSION
AgentSchema.pre('remove', async function(next) {
    try {
        const Space = mongoose.model('Space');
        
        // Find all spaces for this agent
        const spaces = await Space.find({ agent_id: this._id });
        
        // Delete each space individually to trigger its middleware
        for (const space of spaces) {
            await Space.findOneAndDelete({ _id: space._id }); // ✅
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Agent.js - Add logging to see what's happening
AgentSchema.pre('findOneAndDelete', async function(next) {
    try {
        console.log('=== AGENT DELETE MIDDLEWARE TRIGGERED ===');
        
        const doc = await this.model.findOne(this.getFilter());
        if (!doc) {
            console.log('No agent document found');
            return next();
        }
        
        console.log(`Found agent: ${doc.name} (${doc._id})`);
        console.log(`Agent has ${doc.spaces?.length || 0} spaces`);
        
        if (doc.spaces && doc.spaces.length > 0) {
            const Space = mongoose.model('Space');
            
            // Get all spaces to delete
            const spaces = await Space.find({ agent_id: doc._id });
            console.log(`Found ${spaces.length} spaces to delete`);
            
            // Delete each space individually to trigger its middleware
            for (const space of spaces) {
                console.log(`Deleting space: ${space._id} (${space.space_title})`);
                await Space.findOneAndDelete({ _id: space._id });
            }
        } else {
            console.log('No spaces found for this agent');
        }
        
        console.log('=== AGENT DELETE MIDDLEWARE COMPLETED ===');
        next();
    } catch (error) {
        console.error('=== ERROR IN AGENT DELETE MIDDLEWARE ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        next(error);
    }
});
module.exports = mongoose.model('Agent', AgentSchema);