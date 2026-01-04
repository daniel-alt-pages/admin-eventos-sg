import { calendar_v3 } from 'googleapis';

export interface EventConfig {
    defaultConfig: {
        guestsCanModify: boolean;
        guestsCanInviteOthers: boolean;
        guestsCanSeeOtherGuests: boolean;
        defaultAttendees: { email: string }[];
        reminders: {
            useDefault: boolean;
            overrides: { method: string; minutes: number }[];
        };
    };
}

export interface EventInstance {
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    attendees: { email: string }[];
    guestsCanModify: boolean;
    guestsCanInviteOthers: boolean;
    guestsCanSeeOtherGuests: boolean;
    conferenceData?: any;
    reminders: {
        useDefault: boolean;
        overrides: { method: string; minutes: number }[];
    };
}

export class EventModel {
    private config: EventConfig;

    constructor(config: EventConfig) {
        this.config = config;
    }

    createEventObject(
        name: string,
        startTime: string,
        endTime: string,
        attendees: { email: string }[] = [],
        description?: string
    ): any {
        const baseConfig = this.config.defaultConfig;

        // Merge provided attendees with default ones
        const allAttendees = [...baseConfig.defaultAttendees, ...attendees];

        return {
            summary: name,
            description: description,
            start: {
                dateTime: startTime, // ISO format
                timeZone: 'America/Bogota', // Adjustable
            },
            end: {
                dateTime: endTime,
                timeZone: 'America/Bogota',
            },
            attendees: allAttendees,
            guestsCanModify: true, // Allow tutors (guests) to modify
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: true,
            conferenceData: {
                createRequest: {
                    requestId: Math.random().toString(36).substring(7),
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            reminders: baseConfig.reminders
        };
    }
}
