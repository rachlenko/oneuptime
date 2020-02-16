/**
 * 
 * Copyright HackerBay, Inc. 
 * 
 */

const express = require('express');
const ReportService = require('../services/reportService');
const {
    isAuthorized
} = require('../middlewares/authorization');
const getUser = require('../middlewares/user').getUser;
const getSubProjects = require('../middlewares/subProject').getSubProjects;
let sendErrorResponse = require('../middlewares/response').sendErrorResponse;
let sendListResponse = require('../middlewares/response').sendListResponse;
const router = express.Router();


/**
 * @Routes
 * @description get names of most active members to resolve incidents
 * @param Param 1: req.headers-> {authorization}; req.user-> {id}; req.params-> {projectId}
 * @returns { Array } an array of members ordered by number of incidents resolved
 */
router.get('/:projectId/active-members', getUser, isAuthorized, getSubProjects, async (req, res) => {
    try {
        const { startDate, endDate, skip, limit } = req.query;
        let subProjectIds = req.user.subProjects ? req.user.subProjects.map(project => project._id) : null;
        // Call ReportService
        let members = await ReportService.getMostActiveMembers(subProjectIds, startDate, endDate, skip, limit);
        let count = members.count;
        return sendListResponse(req, res, members.members, count);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

/**
* @Route
* @description route to fetch most active monitors
* @param Param 1: req.headers-> {authorization}; req.user-> {id}; req.params-> {projectId}
* @returns { Array } an array of monitors orderedby number of incidents
*/
router.get('/:projectId/active-monitors', getUser, isAuthorized, getSubProjects, async (req, res) => {
    try {
        const { startDate, endDate, skip, limit } = req.query;
        let subProjectIds = req.user.subProjects ? req.user.subProjects.map(project => project._id) : null;
        // Call Reports Service
        let monitors = await ReportService.getMostActiveMonitors(subProjectIds, startDate, endDate, skip, limit);
        let count = monitors.count;
        return sendListResponse(req, res, monitors.monitors, count);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

/**
* @Route
* @description route to fetch average time to resolve incidents by filter
* @param Param 1: req.headers-> {authorization}; req.user-> {id}; req.params-> {projectId}
* @returns { Array } an array of monitors orderedby number of incidents
*/
router.get('/:projectId/average-resolved', getUser, isAuthorized, getSubProjects, async (req, res) => {
    try {
        const { startDate, endDate, filter } = req.query;
        let subProjectIds = req.user.subProjects ? req.user.subProjects.map(project => project._id) : null;
        // Reports Service
        let resolveTime = await ReportService.getAverageTimeBy(subProjectIds, startDate, endDate, filter);
        return sendListResponse(req, res, resolveTime);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

/**
* @Route
* @description route to fetch incidents count by filter
* @param Param 1: req.headers-> {authorization}; req.user-> {id}; req.params-> {projectId}
* @returns { Array } an array of incidents count
*/
router.get('/:projectId/incidents', getUser, isAuthorized, getSubProjects, async (req, res) => {
    try {
        const { startDate, endDate, filter } = req.query;
        let subProjectIds = req.user.subProjects ? req.user.subProjects.map(project => project._id) : null;
        // Reports Service
        let incidents = await ReportService.getIncidentCountBy(subProjectIds, startDate, endDate, filter);
        return sendListResponse(req, res, incidents);
    } catch (error) {
        return sendErrorResponse(req, res, error);
    }
});

module.exports = router;
