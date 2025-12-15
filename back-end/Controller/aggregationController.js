// aggregationController.js - CORRECTED VERSION
const mongoose = require('mongoose');
const Step = require('../Models/Steps');
const Item = require('../Models/Item');
const Checklist = require('../Models/Checklist');
const Space = require('../Models/Space');
const Agent = require('../Models/Agents');
const Category = require('../Models/Category');

// 1. Agent Productivity Report
exports.getAgentProductivityReport = async (req, res) => {
    try {
        const { agentId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid agent ID'
            });
        }

        const report = await Agent.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(agentId) } },
            {
                $lookup: {
                    from: 'spaces',
                    localField: '_id',
                    foreignField: 'agent_id',
                    as: 'spaces'
                }
            },
            { $unwind: { path: '$spaces', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'checklists',
                    localField: 'spaces._id',
                    foreignField: 'space_id',
                    as: 'spaces.checklists'
                }
            },
            { $unwind: { path: '$spaces.checklists', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'items',
                    localField: 'spaces.checklists._id',
                    foreignField: 'checklist_id',
                    as: 'spaces.checklists.items'
                }
            },
            { $unwind: { path: '$spaces.checklists.items', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'steps',
                    localField: 'spaces.checklists.items._id',
                    foreignField: 'item_id',
                    as: 'spaces.checklists.items.steps'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    agentName: { $first: '$name' },
                    agentEmail: { $first: '$email' },
                    totalSpaces: { $addToSet: '$spaces._id' },
                    totalChecklists: { $addToSet: '$spaces.checklists._id' },
                    totalItems: { $addToSet: '$spaces.checklists.items._id' },
                    completedItems: {
                        $sum: {
                            $cond: [
                                { $eq: ['$spaces.checklists.items.status', 'Completed'] },
                                1,
                                0
                            ]
                        }
                    },
                    inProgressItems: {
                        $sum: {
                            $cond: [
                                { $eq: ['$spaces.checklists.items.status', 'In Progress'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    agentName: 1,
                    agentEmail: 1,
                    statistics: {
                        spaces: { $size: '$totalSpaces' },
                        checklists: { $size: '$totalChecklists' },
                        items: { $size: '$totalItems' },
                        completedItems: 1,
                        inProgressItems: 1,
                        completionRate: {
                            $cond: {
                                if: { $eq: [{ $size: '$totalItems' }, 0] },
                                then: 0,
                                else: {
                                    $round: [{
                                        $multiply: [{
                                            $divide: ['$completedItems', { $size: '$totalItems' }]
                                        }, 100]
                                    }, 2]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: report[0] || {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating agent productivity report',
            error: error.message
        });
    }
};

// 2. Checklist Progress Report
exports.getChecklistProgressReport = async (req, res) => {
    try {
        const { checklistId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(checklistId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid checklist ID'
            });
        }

        const report = await Checklist.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(checklistId) } },
            {
                $lookup: {
                    from: 'items',
                    localField: '_id',
                    foreignField: 'checklist_id',
                    as: 'items'
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'steps',
                    localField: 'items._id',
                    foreignField: 'item_id',
                    as: 'items.steps'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    checklistTitle: { $first: '$checklist_title' },
                    spaceTitle: { $first: '$space_title' },
                    items: {
                        $push: {
                            itemName: '$items.name',
                            status: '$items.status',
                            priority: '$items.priority',
                            progress: '$items.progress',
                            totalSteps: { $size: '$items.steps' },
                            completedSteps: {
                                $size: {
                                    $filter: {
                                        input: '$items.steps',
                                        as: 'step',
                                        cond: { $eq: ['$$step.status', 'Completed'] }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalItems: { $size: '$items' },
                    completedItems: {
                        $size: {
                            $filter: {
                                input: '$items',
                                as: 'item',
                                cond: { $eq: ['$$item.status', 'Completed'] }
                            }
                        }
                    },
                    overallProgress: {
                        $avg: '$items.progress'
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    checklistTitle: 1,
                    spaceTitle: 1,
                    statistics: {
                        totalItems: 1,
                        completedItems: 1,
                        completionRate: {
                            $cond: {
                                if: { $eq: ['$totalItems', 0] },
                                then: 0,
                                else: {
                                    $round: [{
                                        $multiply: [{
                                            $divide: ['$completedItems', '$totalItems']
                                        }, 100]
                                    }, 2]
                                }
                            }
                        },
                        overallProgress: { $round: ['$overallProgress', 2] }
                    },
                    items: {
                        $map: {
                            input: '$items',
                            as: 'item',
                            in: {
                                itemName: '$$item.itemName',
                                status: '$$item.status',
                                priority: '$$item.priority',
                                progress: '$$item.progress',
                                stepCompletion: {
                                    $cond: {
                                        if: { $eq: ['$$item.totalSteps', 0] },
                                        then: 0,
                                        else: {
                                            $round: [{
                                                $multiply: [{
                                                    $divide: ['$$item.completedSteps', '$$item.totalSteps']
                                                }, 100]
                                            }, 2]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: report[0] || {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating checklist progress report',
            error: error.message
        });
    }
};

// 3. Task Deadline Analysis Report - CORRECTED VERSION
exports.getDeadlineAnalysisReport = async (req, res) => {
    try {
        const report = await Item.aggregate([
            { $match: { deadline: { $ne: null } } },
            {
                $lookup: {
                    from: 'checklists',
                    localField: 'checklist_id',
                    foreignField: '_id',
                    as: 'checklist'
                }
            },
            { $unwind: '$checklist' },
            {
                $lookup: {
                    from: 'spaces',
                    localField: 'checklist.space_id',
                    foreignField: '_id',
                    as: 'space'
                }
            },
            { $unwind: '$space' },
            {
                $lookup: {
                    from: 'agents',
                    localField: 'space.agent_id',
                    foreignField: '_id',
                    as: 'agent'
                }
            },
            { $unwind: '$agent' },
            {
                $lookup: {
                    from: 'steps',
                    localField: '_id',
                    foreignField: 'item_id',
                    as: 'steps'
                }
            },
            {
                $addFields: {
                    daysUntilDeadline: {
                        $divide: [
                            { $subtract: ['$deadline', new Date()] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    deadlineStatus: {
                        $switch: {
                            branches: [
                                { case: { $lt: ['$deadline', new Date()] }, then: 'Overdue' },
                                { 
                                    case: { 
                                        $lte: [
                                            { $subtract: ['$deadline', new Date()] },
                                            1000 * 60 * 60 * 24 * 3
                                        ]
                                    }, 
                                    then: 'Urgent (≤3 days)' 
                                },
                                { 
                                    case: { 
                                        $lte: [
                                            { $subtract: ['$deadline', new Date()] },
                                            1000 * 60 * 60 * 24 * 7
                                        ]
                                    }, 
                                    then: 'Upcoming (≤1 week)' 
                                },
                                { 
                                    case: { 
                                        $lte: [
                                            { $subtract: ['$deadline', new Date()] },
                                            1000 * 60 * 60 * 24 * 30
                                        ]
                                    }, 
                                    then: 'Near Future (≤1 month)' 
                                }
                            ],
                            default: 'Future (>1 month)'
                        }
                    },
                    totalSteps: { $size: '$steps' },
                    completedSteps: {
                        $size: {
                            $filter: {
                                input: '$steps',
                                as: 'step',
                                cond: { $eq: ['$$step.status', 'Completed'] }
                            }
                        }
                    }
                }
            },
            {
                $facet: {
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                totalItemsWithDeadlines: { $sum: 1 },
                                overdueItems: {
                                    $sum: {
                                        $cond: [{ $lt: ['$deadline', new Date()] }, 1, 0]
                                    }
                                },
                                urgentItems: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $gt: ['$deadline', new Date()] },
                                                    { $lte: [
                                                        { $subtract: ['$deadline', new Date()] },
                                                        1000 * 60 * 60 * 24 * 3
                                                    ]}
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                averageDaysUntilDeadline: { $avg: '$daysUntilDeadline' },
                                averageProgress: { $avg: '$progress' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalItemsWithDeadlines: 1,
                                overdueItems: 1,
                                urgentItems: 1,
                                averageDaysUntilDeadline: { $round: ['$averageDaysUntilDeadline', 2] },
                                averageProgress: { $round: ['$averageProgress', 2] }
                            }
                        }
                    ],
                    
                    priorityAnalysis: [
                        {
                            $group: {
                                _id: '$priority',
                                count: { $sum: 1 },
                                overdue: {
                                    $sum: {
                                        $cond: [{ $lt: ['$deadline', new Date()] }, 1, 0]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                priority: '$_id',
                                _id: 0,
                                count: 1,
                                overdue: 1,
                                overduePercentage: {
                                    $round: [{
                                        $multiply: [{
                                            $divide: ['$overdue', '$count']
                                        }, 100]
                                    }, 2]
                                }
                            }
                        },
                        { $sort: { priority: 1 } }
                    ],
                    
                    deadlineStatusAnalysis: [
                        {
                            $group: {
                                _id: '$deadlineStatus',
                                count: { $sum: 1 },
                                averageProgress: { $avg: '$progress' }
                            }
                        },
                        {
                            $project: {
                                deadlineStatus: '$_id',
                                _id: 0,
                                count: 1,
                                percentage: {
                                    $round: [{
                                        $multiply: [{
                                            $divide: ['$count', { $sum: '$count' }]
                                        }, 100]
                                    }, 2]
                                },
                                averageProgress: { $round: ['$averageProgress', 2] }
                            }
                        },
                        {
                            $addFields: {
                                sortOrder: {
                                    $switch: {
                                        branches: [
                                            { case: { $eq: ['$_id', 'Overdue'] }, then: 1 },
                                            { case: { $eq: ['$_id', 'Urgent (≤3 days)'] }, then: 2 },
                                            { case: { $eq: ['$_id', 'Upcoming (≤1 week)'] }, then: 3 },
                                            { case: { $eq: ['$_id', 'Near Future (≤1 month)'] }, then: 4 },
                                            { case: { $eq: ['$_id', 'Future (>1 month)'] }, then: 5 }
                                        ],
                                        default: 6
                                    }
                                }
                            }
                        },
                        { $sort: { sortOrder: 1 } },
                        { $project: { sortOrder: 0 } }
                    ],
                    
                    criticalOverdueItems: [
                        {
                            $match: {
                                $and: [
                                    { $lt: ['$deadline', new Date()] },
                                    { $ne: ['$status', 'Completed'] }
                                ]
                            }
                        },
                        {
                            $sort: {
                                priority: -1,
                                deadline: 1
                            }
                        },
                        { $limit: 10 },
                        {
                            $project: {
                                _id: 1,
                                itemName: '$name',
                                priority: 1,
                                status: 1,
                                progress: 1,
                                deadline: 1,
                                checklist: '$checklist.checklist_title',
                                space: '$space.space_title',
                                agent: '$agent.name'
                            }
                        }
                    ],
                    
                    upcomingDeadlines: [
                        {
                            $match: {
                                $and: [
                                    { $gt: ['$deadline', new Date()] },
                                    { $lte: ['$deadline', { $add: [new Date(), 1000 * 60 * 60 * 24 * 7] }] },
                                    { $ne: ['$status', 'Completed'] }
                                ]
                            }
                        },
                        {
                            $sort: {
                                deadline: 1,
                                priority: -1
                            }
                        },
                        { $limit: 10 },
                        {
                            $project: {
                                _id: 1,
                                itemName: '$name',
                                priority: 1,
                                status: 1,
                                progress: 1,
                                deadline: 1,
                                checklist: '$checklist.checklist_title',
                                space: '$space.space_title',
                                agent: '$agent.name'
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    reportGenerated: new Date(),
                    overallStatistics: { $arrayElemAt: ['$overallStats', 0] },
                    priorityBreakdown: '$priorityAnalysis',
                    deadlineStatusBreakdown: '$deadlineStatusAnalysis',
                    alerts: {
                        criticalOverdueItems: '$criticalOverdueItems',
                        upcomingDeadlines: '$upcomingDeadlines'
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: report[0] || {},
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating deadline analysis report',
            error: error.message
        });
    }
};

// 4. Space Overview Report
exports.getSpaceOverviewReport = async (req, res) => {
    try {
        const report = await Space.aggregate([
            {
                $lookup: {
                    from: 'agents',
                    localField: 'agent_id',
                    foreignField: '_id',
                    as: 'agent'
                }
            },
            { $unwind: '$agent' },
            {
                $lookup: {
                    from: 'checklists',
                    localField: '_id',
                    foreignField: 'space_id',
                    as: 'checklists'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    spaceTitle: { $first: '$space_title' },
                    agentName: { $first: '$agent.name' },
                    agentEmail: { $first: '$agent.email' },
                    checklistCount: { $sum: { $size: '$checklists' } },
                    checklists: {
                        $push: {
                            checklistId: { $arrayElemAt: ['$checklists._id', 0] },
                            checklistTitle: { $arrayElemAt: ['$checklists.checklist_title', 0] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    spaceTitle: 1,
                    agentName: 1,
                    agentEmail: 1,
                    checklistCount: 1,
                    checklists: {
                        $filter: {
                            input: '$checklists',
                            as: 'checklist',
                            cond: { $ne: ['$$checklist.checklistId', null] }
                        }
                    }
                }
            },
            { $sort: { spaceTitle: 1 } }
        ]);

        res.status(200).json({
            success: true,
            count: report.length,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating space overview report',
            error: error.message
        });
    }
};