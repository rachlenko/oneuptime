/* eslint-disable*/
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { reduxForm, Field, formValueSelector, change } from 'redux-form';
import {
    createMonitor,
    createMonitorSuccess,
    createMonitorFailure,
    resetCreateMonitor,
    editMonitor,
    editMonitorSwitch,
    setMonitorCriteria,
    addSeat,
    logFile,
    resetFile,
    setFileInputKey,
    uploadIdentityFile,
} from '../../actions/monitor';
import { RenderField } from '../basic/RenderField';
import { makeCriteria, API_URL } from '../../config';
import { FormLoader } from '../basic/Loader';
import { openModal, closeModal } from '../../actions/modal';
import {
    fetchMonitorCriteria,
    fetchMonitorsIncidents,
    fetchMonitorsSubscribers,
    toggleEdit,
} from '../../actions/monitor';
import { showUpgradeForm } from '../../actions/project';
import ShouldRender from '../basic/ShouldRender';
import { fetchSchedules, scheduleSuccess } from '../../actions/schedule';
import ApiAdvance from './ApiAdvance';
import ResponseComponent from './ResponseComponent';
import { User } from '../../config';
import { ValidateField } from '../../config';
import { RenderSelect } from '../basic/RenderSelect';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';
import { logEvent } from '../../analytics';
import { SHOULD_LOG_ANALYTICS, PricingPlan as PlanListing } from '../../config';
import Tooltip from '../basic/Tooltip';
import PricingPlan from '../basic/PricingPlan';
const selector = formValueSelector('NewMonitor');
const dJSON = require('dirty-json');
import { history } from '../../store';
import uuid from 'uuid';
import { fetchCommunicationSlas } from '../../actions/incidentCommunicationSla';
import { fetchMonitorSlas } from '../../actions/monitorSla';
import { UploadFile } from '../basic/UploadFile';

