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

module.exports = mongoose.model('Agent', AgentSchema);