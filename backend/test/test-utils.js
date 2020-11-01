module.exports = {
    getAuthorizationHeader: ({ jwtToken }) => `Basic ${jwtToken}`,
    login: async ({ request, email, password }) => {
        return await request.post('/user/login').send({
            email,
            password,
        });
    },
    /**
   * Example of payload:
      const payload = {
        projectId,
        name: "test",
        criteria: {},
        data: {},
      }
   */
    createComponent: async ({ request, authorization, projectId, payload }) => {
        return await request
            .post(`/component/${projectId}`)
            .set('Authorization', authorization)
            .send(payload);
    },
    /**
   * Example of payload:
      const payload = {
        componentId,
        projectId,
        type: "device",
        name: "test monitor ",
        data: { deviceId: "abcdef" },
        deviceId: "abcdef",
        criteria: {},
      }
   */
    createMonitor: async ({ request, authorization, projectId, payload }) => {
        return await request
            .post(`/monitor/${projectId}`)
            .set('Authorization', authorization)
            .send(payload);
    },
    /**
   * Example of payloads:
      const payload = {
        alertVia: "sms",
        contactPhone: "9173976235",
        countryCode: "us",
      };
      const payload1 = {
        alertVia: "email",
        contactEmail: "test@hackerbay.io"
      }
   */
    addSubscriberToMonitor: async ({
        request,
        authorization,
        projectId,
        monitorId,
        payload,
    }) => {
        return await request
            .post(`/subscriber/${projectId}/subscribe/${monitorId}`)
            .set('Authorization', authorization)
            .send(payload);
    },
    rechargeBalance: async ({
        request,
        authorization,
        projectId,
        rechargeBalanceAmount,
    }) => {
        return await request
            .post(`/stripe/${projectId}/addBalance`)
            .set('Authorization', authorization)
            .send({ rechargeBalanceAmount });
    },
    createSchedule: async ({ request, authorization, projectId, name }) => {
        return await request
            .post(`/schedule/${projectId}`)
            .set('Authorization', authorization)
            .send({ name });
    },
    /**
   * Example of a payload
      const payload = { monitorIds: [monitorId] };
   */
    updateSchedule: async ({
        request,
        authorization,
        projectId,
        scheduleId,
        payload,
    }) => {
        return await request
            .put(`/schedule/${projectId}/${scheduleId}`)
            .set('Authorization', authorization)
            .send(payload);
    },
    /**
   * Example of a payload:
      const payload= [{
        callReminders: "1",
        smsReminders: "1",
        emailReminders: "1",
        email: false,
        sms: true,
        call: true,
        teams: [
          {
            teamMembers:
              [
                {
                  member: "",
                  timezone: "",
                  startTime: "",
                  endTime: "",
                  userId
                }
              ]
          }
        ]
      }]
   */
    addEscalation: async ({
        request,
        authorization,
        projectId,
        scheduleId,
        payload,
    }) => {
        return await request
            .post(`/schedule/${projectId}/${scheduleId}/addescalation`)
            .set('Authorization', authorization)
            .send(payload);
    },
    getSubscribersAlerts: async ({
        request,
        authorization,
        projectId,
        incidentId,
        skip = 0,
        limit = 999,
    }) => {
        return await request
            .get(
                `/subscriberAlert/${projectId}/incident/${incidentId}?skip=${skip}&limit=${limit}`
            )
            .set('Authorization', authorization);
    },
    getOnCallAlerts: async ({
        request,
        authorization,
        projectId,
        incidentId,
        skip = 0,
        limit = 999,
    }) => {
        return await request
            .get(
                `/alert/${projectId}/incident/${incidentId}?skip=${skip}&limit=${limit}`
            )
            .set('Authorization', authorization);
    },
    verifyToken: async ({ request, token }) => {
        return await request.get(`/user/confirmation/${token}`).redirects(0);
    },
    /**
   * Example of payload
      const payload = {
        monitorId,
        projectId,
        title: "test monitor  is offline.",
        incidentType: "offline",
        description: 'Incident description',
      };
   */
    createIncident: async ({
        request,
        authorization,
        projectId,
        monitorId,
        payload,
    }) => {
        return await request
            .post(`/incident/${projectId}/${monitorId}`)
            .set('Authorization', authorization)
            .send(payload);
    },
    markIncidentAsResolved: async ({
        request,
        authorization,
        projectId,
        incidentId,
    }) => {
        return await request
            .post(`/incident/${projectId}/resolve/${incidentId}`)
            .set('Authorization', authorization);
    },
};