class NewMonitor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            advance: false,
            script: '',
            type: props.edit ? props.editMonitorProp.type : props.type,
            httpRequestLink: `${API_URL}/incomingHttpRequest/${uuid.v4()}`,
            mode: props.edit ? props.editMonitorProp.mode : props.mode,
            authentication: props.edit
                ? props.editMonitorProp.authentication
                : props.authentication,
        };
    }

    componentDidMount() {
        const userId = User.getUserId();
        const projectMember = this.props.currentProject.users.find(
            user => user.userId === userId
        );
        //load call schedules
        if (projectMember) {
            this.props.fetchMonitorSlas(this.props.currentProject._id);
            this.props.fetchCommunicationSlas(this.props.currentProject._id);
            this.props.fetchSchedules(this.props.currentProject._id);
        }
        this.props.fetchMonitorCriteria();
        this.props.setFileInputKey(new Date());
    }

    componentDidUpdate() {
        const { monitor } = this.props;
        if (
            monitor.newMonitor.error ===
            "You can't add any more monitors. Please upgrade plan."
        ) {
            this.props.showUpgradeForm();
        }
    }

    submitForm = values => {
        const thisObj = this;
        const postObj = { data: {}, criteria: {} };
        postObj.componentId = thisObj.props.componentId;
        postObj.projectId = this.props.projectId;
        postObj.incidentCommunicationSla = values.incidentCommunicationSla;
        postObj.monitorSla = values.monitorSla;
        postObj.name = values[`name_${this.props.index}`];
        postObj.type = values[`type_${this.props.index}`]
            ? values[`type_${this.props.index}`]
            : this.props.edit
            ? this.props.editMonitorProp.type
            : this.props.type;
        postObj.resourceCategory =
            values[`resourceCategory_${this.props.index}`];
        postObj.callScheduleId = values[`callSchedule_${this.props.index}`];
        if (postObj.type === 'manual')
            postObj.data.description =
                values[`description_${this.props.index}`] || null;

        if (postObj.type === 'device')
            postObj.data.deviceId = values[`deviceId_${this.props.index}`];

        if (postObj.type === 'url' || postObj.type === 'api')
            postObj.data.url = values[`url_${this.props.index}`];

        if (postObj.type === 'script') {
            postObj.data.script = thisObj.state.script;
        }

        if (
            postObj.type === 'server-monitor' &&
            values[`mode_${this.props.index}`] === 'agentless'
        ) {
            postObj.agentlessConfig = {
                host: values[`host_${this.props.index}`],
                port: values[`port_${this.props.index}`],
                username: values[`username_${this.props.index}`],
                authentication: values[`authentication_${this.props.index}`],
                password: values[`password_${this.props.index}`],
                identityFile: this.props.identityFile,
            };
        }

        if (postObj.type === 'incomingHttpRequest')
            postObj.data.link = thisObj.state.httpRequestLink;

        if (
            postObj.type === 'url' ||
            postObj.type === 'api' ||
            postObj.type === 'server-monitor' ||
            postObj.type === 'script' ||
            postObj.type === 'incomingHttpRequest'
        ) {
            if (
                values &&
                values[`up_${this.props.index}`] &&
                values[`up_${this.props.index}`].length
            ) {
                postObj.criteria.up = makeCriteria(
                    values[`up_${this.props.index}`]
                );
                postObj.criteria.up.createAlert =
                    values && values[`up_${this.props.index}_createAlert`]
                        ? true
                        : false;
                postObj.criteria.up.autoAcknowledge =
                    values && values[`up_${this.props.index}_autoAcknowledge`]
                        ? true
                        : false;
                postObj.criteria.up.autoResolve =
                    values && values[`up_${this.props.index}_autoResolve`]
                        ? true
                        : false;
            }

            if (
                values &&
                values[`degraded_${this.props.index}`] &&
                values[`degraded_${this.props.index}`].length
            ) {
                postObj.criteria.degraded = makeCriteria(
                    values[`degraded_${this.props.index}`]
                );
                postObj.criteria.degraded.createAlert =
                    values && values[`degraded_${this.props.index}_createAlert`]
                        ? true
                        : false;
                postObj.criteria.degraded.autoAcknowledge =
                    values &&
                    values[`degraded_${this.props.index}_autoAcknowledge`]
                        ? true
                        : false;
                postObj.criteria.degraded.autoResolve =
                    values && values[`degraded_${this.props.index}_autoResolve`]
                        ? true
                        : false;
            }

            if (
                values &&
                values[`down_${this.props.index}`] &&
                values[`down_${this.props.index}`].length
            ) {
                postObj.criteria.down = makeCriteria(
                    values[`down_${this.props.index}`]
                );
                postObj.criteria.down.createAlert =
                    values && values[`down_${this.props.index}_createAlert`]
                        ? true
                        : false;
                postObj.criteria.down.autoAcknowledge =
                    values && values[`down_${this.props.index}_autoAcknowledge`]
                        ? true
                        : false;
                postObj.criteria.down.autoResolve =
                    values && values[`down_${this.props.index}_autoResolve`]
                        ? true
                        : false;
            }
        }
        if (postObj.type === 'api') {
            if (
                values &&
                values[`method_${this.props.index}`] &&
                values[`method_${this.props.index}`].length
            ) {
                postObj.method = values[`method_${this.props.index}`];
            }
            if (
                values &&
                values[`headers_${this.props.index}`] &&
                values[`headers_${this.props.index}`].length
            ) {
                postObj.headers = values[`headers_${this.props.index}`];
            }
            if (
                values &&
                values[`bodyType_${this.props.index}`] &&
                values[`bodyType_${this.props.index}`].length
            ) {
                postObj.bodyType = values[`bodyType_${this.props.index}`];
            }
            if (
                values &&
                values[`formData_${this.props.index}`] &&
                values[`formData_${this.props.index}`].length &&
                (postObj.bodyType === 'form-data' ||
                    postObj.bodyType === 'x-www-form-urlencoded')
            ) {
                postObj.formData = values[`formData_${this.props.index}`];
            }
            if (
                values &&
                values[`text_${this.props.index}`] &&
                values[`text_${this.props.index}`].length &&
                !(
                    postObj.bodyType === 'form-data' ||
                    postObj.bodyType === 'x-www-form-urlencoded'
                )
            ) {
                let text = values[`text_${this.props.index}`];
                if (postObj.bodyType === 'application/json') {
                    try {
                        const val = text.replace(/^,{+|},+$/g, '');
                        const r = dJSON.parse(val);
                        text = JSON.stringify(r);
                    } catch (e) {}
                }
                postObj.text = text;
            }
        }

        if (this.props.edit) {
            const { monitorId } = this.props;
            postObj._id = this.props.editMonitorProp._id;
            this.props.editMonitor(postObj.projectId, postObj).then(() => {
                this.props.toggleEdit(false);
                thisObj.props.destroy();
                if (monitorId === this.props.editMonitorProp._id) {
                    this.props.fetchMonitorsIncidents(
                        postObj.projectId,
                        this.props.editMonitorProp._id,
                        0,
                        5
                    );
                    this.props.fetchMonitorsSubscribers(
                        postObj.projectId,
                        this.props.editMonitorProp._id,
                        0,
                        5
                    );
                } else {
                    this.props.fetchMonitorsIncidents(
                        postObj.projectId,
                        this.props.editMonitorProp._id,
                        0,
                        3
                    );
                }
                if (SHOULD_LOG_ANALYTICS) {
                    logEvent(
                        'EVENT: DASHBOARD > PROJECT > COMPONENT > MONITOR > EDIT MONITOR',
                        values
                    );
                }
            });
        } else {
            this.props.createMonitor(postObj.projectId, postObj).then(
                data => {
                    thisObj.props.reset();
                    if (SHOULD_LOG_ANALYTICS) {
                        logEvent(
                            'EVENT: DASHBOARD > PROJECT > COMPONENT > MONITOR > NEW MONITOR',
                            values
                        );
                    }
                    history.push(
                        `/dashboard/project/${this.props.currentProject._id}/${this.props.componentId}/monitoring/${data.data._id}`
                    );
                },
                error => {
                    if (error && error.message) {
                        return error;
                    }
                }
            );
        }

        this.setState({
            advance: false,
            script: '',
            type: this.props.edit
                ? this.props.editMonitorProp.type
                : this.props.type,
        });
    };

    scheduleChange = (e, value) => {
        //load call schedules
        if (value && value !== '') {
            this.props.fetchSchedules(value);
        } else {
            const userId = User.getUserId();
            const projectMember = this.props.currentProject.users.find(
                user => user.userId === userId
            );
            if (projectMember)
                this.props.fetchSchedules(this.props.currentProject._id);
        }
    };

    cancelEdit = () => {
        this.props.editMonitorSwitch(this.props.index);
        this.props.toggleEdit(false);
    };

    openAdvance = () => {
        this.setState({ advance: !this.state.advance });
    };

    changeBox = (e, value) => {
        this.setState({ advance: false, type: value });
        this.props.setMonitorCriteria(
            this.props.name,
            this.props.category,
            this.props.subProject,
            this.props.schedule,
            this.props.monitorSla,
            this.props.incidentCommunicationSla,
            value
        );
    };

    changeMode = (e, value) => {
        this.setState({ mode: value });
    };

    changeAuthentication = (e, value) => {
        this.setState({ authentication: value });
    };

    changeFile = e => {
        e.preventDefault();

        const { logFile, uploadIdentityFile, projectId } = this.props;

        const reader = new FileReader();
        const file = e.target.files[0];

        reader.onloadend = () => {
            const fileResult = reader.result;
            logFile(fileResult);
            uploadIdentityFile(projectId, file);
        };
        try {
            reader.readAsDataURL(file);
            console.log('*** Identity File ***', file);
        } catch (error) {
            return;
        }
    };

    removeFile = () => {
        const { setFileInputKey, resetFile } = this.props;

        setFileInputKey(new Date());
        resetFile();
    };

    scriptTextChange = newValue => {
        this.setState({ script: newValue });
    };

    monitorTypeDescription = {
        url:
            'Monitor your website and get notified when it goes down or performs poorly.',
        device:
            'Monitor IoT devices constantly and notify your team when they do not behave the way you want.',
        manual: (
            <>
                Manual monitors do not monitor any resource. You can change
                monitor status by using{' '}
                <a href="https://fyipe.com/docs">Fyipe’s API</a>. This is
                helpful when you use different monitoring tool but want to
                record monitor status on Fyipe.
            </>
        ),
        api: (
            <>
                Monitor{' '}
                <a href="https://en.wikipedia.org/wiki/Representational_state_transfer">
                    REST
                </a>{' '}
                endpoints constantly and notify your team when they do not
                behave the way you want.
            </>
        ),
        script:
            'Run custom JavaScript script and alerts you when script fails.',
        'server-monitor':
            'Monitor servers constantly and notify your team when they do not behave the way you want.',
    };

    getCurrentMonitorCount = monitor => {
        let count = 0;
        if (monitor.monitorsList.monitors.length > 0) {
            monitor.monitorsList.monitors.map(monitorObj => {
                count += monitorObj.count;
                return monitorObj;
            });
        }
        return count;
    };

    getNextPlan = plan => {
        const plans = ['Startup', 'Growth', 'Scale', 'Enterprise'];
        const nextPlanIndex = plans.indexOf(plan) + 1;

        if (nextPlanIndex >= plans.length) {
            return plans[plans.length - 1];
        }

        return plans[nextPlanIndex];
    };

    getUserCount = (project, subProjects) => {
        let count = 0;
        if (subProjects.length > 0) {
            const users = [];
            subProjects.map(subProject => {
                subProject.users.map(user => {
                    // ensure a user is not counted twice
                    // even when they're added to multiple subprojects
                    if (!users.includes(user.userId)) {
                        users.push(user.userId);
                    }
                    return user;
                });
                return subProject;
            });
            count = users.length;
        } else {
            count = project.users.length;
        }
        return count;
    };

    renderMonitorConfiguration = (name)=>{
        return(
            <div className="bs-ContentSection-content Box-root  Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                <div className="Box-root">
                    <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                    <span>{name} Monitor Configuration</span>
                    </span>
                    <p>
                        <span>
                            Setup your new monitor's configuration as per your needs.
                        </span>
                    </p>
                </div>
            </div>
        );
    }
    render() {
        const requesting =
            (this.props.monitor.newMonitor.requesting && !this.props.edit) ||
            (this.props.monitor.editMonitor.requesting && this.props.edit) ||
            this.props.requestingSla ||
            this.props.requestingMonitorSla;

        const {
            handleSubmit,
            subProjects,
            schedules,
            resourceCategoryList,
            monitor,
            project,
            currentPlanId,
            identityFile,
            fileInputKey,
        } = this.props;
        const { type, mode, authentication, httpRequestLink } = this.state;
        const unlimitedMonitors = ['Scale', 'Enterprise'];
        const planCategory =
            currentPlanId === 'enterprise'
                ? 'Enterprise'
                : PlanListing.getPlanById(currentPlanId).category;
        const numOfUsers = this.getUserCount(project, subProjects);
        const monitorPerUser =
            planCategory === 'Startup' ? 5 : planCategory === 'Growth' ? 10 : 0;
        const monitorCount = numOfUsers * monitorPerUser;
        const currentMonitorCount = this.getCurrentMonitorCount(monitor);
        const monitorTypesOptions=[
            {
                value:
                    'url',
                label:
                    'Website',
                icon:"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNTA4IDUwOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTA4IDUwODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik0yNTQsMEMxNDYuNywwLDAsODEuMSwwLDI1NGMwLDE2OC41LDE0MS4xLDI1NCwyNTQsMjU0YzE5My43LDAsMjU0LTE2OS43LDI1NC0yNTRDNTA4LDEyOS42LDQxMi44LDAsMjU0LDB6IE0xOTUuMSwyMy45DQoJCQljLTI2LjUsMjIuNi00OC41LDYwLTYyLjcsMTA2LjRjLTE4LjQtMTAuOS0zNS4zLTI0LjQtNTAuMy00MC4xQzExMy4xLDU3LjcsMTUyLjMsMzQuOSwxOTUuMSwyMy45eiBNNzEuMiwxMDIuNA0KCQkJYzE2LjgsMTcuNSwzNS45LDMyLjQsNTYuNyw0NC4yYy03LjgsMzAuMy0xMi40LDYzLjktMTMsOTkuMkgxNi42QzE4LjQsMTkzLjEsMzcuNiwxNDIuOCw3MS4yLDEwMi40eiBNNzEuMiw0MDUuNg0KCQkJYy0zMy43LTQwLjQtNTIuOC05MC43LTU0LjYtMTQzLjRoOTguM2MwLjYsMzUuNCw1LjIsNjguOSwxMyw5OS4yQzEwNy4yLDM3My4zLDg4LjEsMzg4LjEsNzEuMiw0MDUuNnogTTgyLjEsNDE3LjkNCgkJCWMxNS0xNS43LDMxLjktMjkuMiw1MC4zLTQwLjFjMTQuMiw0Ni4zLDM2LjIsODMuOCw2Mi43LDEwNi40QzE1Mi4zLDQ3My4xLDExMy4xLDQ1MC4zLDgyLjEsNDE3Ljl6IE0yNDUuOCw0OTENCgkJCWMtNDIuNi01LjQtNzkuMy01My05OS4xLTEyMS4yYzMwLjYtMTUuNSw2NC40LTI0LjIsOTkuMS0yNS41VjQ5MXogTTI0NS44LDMyOGMtMzYuMiwxLjItNzEuNCwxMC4xLTEwMy4zLDI1LjcNCgkJCWMtNi43LTI4LTEwLjctNTguOS0xMS4zLTkxLjVoMTE0LjZWMzI4eiBNMjQ1LjgsMjQ1LjhIMTMxLjJjMC42LTMyLjYsNC42LTYzLjUsMTEuMy05MS41YzMyLDE1LjYsNjcuMiwyNC41LDEwMy4zLDI1LjdWMjQ1Ljh6DQoJCQkgTTI0NS44LDE2My43Yy0zNC44LTEuMi02OC41LTEwLTk5LjEtMjUuNUMxNjYuNSw2OS45LDIwMy4yLDIyLjQsMjQ1LjgsMTdWMTYzLjd6IE00MzYuOCwxMDIuNGMzMy42LDQwLjQsNTIuOCw5MC43LDU0LjYsMTQzLjQNCgkJCWgtOTguMmMtMC42LTM1LjQtNS4yLTY4LjktMTMtOTkuMkM0MDAuOSwxMzQuNyw0MjAsMTE5LjksNDM2LjgsMTAyLjR6IE00MjUuOSw5MC4xYy0xNSwxNS43LTMxLjksMjkuMi01MC4zLDQwLjENCgkJCWMtMTQuMi00Ni4zLTM2LjItODMuNy02Mi43LTEwNi40QzM1NS43LDM0LjksMzk0LjksNTcuNyw0MjUuOSw5MC4xeiBNMjYyLjIsMTdjNDIuNiw1LjQsNzkuMyw1Myw5OS4xLDEyMS4yDQoJCQljLTMwLjYsMTUuNS02NC4zLDI0LjItOTkuMSwyNS41VjE3eiBNMjYyLjIsMTgwYzM2LjItMS4yLDcxLjQtMTAuMSwxMDMuMy0yNS43YzYuNywyOCwxMC43LDU4LjksMTEuMyw5MS41SDI2Mi4yVjE4MHoNCgkJCSBNMjYyLjIsMjYyLjJoMTE0LjZjLTAuNiwzMi42LTQuNiw2My41LTExLjMsOTEuNWMtMzEuOS0xNS43LTY3LjEtMjQuNi0xMDMuMy0yNS43VjI2Mi4yeiBNMjYyLjIsNDkxVjM0NC4zDQoJCQljMzQuOCwxLjIsNjguNSwxMCw5OS4xLDI1LjVDMzQxLjUsNDM4LjEsMzA0LjgsNDg1LjYsMjYyLjIsNDkxeiBNMzEyLjksNDg0LjFjMjYuNS0yMi42LDQ4LjUtNjAsNjIuNy0xMDYuNA0KCQkJYzE4LjQsMTAuOSwzNS4zLDI0LjQsNTAuMyw0MC4xQzM5NC45LDQ1MC4zLDM1NS43LDQ3My4xLDMxMi45LDQ4NC4xeiBNNDM2LjgsNDA1LjZjLTE2LjgtMTcuNS0zNS45LTMyLjMtNTYuNi00NC4yDQoJCQljNy44LTMwLjMsMTIuNC02My45LDEzLTk5LjJoOTguMkM0ODkuNiwzMTQuOSw0NzAuNCwzNjUuMiw0MzYuOCw0MDUuNnoiLz4NCgk8L2c+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==",
            },
            {
                value:
                    'device',
                label:
                    'IoT Device',
                icon:"data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNDgwLjA2NSA0ODAuMDY1IiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDQ4MC4wNjUgNDgwLjA2NSIgd2lkdGg9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMjI1Ljg4OCAyODMuODVjMCA3LjgxNyA2LjMyNSAxNC4xNDQgMTQuMTQ0IDE0LjE0NCA3LjgxNyAwIDE0LjE0NC02LjMyNSAxNC4xNDQtMTQuMTQ0IDAtNy44MTctNi4zMjUtMTQuMTQ1LTE0LjE0NC0xNC4xNDUtNy44MTcuMDAxLTE0LjE0NCA2LjMyNi0xNC4xNDQgMTQuMTQ1em00MC0yNS44NTZjLTE0LjI1Ny0xNC4yNTctMzcuNDU1LTE0LjI1Ny01MS43MTIgMC0zLjEyNCAzLjEyNC04LjE4OSAzLjEyNC0xMS4zMTMgMC0zLjEyNS0zLjEyNC0zLjEyNS04LjE4OSAwLTExLjMxMyAyMC40OTUtMjAuNDk1IDUzLjg0NC0yMC40OTUgNzQuMzM5IDAgNS4wNTYgNS4wNTUgMS40MDUgMTMuNjU3LTUuNjU3IDEzLjY1Ny0yLjA0Ny0uMDAxLTQuMDk1LS43ODItNS42NTctMi4zNDR6bTMwLjA4LTMwLjA4Yy0zMC45MTYtMzAuOTE2LTgwLjk1NC0zMC45MTgtMTExLjg3MiAwLTMuMTI0IDMuMTI0LTguMTg5IDMuMTI0LTExLjMxMyAwLTMuMTI1LTMuMTI0LTMuMTI1LTguMTg5IDAtMTEuMzEzIDM3LjE2OC0zNy4xNjkgOTcuMzI3LTM3LjE3MyAxMzQuNDk5IDAgNS4wNTYgNS4wNTUgMS40MDUgMTMuNjU3LTUuNjU3IDEzLjY1Ny0yLjA0OC0uMDAxLTQuMDk1LS43ODEtNS42NTctMi4zNDR6bS01NS45MzYtMTAzLjg4MmMtNjMuOTYyIDAtMTE2IDUyLjAzOC0xMTYgMTE2czUyLjAzOCAxMTYgMTE2IDExNmM0Ny45NzYgMCA5MS41OTktMzAuMTQzIDEwOC41NTEtNzUuMDA2IDEuNTYyLTQuMTMyIDYuMTc3LTYuMjE5IDEwLjMxMS00LjY1NiA0LjEzMyAxLjU2MiA2LjIxOCA2LjE3OCA0LjY1NiAxMC4zMTEtMTkuMDUgNTAuNDE3LTY3LjUyNiA4NS4zNTEtMTIzLjUxOCA4NS4zNTEtNzIuNzg1IDAtMTMyLTU5LjIxNS0xMzItMTMyczU5LjIxNS0xMzIgMTMyLTEzMiAxMzIgNTkuMjE1IDEzMiAxMzJjMCA0LjQxOC0zLjU4MiA4LTggOHMtOC0zLjU4Mi04LThjMC02My45NjMtNTIuMDM3LTExNi0xMTYtMTE2em0tMTg3LjM1NSAyMzguODE1Yy00OC44NjYtNzQuMzMzLTQ4LjkzMi0xNzEuMjAxLS4wMDEtMjQ1LjYzMiAzMS4wNzkgMTguOTA5IDcxLjM1Ny0zLjUyNiA3MS4zNTctNDAuMTg0IDAtOC45MS0yLjQ5Mi0xNy4yNDktNi44MTYtMjQuMzU3IDY0LjgwMi00Mi42MDIgMTQ2LjM1Ni00Ny45MSAyMTUuMDM0LTE2Ljg0MyA0LjAyNiAxLjgyMiA4Ljc2Ni4wMzQgMTAuNTg2LTMuOTkyIDEuODIxLTQuMDI2LjAzNC04Ljc2Ni0zLjk5Mi0xMC41ODYtNzQuMTkyLTMzLjU2LTE2Mi40MTktMjcuNTUyLTIzMi4yNDkgMTkuMjc1LTguMDgxLTYuNTU3LTE4LjM2OS0xMC40OTctMjkuNTYzLTEwLjQ5Ny0zOS41NzggMC02MS4yMzkgNDYuMDc4LTM2LjUwMyA3Ni41NjMtNTQuMDI0IDgwLjU2Ni01NC4wNTQgMTg2LjI2NCAwIDI2Ni44NzUtMjQuNzM2IDMwLjQ4Ni0zLjA3NiA3Ni41NjMgMzYuNTAzIDc2LjU2MyAyNS45MTYgMCA0Ny0yMS4wODQgNDctNDctLjAwMS0zNi42NzMtNDAuMjkzLTU5LjA4MS03MS4zNTYtNDAuMTg1em0yNC4zNTUtMzE2LjgxNWMxNy4wOTMgMCAzMSAxMy45MDcgMzEgMzFzLTEzLjkwNyAzMS0zMSAzMS0zMS0xMy45MDctMzEtMzEgMTMuOTA3LTMxIDMxLTMxem0wIDM4OGMtMTcuMDkzIDAtMzEtMTMuOTA3LTMxLTMxczEzLjkwNy0zMSAzMS0zMSAzMSAxMy45MDcgMzEgMzEtMTMuOTA2IDMxLTMxIDMxem0zNjIuNTAzLTMyNy40MzhjMjQuNzM2LTMwLjQ4MyAzLjA3OC03Ni41NjMtMzYuNTAzLTc2LjU2My0yNS45MTYgMC00NyAyMS4wODQtNDcgNDcgMCAzNi42NzQgNDAuMjk0IDU5LjA4MiA3MS4zNTYgNDAuMTg0IDQ4Ljg2NCA3NC4zMjggNDguOTMxIDE3MS4yMDIgMCAyNDUuNjMyLTMxLjA3OS0xOC45MDgtNzEuMzU2IDMuNTI2LTcxLjM1NiA0MC4xODQgMCA4LjkxIDIuNDkyIDE3LjI0OCA2LjgxNiAyNC4zNTUtNjUuNjQzIDQzLjE1My0xNDguNTQ1IDQ4LjEwNi0yMTcuOTQ3IDE1LjUwMS00LTEuODc4LTguNzY0LS4xNi0xMC42NDMgMy44MzlzLS4xNiA4Ljc2NCAzLjgzOSAxMC42NDNjNzUuMDk0IDM1LjI3OSAxNjQuNzgzIDI5LjQ5OSAyMzUuMzczLTE3LjgzNCAzMC40ODYgMjQuNzM2IDc2LjU2MiAzLjA3NCA3Ni41NjItMzYuNTAzIDAtMTEuMTk0LTMuOTQtMjEuNDgxLTEwLjQ5Ny0yOS41NjMgNTQuMDI1LTgwLjU2NSA1NC4wNTUtMTg2LjI2NSAwLTI2Ni44NzV6bS02Ny41MDMtMjkuNTYyYzAtMTcuMDkzIDEzLjkwNy0zMSAzMS0zMXMzMSAxMy45MDcgMzEgMzEtMTMuOTA3IDMxLTMxIDMxLTMxLTEzLjkwNy0zMS0zMXptMzEgMzU3Yy0xNy4wOTMgMC0zMS0xMy45MDctMzEtMzFzMTMuOTA3LTMxIDMxLTMxIDMxIDEzLjkwNyAzMSAzMS0xMy45MDYgMzEtMzEgMzF6Ii8+PC9zdmc+",
            },
            {
                value:
                    'manual',
                label:
                    'Manual',
                icon:'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNjQgNjQiIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIj48ZyBpZD0iQm9vayI+PHBhdGggZD0iTTM1LDM5SDI5YTEsMSwwLDAsMS0xLTFWMzQuMjQ3Yy0uMTQ0LS4wNTctLjI4My0uMTE1LS40MTktLjE3NGwtMi42NTQsMi42NTRhMSwxLDAsMCwxLS43MDcuMjkzaDBhMSwxLDAsMCwxLS43MDctLjI5M2wtNC4yNC00LjI0YTEsMSwwLDAsMSwwLTEuNDE0bDIuNjU0LTIuNjU1Yy0uMDYtLjEzNS0uMTE3LS4yNzQtLjE3NC0uNDE4SDE4YTEsMSwwLDAsMS0xLTFWMjFhMSwxLDAsMCwxLDEtMWgzLjc1M2MuMDU3LS4xNDQuMTE0LS4yODMuMTc0LS40MTlsLTIuNjU0LTIuNjU0YTEsMSwwLDAsMSwwLTEuNDE0bDQuMjQtNC4yNGExLjAyOSwxLjAyOSwwLDAsMSwxLjQxNCwwbDIuNjU0LDIuNjU0Yy4xMzYtLjA1OS4yNzUtLjExNy40MTktLjE3NFYxMGExLDEsMCwwLDEsMS0xaDZhMSwxLDAsMCwxLDEsMXYzLjc1M2MuMTQ0LjA1Ny4yODMuMTE1LjQxOS4xNzRsMi42NTQtMi42NTRhMSwxLDAsMCwxLC43MDctLjI5M2gwYTEsMSwwLDAsMSwuNzA3LjI5M2w0LjI0LDQuMjRhMSwxLDAsMCwxLDAsMS40MTRsLTIuNjU0LDIuNjU0Yy4wNi4xMzYuMTE3LjI3NS4xNzQuNDE5SDQ2YTEsMSwwLDAsMSwxLDF2NmExLDEsMCwwLDEtMSwxSDQyLjI0N2MtLjA1Ny4xNDQtLjExNC4yODMtLjE3NC40MThsMi42NTQsMi42NTVhMSwxLDAsMCwxLDAsMS40MTRsLTQuMjQsNC4yNGExLjAyOSwxLjAyOSwwLDAsMS0xLjQxNCwwbC0yLjY1NC0yLjY1NGMtLjEzNi4wNTktLjI3NS4xMTctLjQxOS4xNzRWMzhBMSwxLDAsMCwxLDM1LDM5Wm0tNS0yaDRWMzMuNTRhMSwxLDAsMCwxLC42OTMtLjk1Miw4LjExMiw4LjExMiwwLDAsMCwxLjQ0Ni0uNjA1LDEsMSwwLDAsMSwxLjE4OC4xN2wyLjQ1MywyLjQ1MywyLjgyNS0yLjgyNi0yLjQ1Mi0yLjQ1M2ExLDEsMCwwLDEtLjE3LTEuMTg3LDguMjI1LDguMjI1LDAsMCwwLC42MDUtMS40NDZBMSwxLDAsMCwxLDQxLjU0LDI2SDQ1VjIySDQxLjU0YTEsMSwwLDAsMS0uOTUyLS42OTQsOC4yMjUsOC4yMjUsMCwwLDAtLjYwNS0xLjQ0NiwxLDEsMCwwLDEsLjE3LTEuMTg3bDIuNDUyLTIuNDUzTDM5Ljc4LDEzLjM5NGwtMi40NTMsMi40NTNhMSwxLDAsMCwxLTEuMTg4LjE3LDguMTEyLDguMTEyLDAsMCwwLTEuNDQ2LS42QTEsMSwwLDAsMSwzNCwxNC40NlYxMUgzMHYzLjQ2YTEsMSwwLDAsMS0uNjkzLjk1Miw4LjExMiw4LjExMiwwLDAsMC0xLjQ0Ni42LDEsMSwwLDAsMS0xLjE4OC0uMTdMMjQuMjIsMTMuMzk0LDIxLjQsMTYuMjJsMi40NTIsMi40NTNhMSwxLDAsMCwxLC4xNywxLjE4Nyw4LjIyNSw4LjIyNSwwLDAsMC0uNjA1LDEuNDQ2QTEsMSwwLDAsMSwyMi40NiwyMkgxOXY0aDMuNDZhMSwxLDAsMCwxLC45NTIuNjk0LDguMjI1LDguMjI1LDAsMCwwLC42MDUsMS40NDYsMSwxLDAsMCwxLS4xNywxLjE4N0wyMS40LDMxLjc4bDIuODI1LDIuODI2LDIuNDUzLTIuNDUzYTEsMSwwLDAsMSwxLjE4OC0uMTcsOC4xMTIsOC4xMTIsMCwwLDAsMS40NDYuNjA1QTEsMSwwLDAsMSwzMCwzMy41NFoiLz48cGF0aCBkPSJNMzIsMzBhNiw2LDAsMSwxLDYtNkE2LjAwNiw2LjAwNiwwLDAsMSwzMiwzMFptMC0xMGE0LDQsMCwxLDAsNCw0QTQsNCwwLDAsMCwzMiwyMFoiLz48cGF0aCBkPSJNNTYsNDZhMSwxLDAsMCwwLDEtMVYzYTEsMSwwLDAsMC0xLTFIMTNBNi4wMDYsNi4wMDYsMCwwLDAsNyw4VjUwYTYuMDA2LDYuMDA2LDAsMCwwLDYsNmgzdjVhMSwxLDAsMCwwLDEuNzA3LjcwN0wyMSw1OC40MTRsMy4yOTMsMy4yOTNBMSwxLDAsMCwwLDI2LDYxVjU2SDU2YTEsMSwwLDAsMCwwLTIsNCw0LDAsMCwxLDAtOFpNMjQsNTguNTg2bC0yLjI5My0yLjI5M2ExLDEsMCwwLDAtMS40MTQsMEwxOCw1OC41ODZWNTFoNlpNNTEuNTQsNTRIMjZWNTFINDdhMSwxLDAsMCwwLDAtMkgxMmExLDEsMCwwLDAsMCwyaDR2M0gxM2E0LDQsMCwxLDEsMC04SDUxLjU0YTUuOTY1LDUuOTY1LDAsMCwwLDAsOFpNMTMsNDRhNS45OTIsNS45OTIsMCwwLDAtNCwxLjUzMVY4YTQsNCwwLDAsMSw0LTRINTVWNDRaIi8+PC9nPjwvc3ZnPgo=',
            },
            {
                value:
                    'api',
                label:
                    'API',
                icon:'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMzY4IDM2OCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzY4IDM2ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik04OCwxMjguMDAxSDU2Yy0xMy4yMzIsMC0yNCwxMC43NjgtMjQsMjR2ODBjMCw0LjQxNiwzLjU3Niw4LDgsOHM4LTMuNTg0LDgtOHYtMjRoNDh2MjRjMCw0LjQxNiwzLjU3Niw4LDgsOHM4LTMuNTg0LDgtOA0KCQkJdi04MEMxMTIsMTM4Ljc2OSwxMDEuMjMyLDEyOC4wMDEsODgsMTI4LjAwMXogTTk2LDE5Mi4wMDFINDh2LTQwYzAtNC40MDgsMy41ODQtOCw4LThoMzJjNC40MTYsMCw4LDMuNTkyLDgsOFYxOTIuMDAxeiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KCTxnPg0KCQk8cGF0aCBkPSJNMTkyLDEyOC4wMDFoLTMyYy00LjQyNCwwLTgsMy41ODQtOCw4djk2YzAsNC40MTYsMy41NzYsOCw4LDhzOC0zLjU4NCw4LTh2LTI0aDI0YzIyLjA1NiwwLDQwLTE3Ljk0NCw0MC00MA0KCQkJQzIzMiwxNDUuOTQ1LDIxNC4wNTYsMTI4LjAwMSwxOTIsMTI4LjAwMXogTTE5MiwxOTIuMDAxaC0yNHYtNDhoMjRjMTMuMjMyLDAsMjQsMTAuNzY4LDI0LDI0UzIwNS4yMzIsMTkyLjAwMSwxOTIsMTkyLjAwMXoiLz4NCgk8L2c+DQo8L2c+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTMyOCwyMjQuMDAxaC0yNHYtODBoMjRjNC40MjQsMCw4LTMuNTg0LDgtOHMtMy41NzYtOC04LThoLTY0Yy00LjQyNCwwLTgsMy41ODQtOCw4czMuNTc2LDgsOCw4aDI0djgwaC0yNA0KCQkJYy00LjQyNCwwLTgsMy41ODQtOCw4YzAsNC40MTYsMy41NzYsOCw4LDhoNjRjNC40MjQsMCw4LTMuNTg0LDgtOEMzMzYsMjI3LjU4NSwzMzIuNDI0LDIyNC4wMDEsMzI4LDIyNC4wMDF6Ii8+DQoJPC9nPg0KPC9nPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik0zNDQsNDguMDAxSDIxOS4zMTJsLTI5LjY1Ni0yOS42NTZjLTMuMTI4LTMuMTI4LTguMTg0LTMuMTI4LTExLjMxMiwwbC0yOS42NTYsMjkuNjU2SDI0Yy0xMy4yMzIsMC0yNCwxMC43NjgtMjQsMjR2MjQNCgkJCWMwLDQuNDE2LDMuNTc2LDgsOCw4czgtMy41ODQsOC04di0yNGMwLTQuNDA4LDMuNTg0LTgsOC04aDEyOGMyLjEyOCwwLDQuMTYtMC44NCw1LjY1Ni0yLjM0NEwxODQsMzUuMzEzbDI2LjM0NCwyNi4zNDQNCgkJCWMxLjQ5NiwxLjUwNCwzLjUyOCwyLjM0NCw1LjY1NiwyLjM0NGgxMjhjNC40MTYsMCw4LDMuNTkyLDgsOHYyNGMwLDQuNDE2LDMuNTc2LDgsOCw4czgtMy41ODQsOC04di0yNA0KCQkJQzM2OCw1OC43NjksMzU3LjIzMiw0OC4wMDEsMzQ0LDQ4LjAwMXoiLz4NCgk8L2c+DQo8L2c+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTM2MCwyNjQuMDAxYy00LjQyNCwwLTgsMy41ODQtOCw4djI0YzAsNC40MDgtMy41ODQsOC04LDhIMjE2Yy0yLjEyOCwwLTQuMTYsMC44NC01LjY1NiwyLjM0NEwxODQsMzMyLjY4OQ0KCQkJbC0yNi4zNDQtMjYuMzQ0Yy0xLjQ5Ni0xLjUwNC0zLjUyOC0yLjM0NC01LjY1Ni0yLjM0NEgyNGMtNC40MTYsMC04LTMuNTkyLTgtOHYtMjRjMC00LjQxNi0zLjU3Ni04LTgtOHMtOCwzLjU4NC04LDh2MjQNCgkJCWMwLDEzLjIzMiwxMC43NjgsMjQsMjQsMjRoMTI0LjY4OGwyOS42NTYsMjkuNjU2YzEuNTYsMS41NiwzLjYwOCwyLjM0NCw1LjY1NiwyLjM0NGMyLjA0OCwwLDQuMDk2LTAuNzg0LDUuNjU2LTIuMzQ0DQoJCQlsMjkuNjU2LTI5LjY1NkgzNDRjMTMuMjMyLDAsMjQtMTAuNzY4LDI0LTI0di0yNEMzNjgsMjY3LjU4NSwzNjQuNDI0LDI2NC4wMDEsMzYwLDI2NC4wMDF6Ii8+DQoJPC9nPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPC9zdmc+DQo=',
            },
            {
                value:
                    'script',
                label:
                    'Script',
                icon:'data:image/svg+xml;base64,PHN2ZyBpZD0iX3gzMV9weCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjQgMjQiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSI1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTE5LjUgMjRoLTE1Yy0xLjM3OCAwLTIuNS0xLjEyMi0yLjUtMi41di0xOWMwLTEuMzc4IDEuMTIyLTIuNSAyLjUtMi41aDE1YzEuMzc4IDAgMi41IDEuMTIyIDIuNSAyLjV2MTljMCAxLjM3OC0xLjEyMiAyLjUtMi41IDIuNXptLTE1LTIzYy0uODI3IDAtMS41LjY3My0xLjUgMS41djE5YzAgLjgyNy42NzMgMS41IDEuNSAxLjVoMTVjLjgyNyAwIDEuNS0uNjczIDEuNS0xLjV2LTE5YzAtLjgyNy0uNjczLTEuNS0xLjUtMS41eiIvPjxwYXRoIGQ9Im04LjUgMTZjLS4xNjIgMC0uMzItLjA3OC0uNDE3LS4yMjNsLTItM2MtLjExMi0uMTY4LS4xMTItLjM4NyAwLS41NTVsMi0zYy4xNTItLjIzLjQ2Mi0uMjkyLjY5My0uMTM5LjIzLjE1My4yOTIuNDYzLjEzOS42OTNsLTEuODE0IDIuNzI0IDEuODE1IDIuNzIzYy4xNTMuMjMuMDkxLjU0LS4xMzkuNjkzLS4wODUuMDU3LS4xODEuMDg0LS4yNzcuMDg0eiIvPjxwYXRoIGQ9Im0xNS41IDE2Yy0uMDk1IDAtLjE5MS0uMDI3LS4yNzctLjA4NC0uMjMtLjE1My0uMjkyLS40NjMtLjEzOS0uNjkzbDEuODE1LTIuNzIzLTEuODE1LTIuNzIzYy0uMTUzLS4yMy0uMDkxLS41NC4xMzktLjY5M3MuNTQtLjA5Mi42OTMuMTM5bDIgM2MuMTEyLjE2OC4xMTIuMzg3IDAgLjU1NWwtMiAzYy0uMDk2LjE0NC0uMjU1LjIyMi0uNDE2LjIyMnoiLz48cGF0aCBkPSJtMTAuNSAxN2MtLjA1OSAwLS4xMTgtLjAxLS4xNzYtLjAzMi0uMjU4LS4wOTctLjM4OS0uMzg1LS4yOTItLjY0NGwzLThjLjA5Ny0uMjU5LjM4NS0uMzg4LjY0NC0uMjkyLjI1OC4wOTcuMzg5LjM4NS4yOTIuNjQ0bC0zIDhjLS4wNzUuMi0uMjY2LjMyNC0uNDY4LjMyNHoiLz48L3N2Zz4='
            },
            {
                value:
                    'server-monitor',
                label:
                    'Server',
                icon:'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxnPg0KCQkJPHBhdGggZD0iTTQzNy4zMzMsNDA1LjMyM0gyNjYuNjY3Yy01Ljg4OCwwLTEwLjY2Nyw0Ljc3OS0xMC42NjcsMTAuNjY3czQuNzc5LDEwLjY2NywxMC42NjcsMTAuNjY3aDE3MC42NjcNCgkJCQljNS44ODgsMCwxMC42NjctNC43NzksMTAuNjY3LTEwLjY2N1M0NDMuMjIxLDQwNS4zMjMsNDM3LjMzMyw0MDUuMzIzeiIvPg0KCQkJPHBhdGggZD0iTTQzNy4zMzMsNDQ3Ljk4OUgyNjYuNjY3Yy01Ljg4OCwwLTEwLjY2Nyw0Ljc3OS0xMC42NjcsMTAuNjY3YzAsNS44ODgsNC43NzksMTAuNjY3LDEwLjY2NywxMC42NjdoMTcwLjY2Nw0KCQkJCWM1Ljg4OCwwLDEwLjY2Ny00Ljc3OSwxMC42NjctMTAuNjY3QzQ0OCw0NTIuNzY4LDQ0My4yMjEsNDQ3Ljk4OSw0MzcuMzMzLDQ0Ny45ODl6Ii8+DQoJCQk8cGF0aCBkPSJNNzQuNjY3LDQwNS4zMjNjLTE3LjY0MywwLTMyLDE0LjM1Ny0zMiwzMmMwLDE3LjY0MywxNC4zNTcsMzIsMzIsMzJjMTcuNjQzLDAsMzItMTQuMzU3LDMyLTMyDQoJCQkJQzEwNi42NjcsNDE5LjY4LDkyLjMwOSw0MDUuMzIzLDc0LjY2Nyw0MDUuMzIzeiBNNzQuNjY3LDQ0Ny45ODljLTUuODg4LDAtMTAuNjY3LTQuNzc5LTEwLjY2Ny0xMC42NjcNCgkJCQljMC01Ljg4OCw0Ljc3OS0xMC42NjcsMTAuNjY3LTEwLjY2N3MxMC42NjcsNC43NzksMTAuNjY3LDEwLjY2N0M4NS4zMzMsNDQzLjIxMSw4MC41NTUsNDQ3Ljk4OSw3NC42NjcsNDQ3Ljk4OXoiLz4NCgkJCTxwYXRoIGQ9Ik03NC42NjcsMjc3LjMyM2MtMTcuNjQzLDAtMzIsMTQuMzU3LTMyLDMyYzAsMTcuNjQzLDE0LjM1NywzMiwzMiwzMmMxNy42NDMsMCwzMi0xNC4zNTcsMzItMzINCgkJCQlDMTA2LjY2NywyOTEuNjgsOTIuMzA5LDI3Ny4zMjMsNzQuNjY3LDI3Ny4zMjN6IE03NC42NjcsMzE5Ljk4OWMtNS44ODgsMC0xMC42NjctNC43NzktMTAuNjY3LTEwLjY2Nw0KCQkJCXM0Ljc3OS0xMC42NjcsMTAuNjY3LTEwLjY2N3MxMC42NjcsNC43NzksMTAuNjY3LDEwLjY2N1M4MC41NTUsMzE5Ljk4OSw3NC42NjcsMzE5Ljk4OXoiLz4NCgkJCTxwYXRoIGQ9Ik00MzcuMzMzLDE5MS45ODlIMjY2LjY2N2MtNS44ODgsMC0xMC42NjcsNC43NzktMTAuNjY3LDEwLjY2N3M0Ljc3OSwxMC42NjcsMTAuNjY3LDEwLjY2N2gxNzAuNjY3DQoJCQkJYzUuODg4LDAsMTAuNjY3LTQuNzc5LDEwLjY2Ny0xMC42NjdTNDQzLjIyMSwxOTEuOTg5LDQzNy4zMzMsMTkxLjk4OXoiLz4NCgkJCTxwYXRoIGQ9Ik01MTIsMjAyLjY1NnYtNDIuNjY3YzAtMTAuMjQtMy4wNTEtMTkuNzMzLTguMDg1LTI3Ljg4M2MtMC4xNDktMC4yOTktMC4xNzEtMC42NC0wLjM0MS0wLjkxN0w0MzcuNjExLDI1LjE2Mw0KCQkJCUM0MjcuODE5LDkuNDE5LDQxMC44OCwwLjAxMSwzOTIuMzIsMC4wMTFIMTE5Ljc0NGMtMTguNTgxLDAtMzUuNDk5LDkuNDA4LTQ1LjI5MSwyNS4xNTJMOC40OTEsMTMxLjE4OQ0KCQkJCWMtMC4xMDcsMC4xNzEtMC4xMDcsMC4zNjMtMC4yMTMsMC41NTVDMy4xMTUsMTM5Ljk1NywwLDE0OS42LDAsMTU5Ljk4OXY0Mi42NjdjMCwxNy40OTMsOC41OTcsMzIuOTM5LDIxLjY3NSw0Mi42NjcNCgkJCQlDOC41OTcsMjU1LjA3MiwwLDI3MC40OTYsMCwyODcuOTg5djQyLjY2N2MwLDE3LjQ5Myw4LjU5NywzMi45MzksMjEuNjc1LDQyLjY2N0M4LjU5NywzODMuMDcyLDAsMzk4LjQ5NiwwLDQxNS45ODl2NDIuNjY3DQoJCQkJYzAsMjkuMzk3LDIzLjkzNiw1My4zMzMsNTMuMzMzLDUzLjMzM2g0MDUuMzMzYzI5LjM5NywwLDUzLjMzMy0yMy45MzYsNTMuMzMzLTUzLjMzM3YtNDIuNjY3DQoJCQkJYzAtMTcuNDkzLTguNTk3LTMyLjkzOS0yMS42NzUtNDIuNjY3QzUwMy40MDMsMzYzLjU5NSw1MTIsMzQ4LjE0OSw1MTIsMzMwLjY1NnYtNDIuNjY3YzAtMTcuNDkzLTguNTk3LTMyLjkzOS0yMS42NzUtNDIuNjY3DQoJCQkJQzUwMy40MDMsMjM1LjU5NSw1MTIsMjIwLjE3MSw1MTIsMjAyLjY1NnogTTkyLjU2NSwzNi40MjdjNS44NjctOS40NTEsMTYuMDIxLTE1LjEwNCwyNy4xNTctMTUuMTA0aDI3Mi41NzYNCgkJCQljMTEuMTM2LDAsMjEuMjkxLDUuNjUzLDI3LjE1NywxNS4xMDRsNDQuMDExLDcwLjcyYy0xLjYtMC4xNDktMy4xNTctMC40OTEtNC44LTAuNDkxSDUzLjMzM2MtMS42NDMsMC0zLjE3OSwwLjM0MS00Ljc3OSwwLjQ5MQ0KCQkJCUw5Mi41NjUsMzYuNDI3eiBNNDkwLjY2Nyw0MTUuOTg5djQyLjY2N2MwLDE3LjY0My0xNC4zNTcsMzItMzIsMzJINTMuMzMzYy0xNy42NDMsMC0zMi0xNC4zNTctMzItMzJ2LTQyLjY2Nw0KCQkJCWMwLTE3LjY0MywxNC4zNTctMzIsMzItMzJoNDA1LjMzM0M0NzYuMzA5LDM4My45ODksNDkwLjY2NywzOTguMzQ3LDQ5MC42NjcsNDE1Ljk4OXogTTQ5MC42NjcsMjg3Ljk4OXY0Mi42NjcNCgkJCQljMCwxNy42NDMtMTQuMzU3LDMyLTMyLDMySDUzLjMzM2MtMTcuNjQzLDAtMzItMTQuMzU3LTMyLTMydi00Mi42NjdjMC0xNy42NDMsMTQuMzU3LTMyLDMyLTMyaDQwNS4zMzMNCgkJCQlDNDc2LjMwOSwyNTUuOTg5LDQ5MC42NjcsMjcwLjM0Nyw0OTAuNjY3LDI4Ny45ODl6IE00OTAuNjY3LDIwMi42NTZjMCwxNy42NDMtMTQuMzU3LDMyLTMyLDMySDUzLjMzM2MtMTcuNjQzLDAtMzItMTQuMzU3LTMyLTMyDQoJCQkJdi00Mi42NjdjMC0xNy42NDMsMTQuMzU3LTMyLDMyLTMyaDQwNS4zMzNjMTcuNjQzLDAsMzIsMTQuMzU3LDMyLDMyVjIwMi42NTZ6Ii8+DQoJCQk8cGF0aCBkPSJNNDM3LjMzMywxNDkuMzIzSDI2Ni42NjdjLTUuODg4LDAtMTAuNjY3LDQuNzc5LTEwLjY2NywxMC42NjdzNC43NzksMTAuNjY3LDEwLjY2NywxMC42NjdoMTcwLjY2Nw0KCQkJCWM1Ljg4OCwwLDEwLjY2Ny00Ljc3OSwxMC42NjctMTAuNjY3UzQ0My4yMjEsMTQ5LjMyMyw0MzcuMzMzLDE0OS4zMjN6Ii8+DQoJCQk8cGF0aCBkPSJNNDM3LjMzMywzMTkuOTg5SDI2Ni42NjdjLTUuODg4LDAtMTAuNjY3LDQuNzc5LTEwLjY2NywxMC42NjdzNC43NzksMTAuNjY3LDEwLjY2NywxMC42NjdoMTcwLjY2Nw0KCQkJCWM1Ljg4OCwwLDEwLjY2Ny00Ljc3OSwxMC42NjctMTAuNjY3UzQ0My4yMjEsMzE5Ljk4OSw0MzcuMzMzLDMxOS45ODl6Ii8+DQoJCQk8cGF0aCBkPSJNNDM3LjMzMywyNzcuMzIzSDI2Ni42NjdjLTUuODg4LDAtMTAuNjY3LDQuNzc5LTEwLjY2NywxMC42NjdzNC43NzksMTAuNjY3LDEwLjY2NywxMC42NjdoMTcwLjY2Nw0KCQkJCWM1Ljg4OCwwLDEwLjY2Ny00Ljc3OSwxMC42NjctMTAuNjY3UzQ0My4yMjEsMjc3LjMyMyw0MzcuMzMzLDI3Ny4zMjN6Ii8+DQoJCQk8cGF0aCBkPSJNNzQuNjY3LDE0OS4zMjNjLTE3LjY0MywwLTMyLDE0LjM1Ny0zMiwzMmMwLDE3LjY0MywxNC4zNTcsMzIsMzIsMzJjMTcuNjQzLDAsMzItMTQuMzU3LDMyLTMyDQoJCQkJQzEwNi42NjcsMTYzLjY4LDkyLjMwOSwxNDkuMzIzLDc0LjY2NywxNDkuMzIzeiBNNzQuNjY3LDE5MS45ODljLTUuODg4LDAtMTAuNjY3LTQuNzc5LTEwLjY2Ny0xMC42NjcNCgkJCQlzNC43NzktMTAuNjY3LDEwLjY2Ny0xMC42NjdzMTAuNjY3LDQuNzc5LDEwLjY2NywxMC42NjdTODAuNTU1LDE5MS45ODksNzQuNjY3LDE5MS45ODl6Ii8+DQoJCTwvZz4NCgk8L2c+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==',
            },
            {
                value:
                    'incomingHttpRequest',
                label:
                    'Incoming Request',
                icon:'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDY5LjMzMyA0NjkuMzMzIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0NjkuMzMzIDQ2OS4zMzM7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxnPg0KCQk8Zz4NCgkJCTxwb2x5Z29uIHBvaW50cz0iNzQuNjY3LDIxMy4zMzMgMzIsMjEzLjMzMyAzMiwxNzAuNjY3IDAsMTcwLjY2NyAwLDI5OC42NjcgMzIsMjk4LjY2NyAzMiwyNDUuMzMzIDc0LjY2NywyNDUuMzMzIA0KCQkJCTc0LjY2NywyOTguNjY3IDEwNi42NjcsMjk4LjY2NyAxMDYuNjY3LDE3MC42NjcgNzQuNjY3LDE3MC42NjcgCQkJIi8+DQoJCQk8cG9seWdvbiBwb2ludHM9IjEyOCwyMDIuNjY3IDE2MCwyMDIuNjY3IDE2MCwyOTguNjY3IDE5MiwyOTguNjY3IDE5MiwyMDIuNjY3IDIyNCwyMDIuNjY3IDIyNCwxNzAuNjY3IDEyOCwxNzAuNjY3IAkJCSIvPg0KCQkJPHBvbHlnb24gcG9pbnRzPSIyNDUuMzMzLDIwMi42NjcgMjc3LjMzMywyMDIuNjY3IDI3Ny4zMzMsMjk4LjY2NyAzMDkuMzMzLDI5OC42NjcgMzA5LjMzMywyMDIuNjY3IDM0MS4zMzMsMjAyLjY2NyANCgkJCQkzNDEuMzMzLDE3MC42NjcgMjQ1LjMzMywxNzAuNjY3IAkJCSIvPg0KCQkJPHBhdGggZD0iTTQzNy4zMzMsMTcwLjY2N2gtNzQuNjY3djEyOGgzMlYyNTZoNDIuNjY3YzE4LjEzMywwLDMyLTEzLjg2NywzMi0zMnYtMjEuMzMzDQoJCQkJQzQ2OS4zMzMsMTg0LjUzMyw0NTUuNDY3LDE3MC42NjcsNDM3LjMzMywxNzAuNjY3eiBNNDM3LjMzMywyMjRoLTQyLjY2N3YtMjEuMzMzaDQyLjY2N1YyMjR6Ii8+DQoJCTwvZz4NCgk8L2c+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==',
            },
        ];


        return (
            <div className="Box-root Margin-bottom--12">
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>
                                        <ShouldRender if={!this.props.edit}>
                                            <span>New Monitor</span>
                                        </ShouldRender>

                                        <ShouldRender if={this.props.edit}>
                                            <span>
                                                Edit Monitor
                                                {this.props.editMonitorProp &&
                                                this.props.editMonitorProp.name
                                                    ? ' - ' +
                                                      this.props.editMonitorProp
                                                          .name
                                                    : null}
                                            </span>
                                        </ShouldRender>
                                    </span>
                                </span>
                                <p>
                                    <ShouldRender if={!this.props.edit}>
                                        <span>
                                            Monitor any resources (Websites,
                                            API, Servers, IoT Devices and more)
                                            constantly and notify your team when
                                            they do not behave the way you want.
                                        </span>
                                    </ShouldRender>
                                    <ShouldRender if={this.props.edit}>
                                        <span>
                                            Edit Name and URL of
                                            {this.props.editMonitorProp &&
                                            this.props.editMonitorProp.name
                                                ? ` ${this.props.editMonitorProp.name}`
                                                : ''}
                                        </span>
                                    </ShouldRender>
                                </p>
                            </div>
                        </div>

                        <form
                            id="form-new-monitor"
                            onSubmit={handleSubmit(this.submitForm)}
                        >
                            <div
                                className="bs-ContentSection-content Box-root Box-background--offset Box-divider--surface-bottom-1 Padding-vertical--2"
                                style={{ boxShadow: 'none' }}
                            >
                                <div>
                                    <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                        <fieldset className="bs-Fieldset">
                                            <div className="bs-Fieldset-rows">
                                            <div className="bs-ContentSection-content Box-root  Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                                                <div className="Box-root">
                                                    <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                                        <span>Basic Configuration</span>
                                                    </span>
                                                    <p>
                                                        <span>
                                                            Basic Configuration for your new Monitor.
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                                <div className="bs-Fieldset-row">
                                                    <label className="bs-Fieldset-label">
                                                        Name
                                                    </label>
                                                    <div className="bs-Fieldset-fields">
                                                        <Field
                                                            className="db-BusinessSettings-input TextInput bs-TextInput"
                                                            component={
                                                                RenderField
                                                            }
                                                            type="text"
                                                            name={`name_${this.props.index}`}
                                                            id="name"
                                                            placeholder="Home Page"
                                                            disabled={
                                                                requesting
                                                            }
                                                            validate={
                                                                ValidateField.text
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <ShouldRender
                                                    if={
                                                        resourceCategoryList &&
                                                        resourceCategoryList.length >
                                                            0
                                                    }
                                                >
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Resource Category
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <span className="flex">
                                                                <Field
                                                                    className="db-select-nw"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name={`resourceCategory_${this.props.index}`}
                                                                    id="resourceCategory"
                                                                    placeholder="Choose Resource Category"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    options={[
                                                                        {
                                                                            value:
                                                                                '',
                                                                            label:
                                                                                'Select resource category',
                                                                        },
                                                                        ...(resourceCategoryList &&
                                                                        resourceCategoryList.length >
                                                                            0
                                                                            ? resourceCategoryList.map(
                                                                                  category => ({
                                                                                      value:
                                                                                          category._id,
                                                                                      label:
                                                                                          category.name,
                                                                                  })
                                                                              )
                                                                            : []),
                                                                    ]}
                                                                />
                                                                <Tooltip title="Resource Category">
                                                                    <div>
                                                                        <p>
                                                                            Resource
                                                                            Categories
                                                                            lets
                                                                            you
                                                                            group
                                                                            resources
                                                                            by
                                                                            categories
                                                                            on
                                                                            Status
                                                                            Page.
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={!this.props.edit}
                                                >
                                                    <div className="bs-Fieldset-row" style={{
                                                                            marginTop:'30px',                                                                       
                                                                        }}>
                                                        <label className="bs-Fieldset-label">
                                                        What would you like to monitor?
                                                        </label>

                                                        <div className="radio-field">
                                                            <span className="flex">
                                                            <div className="monitor-type-grid">
                                                                {monitorTypesOptions.map((el)=>(
                                                                        <label
                                                                        key={el.value}
                                                                        htmlFor={el.value}
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        <div className={`radio-field Flex-justifyContent--center monitor-type-item Box-background--white`}
                                                                        style={{
                                                                            flex: 1,
                                                                            padding: 0,   
                                                                            flexDirection:'row',
                                                                            cursor: 'pointer',
                                                                            border:`1px solid ${(this.props.type === el.value)?'black':'rgba(0,0,0,0.2)'}`,
                                                                            borderRadius: '5px',
                                                                            //textAlign:'center',                                                             
                                                                        }}> 
                                                                        <div
                                                                            //className="radioButtonClass"
                                                                            style={{ height: '100%', display: 'flex',
                                                                            justifyContent: 'center',
                                                                            color: '#4c4c4c', }}
                                                                        >
                                                                            <Field
                                                                                required={true}
                                                                                component="input"
                                                                                type="radio"
                                                                                id={el.value}
                                                                                name={`type_${this.props.index}`}
                                                                                className="Margin-left--4 Margin-top--4"
                                                                                validate={
                                                                                    ValidateField.select
                                                                                }
                                                                                disabled={
                                                                                    requesting
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                    v
                                                                                ) => {                                                                                    
                                                                                    this.changeBox(
                                                                                        e,
                                                                                        v
                                                                                    )
                                                                                }
                                                                                }
                                                                                value={el.value}
                                                                            />
                                                                        </div>                                                                          
                                                                            <span
                                                                            style={{
                                                                                display:'flex',
                                                                                flexDirection:'column',
                                                                                alignItems:'center',
                                                                                paddingTop:'13%',
                                                                                paddingRight:'13%',
                                                                                paddingBottom:'13%',
                                                                            }}
                                                                            >
                                                                                <img src={el.icon}
                                                                            style={{
                                                                                width:'70%',
                                                                                height:'100%',                                                                              
                                                                            }}/>
                                                                            <span style={{
                                                                               marginTop:'13%',
                                                                               //alignItems:'center',                                                                              
                                                                            }}>
                                                                                {el.label}
                                                                            </span>
                                                                            </span>                                                                            
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>                                                                                                                                        
                                                                <Tooltip title="Monitor Types">
                                                                    <div>
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                What
                                                                                are
                                                                                monitors?
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            Monitors
                                                                            lets
                                                                            you
                                                                            monitor
                                                                            any
                                                                            reosurces
                                                                            you
                                                                            have
                                                                            like
                                                                            API&#39;s,
                                                                            Websites,
                                                                            Servers,
                                                                            Containers,
                                                                            IoT
                                                                            device
                                                                            or
                                                                            more.{' '}
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                Website
                                                                                Monitors
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            Monitor
                                                                            your
                                                                            website
                                                                            and
                                                                            get
                                                                            notified
                                                                            when
                                                                            it
                                                                            goes
                                                                            down
                                                                            or
                                                                            performs
                                                                            poorly.
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                IoT
                                                                                Device
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            Monitor
                                                                            IoT
                                                                            devices
                                                                            constantly
                                                                            and
                                                                            notify
                                                                            your
                                                                            team
                                                                            when
                                                                            they
                                                                            do
                                                                            not
                                                                            behave
                                                                            the
                                                                            way
                                                                            you
                                                                            want.{' '}
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                Manual
                                                                                Monitors
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            <>
                                                                                Manual
                                                                                monitors
                                                                                do
                                                                                not
                                                                                monitor
                                                                                any
                                                                                resource.
                                                                                You
                                                                                can
                                                                                change
                                                                                monitor
                                                                                status
                                                                                by
                                                                                using{' '}
                                                                                <a href="https://fyipe.com/docs">
                                                                                    Fyipe’s
                                                                                    API
                                                                                </a>

                                                                                .
                                                                                This
                                                                                is
                                                                                helpful
                                                                                when
                                                                                you
                                                                                use
                                                                                different
                                                                                monitoring
                                                                                tool
                                                                                but
                                                                                want
                                                                                to
                                                                                record
                                                                                monitor
                                                                                status
                                                                                on
                                                                                Fyipe.
                                                                            </>{' '}
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                API
                                                                                Monitor
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            <>
                                                                                Monitor{' '}
                                                                                <a href="https://en.wikipedia.org/wiki/Representational_state_transfer">
                                                                                    REST
                                                                                </a>{' '}
                                                                                endpoints
                                                                                constantly
                                                                                and
                                                                                notify
                                                                                your
                                                                                team
                                                                                when
                                                                                they
                                                                                do
                                                                                not
                                                                                behave
                                                                                the
                                                                                way
                                                                                you
                                                                                want.
                                                                            </>{' '}
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                Script
                                                                                Monitor
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            Run
                                                                            custom
                                                                            JavaScript
                                                                            script
                                                                            and
                                                                            alerts
                                                                            you
                                                                            when
                                                                            script
                                                                            fails.
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                Server
                                                                                Monitor
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            Monitor
                                                                            servers
                                                                            constantly
                                                                            and
                                                                            notify
                                                                            your
                                                                            team
                                                                            when
                                                                            they
                                                                            do
                                                                            not
                                                                            behave
                                                                            the
                                                                            way
                                                                            you
                                                                            want.
                                                                        </p>
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <p>
                                                                            {' '}
                                                                            <b>
                                                                                Incoming
                                                                                HTTP
                                                                                Request
                                                                            </b>
                                                                        </p>
                                                                        <p>
                                                                            {' '}
                                                                            Receives
                                                                            incoming
                                                                            HTTP
                                                                            get
                                                                            or
                                                                            post
                                                                            request
                                                                            and
                                                                            evaluates
                                                                            response
                                                                            body.
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                            </span>
                                                            <span
                                                                className="Text-color--inherit Text-display--inline Text-lineHeight--24 Text-typeface--base Text-wrap--wrap"
                                                                style={{
                                                                    marginTop: 10,
                                                                }}
                                                            >
                                                                <span>
                                                                    {
                                                                        this
                                                                            .monitorTypeDescription[
                                                                            [
                                                                                this
                                                                                    .state
                                                                                    .type,
                                                                            ]
                                                                        ]
                                                                    }
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ShouldRender>

                                                <ShouldRender
                                                    if={
                                                        type ===
                                                            'server-monitor' &&
                                                        !this.props.edit
                                                    }
                                                >
                                                {this.renderMonitorConfiguration("Server")}                                                    
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Mode
                                                        </label>

                                                        <div className="bs-Fieldset-fields">
                                                            <span className="flex">
                                                                <Field
                                                                    className="db-select-nw"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name={`mode_${this.props.index}`}
                                                                    id="mode"
                                                                    placeholder="Mode"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                        v
                                                                    ) =>
                                                                        this.changeMode(
                                                                            e,
                                                                            v
                                                                        )
                                                                    }
                                                                    validate={
                                                                        ValidateField.select
                                                                    }
                                                                    options={[
                                                                        {
                                                                            value:
                                                                                '',
                                                                            label:
                                                                                'Select monitoring mode',
                                                                        },
                                                                        {
                                                                            value:
                                                                                'agent',
                                                                            label:
                                                                                'Agent',
                                                                        },
                                                                        {
                                                                            value:
                                                                                'agentless',
                                                                            label:
                                                                                'Agentless',
                                                                        },
                                                                    ]}
                                                                ></Field>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <ShouldRender
                                                        if={
                                                            mode === 'agentless'
                                                        }
                                                    >
                                                        <div className="bs-Fieldset-row">
                                                            <label className="bs-Fieldset-label">
                                                                Host
                                                            </label>
                                                            <div className="bs-Fieldset-fields">
                                                                <Field
                                                                    className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                    component={
                                                                        RenderField
                                                                    }
                                                                    type="text"
                                                                    name={`host_${this.props.index}`}
                                                                    id="host"
                                                                    placeholder="example.compute-1.amazonaws.com"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    validate={
                                                                        ValidateField.text
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="bs-Fieldset-row">
                                                            <label className="bs-Fieldset-label">
                                                                Port
                                                            </label>
                                                            <div className="bs-Fieldset-fields">
                                                                <Field
                                                                    className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                    component={
                                                                        RenderField
                                                                    }
                                                                    type="text"
                                                                    name={`port_${this.props.index}`}
                                                                    id="port"
                                                                    placeholder="22"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    validate={
                                                                        ValidateField.text
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="bs-Fieldset-row">
                                                            <label className="bs-Fieldset-label">
                                                                Username
                                                            </label>
                                                            <div className="bs-Fieldset-fields">
                                                                <Field
                                                                    className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                    component={
                                                                        RenderField
                                                                    }
                                                                    type="text"
                                                                    name={`username_${this.props.index}`}
                                                                    id="username"
                                                                    placeholder="root"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    validate={
                                                                        ValidateField.text
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="bs-Fieldset-row">
                                                            <label className="bs-Fieldset-label">
                                                                Authentication
                                                                Method
                                                            </label>

                                                            <div className="bs-Fieldset-fields">
                                                                <span className="flex">
                                                                    <Field
                                                                        className="db-select-nw"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name={`authentication_${this.props.index}`}
                                                                        id="authentication"
                                                                        placeholder="Authentication Method"
                                                                        disabled={
                                                                            requesting
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                            v
                                                                        ) =>
                                                                            this.changeAuthentication(
                                                                                e,
                                                                                v
                                                                            )
                                                                        }
                                                                        validate={
                                                                            ValidateField.select
                                                                        }
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    '',
                                                                                label:
                                                                                    'Select authentication method',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'password',
                                                                                label:
                                                                                    'Password',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'identityFile',
                                                                                label:
                                                                                    'Identity File',
                                                                            },
                                                                        ]}
                                                                    ></Field>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <ShouldRender
                                                            if={
                                                                authentication ===
                                                                'password'
                                                            }
                                                        >
                                                            <div className="bs-Fieldset-row">
                                                                <label className="bs-Fieldset-label">
                                                                    Password
                                                                </label>
                                                                <div className="bs-Fieldset-fields">
                                                                    <Field
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        component={
                                                                            RenderField
                                                                        }
                                                                        type="password"
                                                                        name={`password_${this.props.index}`}
                                                                        id="password"
                                                                        placeholder="Password"
                                                                        disabled={
                                                                            requesting
                                                                        }
                                                                        validate={
                                                                            ValidateField.text
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        </ShouldRender>

                                                        <ShouldRender
                                                            if={
                                                                authentication ===
                                                                'identityFile'
                                                            }
                                                        >
                                                            <div className="bs-Fieldset-row">
                                                                <label className="bs-Fieldset-label">
                                                                    Identity
                                                                    File
                                                                </label>
                                                                <div className="bs-Fieldset-fields">
                                                                    <div
                                                                        className="Box-root Flex-flex Flex-alignItems--center"
                                                                        style={{
                                                                            flexWrap:
                                                                                'wrap',
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <label
                                                                                className="bs-Button bs-DeprecatedButton bs-FileUploadButton"
                                                                                type="button"
                                                                            >
                                                                                <ShouldRender
                                                                                    if={
                                                                                        !identityFile
                                                                                    }
                                                                                >
                                                                                    <span className="bs-Button--icon bs-Button--new"></span>
                                                                                    <span>
                                                                                        Upload
                                                                                        Identity
                                                                                        File
                                                                                    </span>
                                                                                </ShouldRender>
                                                                                <ShouldRender
                                                                                    if={
                                                                                        identityFile
                                                                                    }
                                                                                >
                                                                                    <span className="bs-Button--icon bs-Button--edit"></span>
                                                                                    <span>
                                                                                        Change
                                                                                        Identity
                                                                                        File
                                                                                    </span>
                                                                                </ShouldRender>
                                                                                <div className="bs-FileUploadButton-inputWrap">
                                                                                    <Field
                                                                                        className="bs-FileUploadButton-input"
                                                                                        component={
                                                                                            UploadFile
                                                                                        }
                                                                                        name={`identityFile_${this.props.index}`}
                                                                                        id="identityFile"
                                                                                        accept=".pem, .ppk"
                                                                                        onChange={
                                                                                            this
                                                                                                .changeFile
                                                                                        }
                                                                                        fileInputKey={
                                                                                            fileInputKey
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </label>
                                                                        </div>
                                                                        <ShouldRender
                                                                            if={
                                                                                identityFile
                                                                            }
                                                                        >
                                                                            <div
                                                                                className="bs-Fieldset-fields"
                                                                                style={{
                                                                                    padding:
                                                                                        '0',
                                                                                }}
                                                                            >
                                                                                <button
                                                                                    className="bs-Button bs-DeprecatedButton bs-FileUploadButton"
                                                                                    type="button"
                                                                                    onClick={
                                                                                        this
                                                                                            .removeFile
                                                                                    }
                                                                                    style={{
                                                                                        margin:
                                                                                            '10px 10px 0 0',
                                                                                    }}
                                                                                >
                                                                                    <span className="bs-Button--icon bs-Button--delete"></span>
                                                                                    <span>
                                                                                        Remove
                                                                                        Identity
                                                                                        File
                                                                                    </span>
                                                                                </button>
                                                                            </div>
                                                                        </ShouldRender>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </ShouldRender>
                                                    </ShouldRender>
                                                </ShouldRender>

                                                <ShouldRender
                                                    if={type === 'api'}
                                                >   
                                                    {this.renderMonitorConfiguration("API")}
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            HTTP Method
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <Field
                                                                className="db-select-nw"
                                                                component={
                                                                    RenderSelect
                                                                }
                                                                name={`method_${this.props.index}`}
                                                                id="method"
                                                                placeholder="Http Method"
                                                                disabled={
                                                                    requesting
                                                                }
                                                                validate={
                                                                    ValidateField.select
                                                                }
                                                                options={[
                                                                    {
                                                                        value:
                                                                            '',
                                                                        label:
                                                                            'Select method',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'get',
                                                                        label:
                                                                            'GET',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'post',
                                                                        label:
                                                                            'POST',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'put',
                                                                        label:
                                                                            'PUT',
                                                                    },
                                                                    {
                                                                        value:
                                                                            'delete',
                                                                        label:
                                                                            'DELETE',
                                                                    },
                                                                ]}
                                                                style={{
                                                                    height:
                                                                        '28px',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            URL
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <Field
                                                                className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                component={
                                                                    RenderField
                                                                }
                                                                type="url"
                                                                name={`url_${this.props.index}`}
                                                                id="url"
                                                                placeholder={`https://mywebsite.com${
                                                                    type ===
                                                                    'api'
                                                                        ? '/api'
                                                                        : ''
                                                                }`}
                                                                disabled={
                                                                    requesting
                                                                }
                                                                validate={[
                                                                    ValidateField.required,
                                                                    ValidateField.url,
                                                                ]}
                                                            />
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        type === 'url'
                                                    }
                                                >   
                                                    {this.renderMonitorConfiguration("Website")}
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            URL
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <Field
                                                                className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                component={
                                                                    RenderField
                                                                }
                                                                type="url"
                                                                name={`url_${this.props.index}`}
                                                                id="url"
                                                                placeholder={`https://mywebsite.com${
                                                                    type ===
                                                                    'api'
                                                                        ? '/api'
                                                                        : ''
                                                                }`}
                                                                disabled={
                                                                    requesting
                                                                }
                                                                validate={[
                                                                    ValidateField.required,
                                                                    ValidateField.url,
                                                                ]}
                                                            />
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        type ===
                                                        'incomingHttpRequest'
                                                    }
                                                >   
                                                    {this.renderMonitorConfiguration("Incoming HTTP Request")}
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Incoming URL
                                                        </label>
                                                        <div
                                                            className="bs-Fieldset-fields"
                                                            style={{
                                                                paddingTop:
                                                                    '7px',
                                                            }}
                                                        >
                                                            <a
                                                                href={
                                                                    httpRequestLink
                                                                }
                                                            >
                                                                {
                                                                    httpRequestLink
                                                                }
                                                            </a>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={type === 'manual'}
                                                >
                                                    {this.renderMonitorConfiguration("Manual")}
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Description
                                                            (optional)
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <Field
                                                                className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                component={
                                                                    RenderField
                                                                }
                                                                type="text"
                                                                name={`description_${this.props.index}`}
                                                                id="description"
                                                                placeholder="Home Page's Monitor"
                                                                disabled={
                                                                    requesting
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                {type === 'device' && (
                                                    <div>                                                        
                                                        {this.renderMonitorConfiguration("IOT Device")}   
                                                        <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Device ID
                                                        </label>
                                                            <div className="bs-Fieldset-fields">
                                                                <Field
                                                                    className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                    component={
                                                                        RenderField
                                                                    }
                                                                    type="deviceId"
                                                                    name={`deviceId_${this.props.index}`}
                                                                    id="deviceId"
                                                                    placeholder="of234dfgqwe"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    validate={
                                                                        ValidateField.required
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>                                                    
                                                )}
                                                <ShouldRender
                                                    if={type === 'script'}
                                                >   
                                                    {this.renderMonitorConfiguration("Script")}
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Script
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <span>
                                                                <span>
                                                                    <AceEditor
                                                                        placeholder="Enter script here"
                                                                        mode="javascript"
                                                                        theme="github"
                                                                        value={
                                                                            this
                                                                                .state
                                                                                .script
                                                                        }
                                                                        style={{
                                                                            backgroundColor:
                                                                                '#fff',
                                                                            borderRadius:
                                                                                '4px',
                                                                            boxShadow:
                                                                                '0 0 0 1px rgba(50, 50, 93, 0.16), 0 0 0 1px rgba(50, 151, 211, 0), 0 0 0 2px rgba(50, 151, 211, 0), 0 1px 1px rgba(0, 0, 0, 0.08)',
                                                                        }}
                                                                        name={`script_${this.props.index}`}
                                                                        id="script"
                                                                        editorProps={{
                                                                            $blockScrolling: true,
                                                                        }}
                                                                        setOptions={{
                                                                            enableBasicAutocompletion: true,
                                                                            enableLiveAutocompletion: true,
                                                                            enableSnippets: true,
                                                                            showGutter: false,
                                                                        }}
                                                                        height="150px"
                                                                        highlightActiveLine={
                                                                            true
                                                                        }
                                                                        onChange={
                                                                            this
                                                                                .scriptTextChange
                                                                        }
                                                                    />
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        schedules &&
                                                        schedules.length > 0
                                                    }
                                                >
                                                <div className="bs-ContentSection-content Box-root  Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                                                    <div className="Box-root">
                                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                                            <span>Call Schedules</span>
                                                        </span>
                                                        <p>
                                                            <span>
                                                            Set the configuration for your Monitor's Call Schedules.
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Call Schedule
                                                        </label>
                                                        <div className="bs-Fieldset-fields">
                                                            <span className="flex">
                                                                <Field
                                                                    className="db-select-nw"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name={`callSchedule_${this.props.index}`}
                                                                    id="callSchedule"
                                                                    placeholder="Call Schedule"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    style={{
                                                                        height:
                                                                            '28px',
                                                                    }}
                                                                    options={[
                                                                        {
                                                                            value:
                                                                                '',
                                                                            label:
                                                                                'Select call schedule',
                                                                        },
                                                                        ...(schedules &&
                                                                        schedules.length >
                                                                            0
                                                                            ? schedules.map(
                                                                                  schedule => ({
                                                                                      value:
                                                                                          schedule._id,
                                                                                      label:
                                                                                          schedule.name,
                                                                                  })
                                                                              )
                                                                            : []),
                                                                    ]}
                                                                />
                                                                <Tooltip title="Call Schedule">
                                                                    <div>
                                                                        <p>
                                                                            Call
                                                                            Schedules
                                                                            let's
                                                                            you
                                                                            connect
                                                                            your
                                                                            team
                                                                            members
                                                                            to
                                                                            specific
                                                                            monitors,
                                                                            so
                                                                            only
                                                                            on-duty
                                                                            members
                                                                            who
                                                                            are
                                                                            responsible
                                                                            for
                                                                            certain
                                                                            monitors
                                                                            are
                                                                            alerted
                                                                            when
                                                                            an
                                                                            incident
                                                                            is
                                                                            created.
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        this.props.monitorSlas
                                                            .length > 0
                                                    }
                                                >
                                                <div className="bs-ContentSection-content Box-root  Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                                                    <div className="Box-root">
                                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                                            <span>Service Level Agreement</span>
                                                        </span>
                                                        <p>
                                                            <span>
                                                                Select the SLAs for your new Monitor.
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Monitor SLA
                                                        </label>

                                                        <div className="bs-Fieldset-fields">
                                                            <span className="flex">
                                                                {this.props
                                                                    .edit ? (
                                                                    <Field
                                                                        className="db-select-nw"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="monitorSla"
                                                                        id="monitorSla"
                                                                        placeholder="Monitor SLA"
                                                                        disabled={
                                                                            requesting
                                                                        }
                                                                        options={[
                                                                            ...this.props.monitorSlas.map(
                                                                                sla => ({
                                                                                    value:
                                                                                        sla._id,
                                                                                    label:
                                                                                        sla.name,
                                                                                })
                                                                            ),
                                                                        ]}
                                                                    />
                                                                ) : (
                                                                    <Field
                                                                        className="db-select-nw"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="monitorSla"
                                                                        id="monitorSla"
                                                                        placeholder="Monitor SLA"
                                                                        disabled={
                                                                            requesting
                                                                        }
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    '',
                                                                                label:
                                                                                    'Select Monitor SLA',
                                                                            },
                                                                            ...this.props.monitorSlas.map(
                                                                                sla => ({
                                                                                    value:
                                                                                        sla._id,
                                                                                    label:
                                                                                        sla.name,
                                                                                })
                                                                            ),
                                                                        ]}
                                                                    />
                                                                )}

                                                                <Tooltip title="Monitor SLA">
                                                                    <div>
                                                                        <p>
                                                                            SLA
                                                                            is
                                                                            used
                                                                            to
                                                                            make
                                                                            sure
                                                                            your
                                                                            monitors
                                                                            provide
                                                                            a
                                                                            certain
                                                                            reliability
                                                                            of
                                                                            service.
                                                                            We’ll
                                                                            alert
                                                                            your
                                                                            team
                                                                            when
                                                                            a
                                                                            particular
                                                                            monitor
                                                                            is
                                                                            about
                                                                            to
                                                                            breach
                                                                            it’s
                                                                            SLA.
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        this.props.incidentSlas
                                                            .length > 0
                                                    }
                                                >
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label">
                                                            Incident
                                                            Communication SLA
                                                        </label>

                                                        <div className="bs-Fieldset-fields">
                                                            <span className="flex">
                                                            {
                                                                this.props.edit ? (<Field
                                                                    className="db-select-nw"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name="incidentCommunicationSla"
                                                                    id="incidentCommunicationSla"
                                                                    placeholder="Incident Communication SLA"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    options={[
                                                                        ...this.props.incidentSlas.map(sla => ({
                                                                            value: sla._id,
                                                                            label: sla.name,
                                                                        }))
                                                                    ]}
                                                                />) : (<Field
                                                                    className="db-select-nw"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name="incidentCommunicationSla"
                                                                    id="incidentCommunicationSla"
                                                                    placeholder="Incident Communication SLA"
                                                                    disabled={
                                                                        requesting
                                                                    }
                                                                    options={[
                                                                        {
                                                                            value:
                                                                                '',
                                                                            label:
                                                                                'Select Incident Communication SLA',
                                                                        },
                                                                        ...this.props.incidentSlas.map(
                                                                            sla => ({
                                                                                value:
                                                                                    sla._id,
                                                                                label:
                                                                                    sla.name,
                                                                            })
                                                                        ),
                                                                    ]}
                                                                />)
                                                            }
                                                                
                                                                <Tooltip title="Incident Communication SLA">
                                                                    <div>
                                                                        <p>
                                                                            Incident
                                                                            communication
                                                                            SLA
                                                                            is
                                                                            used
                                                                            to
                                                                            make
                                                                            sure
                                                                            you
                                                                            keep
                                                                            you
                                                                            customers
                                                                            updated
                                                                            every
                                                                            few
                                                                            minutes
                                                                            on
                                                                            an
                                                                            active
                                                                            incident.
                                                                            Your
                                                                            team
                                                                            will
                                                                            get
                                                                            an
                                                                            email
                                                                            reminder
                                                                            when
                                                                            you
                                                                            forget
                                                                            to
                                                                            update
                                                                            an
                                                                            incident
                                                                            status,
                                                                            this
                                                                            will
                                                                            help
                                                                            you
                                                                            to
                                                                            communicate
                                                                            with
                                                                            your
                                                                            customers
                                                                            on
                                                                            time
                                                                            and
                                                                            keep
                                                                            them
                                                                            updated.
                                                                        </p>
                                                                    </div>
                                                                </Tooltip>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        type &&
                                                        (type === 'api' ||
                                                            type === 'url' ||
                                                            type ===
                                                                'server-monitor' ||
                                                            type === 'script' ||
                                                            type ===
                                                                'incomingHttpRequest') &&
                                                        !this.state.advance
                                                    }
                                                >
                                                <div className="bs-ContentSection-content Box-root  Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                                                    <div className="Box-root">
                                                        <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                                            <span>Advanced</span>
                                                        </span>
                                                        <p>
                                                            <span>
                                                                Advanced Configuration settings for your new Monitor.
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                    <div className="bs-Fieldset-row">
                                                        <label className="bs-Fieldset-label"></label>
                                                        <div className="bs-Fieldset-fields">
                                                            <button
                                                                id="advanceOptions"
                                                                className="button-as-anchor"
                                                                onClick={() =>
                                                                    this.openAdvance()
                                                                }
                                                            >
                                                                {' '}
                                                                Advance Options.
                                                            </button>
                                                        </div>
                                                    </div>
                                                </ShouldRender>
                                                <ShouldRender
                                                    if={
                                                        this.state.advance &&
                                                        (type === 'api' ||
                                                            type === 'url' ||
                                                            type ===
                                                                'server-monitor' ||
                                                            type === 'script' ||
                                                            type ===
                                                                'incomingHttpRequest')
                                                    }
                                                >
                                                    <ShouldRender
                                                        if={
                                                            this.state
                                                                .advance &&
                                                            type === 'api'
                                                        }
                                                    >
                                                        <ApiAdvance
                                                            index={
                                                                this.props.index
                                                            }
                                                        />
                                                    </ShouldRender>
                                                    <ResponseComponent
                                                        head="Monitor up criteria"
                                                        tagline="This is where you describe when your monitor is considered up"
                                                        fieldname={`up_${this.props.index}`}
                                                        index={this.props.index}
                                                        type={this.state.type}
                                                    />
                                                    <ResponseComponent
                                                        head="Monitor degraded criteria"
                                                        tagline="This is where you describe when your monitor is considered degraded"
                                                        fieldname={`degraded_${this.props.index}`}
                                                        index={this.props.index}
                                                        type={this.state.type}
                                                    />
                                                    <ResponseComponent
                                                        head="Monitor down criteria"
                                                        tagline="This is where you describe when your monitor is considered down"
                                                        fieldname={`down_${this.props.index}`}
                                                        index={this.props.index}
                                                        type={this.state.type}
                                                    />
                                                </ShouldRender>
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>
                            </div>
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--12">
                                <div className="bs-Tail-copy">
                                    <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart">
                                        <ShouldRender
                                            if={
                                                this.props.monitor.newMonitor
                                                    .error ||
                                                this.props.monitor.editMonitor
                                                    .error
                                            }
                                        >
                                            <div className="Box-root Margin-right--8">
                                                <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                            </div>
                                            <div className="Box-root">
                                                <span
                                                    style={{ color: 'red' }}
                                                    id="formNewMonitorError"
                                                >
                                                    {this.props.monitor
                                                        .newMonitor.error ||
                                                        this.props.monitor
                                                            .editMonitor.error}
                                                </span>
                                            </div>
                                        </ShouldRender>
                                    </div>
                                </div>
                                <div>
                                    <ShouldRender
                                        if={!requesting && this.props.edit}
                                    >
                                        <button
                                            className="bs-Button"
                                            disabled={requesting}
                                            onClick={this.cancelEdit}
                                        >
                                            <span>Cancel</span>
                                        </button>
                                    </ShouldRender>
                                    <button
                                        id="addMonitorButton"
                                        className="bs-Button bs-Button--blue"
                                        disabled={requesting}
                                        type="submit"
                                    >
                                        <PricingPlan
                                            plan={this.getNextPlan(
                                                planCategory
                                            )}
                                            hideChildren={false}
                                            disabled={
                                                unlimitedMonitors.includes(
                                                    planCategory
                                                ) ||
                                                currentMonitorCount <
                                                    monitorCount
                                            }
                                        >
                                            <ShouldRender
                                                if={
                                                    !this.props.edit &&
                                                    !requesting
                                                }
                                            >
                                                <span>Add Monitor</span>
                                            </ShouldRender>
                                        </PricingPlan>
                                        <ShouldRender
                                            if={this.props.edit && !requesting}
                                        >
                                            <span>Edit Monitor </span>
                                        </ShouldRender>

                                        <ShouldRender if={requesting}>
                                            <FormLoader />
                                        </ShouldRender>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

NewMonitor.displayName = 'NewMonitor';

const NewMonitorForm = new reduxForm({
    form: 'NewMonitor',
    destroyOnUnmount: true,
    enableReinitialize: true,
})(NewMonitor);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            createMonitor,
            createMonitorSuccess,
            createMonitorFailure,
            resetCreateMonitor,
            editMonitorSwitch,
            openModal,
            closeModal,
            editMonitor,
            logFile,
            resetFile,
            setFileInputKey,
            uploadIdentityFile,
            fetchMonitorCriteria,
            setMonitorCriteria,
            addSeat,
            fetchMonitorsIncidents,
            fetchMonitorsSubscribers,
            fetchSchedules,
            scheduleSuccess,
            showUpgradeForm,
            toggleEdit,
            fetchCommunicationSlas,
            fetchMonitorSlas,
        },
        dispatch
    );

const mapStateToProps = (state, ownProps) => {
    const name = selector(state, 'name_1000');
    const type = selector(state, 'type_1000');
    const mode = selector(state, 'mode_1000');
    const authentication = selector(state, 'authentication_1000');
    const category = selector(state, 'resourceCategory_1000');
    const schedule = selector(state, 'callSchedule_1000');
    const monitorSla = selector(state, 'monitorSla');
    const incidentCommunicationSla = selector(
        state,
        'incidentCommunicationSla'
    );
    let projectId = null;

    for (const project of state.component.componentList.components) {
        for (const component of project.components) {
            if (component._id === ownProps.componentId) {
                projectId = component.projectId._id;
                break;
            }
        }
    }
    if (projectId === null)
        projectId = ownProps.currentProject && ownProps.currentProject._id;

    const currentPlanId =
        state.project &&
        state.project.currentProject &&
        state.project.currentProject.stripePlanId
            ? state.project.currentProject.stripePlanId
            : '';

    if (ownProps.edit) {
        const monitorId = ownProps.match
            ? ownProps.match.params
                ? ownProps.match.params.monitorId
                : null
            : null;
        return {
            monitor: state.monitor,
            currentProject: state.project.currentProject,
            name,
            type,
            mode,
            authentication,
            category,
            identityFile: state.monitor.file,
            schedule,
            monitorSla,
            incidentCommunicationSla,
            subProjects: state.subProject.subProjects.subProjects,
            schedules: state.schedule.schedules.data,
            resourceCategoryList:
                state.resourceCategories.resourceCategoryListForNewResource
                    .resourceCategories,
            monitorId,
            project: state.project.currentProject
                ? state.project.currentProject
                : {},
            currentPlanId,
            projectId,
            incidentSlas:
                state.incidentSla.incidentCommunicationSlas.incidentSlas,
            requestingSla:
                state.incidentSla.incidentCommunicationSlas.requesting,
            fetchSlaError: state.incidentSla.incidentCommunicationSlas.error,
            monitorSlas: state.monitorSla.monitorSlas.slas,
            requestingMonitorSla: state.monitorSla.monitorSlas.requesting,
            fetchSlaError: state.monitorSla.monitorSlas.error,
        };
    } else {
        return {
            initialValues: state.monitor.newMonitor.initialValue,
            monitor: state.monitor,
            currentProject: state.project.currentProject,
            name,
            type,
            mode,
            authentication,
            category,
            identityFile: state.monitor.file,
            schedule,
            monitorSla,
            incidentCommunicationSla,
            resourceCategoryList:
                state.resourceCategories.resourceCategoryListForNewResource
                    .resourceCategories,
            subProjects: state.subProject.subProjects.subProjects,
            schedules: state.schedule.schedules.data,
            project: state.project.currentProject
                ? state.project.currentProject
                : {},
            currentPlanId,
            projectId,
            incidentSlas:
                state.incidentSla.incidentCommunicationSlas.incidentSlas,
            requestingSla:
                state.incidentSla.incidentCommunicationSlas.requesting,
            fetchSlaError: state.incidentSla.incidentCommunicationSlas.error,
            monitorSlas: state.monitorSla.monitorSlas.slas,
            requestingMonitorSla: state.monitorSla.monitorSlas.requesting,
            fetchSlaError: state.monitorSla.monitorSlas.error,
        };
    }
};

NewMonitor.propTypes = {
    index: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired,
    ]),
    editMonitorSwitch: PropTypes.func.isRequired,
    currentProject: PropTypes.object.isRequired,
    editMonitor: PropTypes.func.isRequired,
    createMonitor: PropTypes.func.isRequired,
    monitor: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    fetchMonitorsIncidents: PropTypes.func.isRequired,
    fetchMonitorsSubscribers: PropTypes.func.isRequired,
    fetchSchedules: PropTypes.func.isRequired,
    editMonitorProp: PropTypes.object,
    edit: PropTypes.bool,
    name: PropTypes.string,
    type: PropTypes.string,
    mode: PropTypes.string,
    authentication: PropTypes.string,
    category: PropTypes.string,
    subProject: PropTypes.string,
    schedule: PropTypes.string,
    monitorSla: PropTypes.string,
    incidentCommunicationSla: PropTypes.string,
    resourceCategoryList: PropTypes.array,
    schedules: PropTypes.array,
    monitorId: PropTypes.string,
    setMonitorCriteria: PropTypes.func,
    fetchMonitorCriteria: PropTypes.func,
    showUpgradeForm: PropTypes.func,
    project: PropTypes.object,
    currentPlanId: PropTypes.string,
    projectId: PropTypes.string,
    subProjects: PropTypes.array,
    toggleEdit: PropTypes.func,
    logFile: PropTypes.func,
    resetFile: PropTypes.func,
    identityFile: PropTypes.string,
    setFileInputKey: PropTypes.func,
    fileInputKey: PropTypes.string,
    uploadIdentityFile: PropTypes.func,
    fetchCommunicationSlas: PropTypes.func,
    incidentSlas: PropTypes.array,
    fetchSlaError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    requestingSla: PropTypes.bool,
    fetchMonitorSlas: PropTypes.func,
    monitorSlas: PropTypes.array,
    fetchMonitorSlaError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    requestingMonitorSla: PropTypes.bool,
};

export default connect(mapStateToProps, mapDispatchToProps)(NewMonitorForm);
