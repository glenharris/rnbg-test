/* eslint-disable prettier/prettier */
import BackgroundGeolocation, { Geofence, GeofenceEvent, GeofencesChangeEvent } from 'react-native-background-geolocation';
import { BehaviorSubject } from 'rxjs';
import { GeoLocation, GeoLocationHelper } from './GeoLocation';

export const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const GEOFENCE_OFFSET = 500;
export const GEOFENCE_RADIUS = 200;

// Hack.
export interface GeofenceTestStatus {
    geofences?: Geofence[];
    lastLocation?: GeoLocation;
    active?: boolean;
    state?: any;
    enteredGeofences?: string[];
    closeGeofences?: string[];
}

export class GeofenceTest {
    async initialise() {
        console.warn('BackgroundGeolocation.ready');
        await BackgroundGeolocation.ready({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
            stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
            startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
            geofenceInitialTriggerEntry: true, // Ensure we are told if the new fence is triggered
        });
        BackgroundGeolocation.onGeofence((event) => this.handleGeofence(event));
        BackgroundGeolocation.onGeofencesChange((event) => this.handleGeofencesChange(event));
        const state = await BackgroundGeolocation.getState();
        this.active = state.enabled;
    }
    private active = false;
    public lastLocation: GeoLocation;
    public geofences: Geofence[] = [];
    public status = new BehaviorSubject<GeofenceTestStatus>({});
    public state: any;
    public enteredGeofences = new Set<string>();
    public closeGeofences = new Set<string>();
    constructor() {
        this.update();
    }
    async updateState(): Promise<void> {
        this.state = undefined;
        this.state = await BackgroundGeolocation.getState();
        this.update();
    }
    async setLocationGeofenceActive(isActive: boolean): Promise<void> {
        console.warn('setLocationGeofenceActive', isActive);
        if (isActive) {
            await BackgroundGeolocation.start();
        }
        else {
            await BackgroundGeolocation.stop();
        }
        this.active = isActive;
        await this.updateState();
    }
    async setGeofenceActive(isActive: boolean): Promise<void> {
        console.warn('setGeofenceActive', isActive);
        if (isActive) {
            await BackgroundGeolocation.startGeofences();
        }
        else {
            await BackgroundGeolocation.stop();
        }
        this.active = isActive;
        // this.update();
        // await timer(500).toPromise();
        await this.updateState();
    }
    async updateDistances(): Promise<void> {
        this.lastLocation = undefined;
        this.update();
        this.lastLocation = await this.getOptionalCurrentLocation();
        this.update();
    }
    public isActive() {
        return this.active;
    }
    private getStatus() {
        return {
            geofences: this.geofences,
            lastLocation: this.lastLocation,
            state: this.state,
            active: this.active,
            enteredGeofences: Array.from(this.enteredGeofences),
            closeGeofences: Array.from(this.closeGeofences),
        };
    }
    private update() {
        this.status.next(this.getStatus());
    }
    public async updateGeofences() {
        await BackgroundGeolocation.removeGeofences();
        this.geofences = [];
        this.update();
        const currentLocation = await this.getOptionalCurrentLocation();
        if (currentLocation) {
            let angleDegrees = 0;
            const geofences = [];
            for (const direction of directions) {
                const angleRadians = angleDegrees * Math.PI / 180;
                const ns = Math.cos(angleRadians) * GEOFENCE_OFFSET;
                const ew = Math.sin(angleRadians) * GEOFENCE_OFFSET;
                const geofenceLocation = GeoLocationHelper.translateLocation(currentLocation, ns, ew);
                geofences.push({
                    identifier: `Offset ${direction} ${GEOFENCE_OFFSET}m`,
                    radius: GEOFENCE_RADIUS,
                    ...geofenceLocation,
                    notifyOnEntry: true,
                    notifyOnExit: true,
                });
                angleDegrees += 45;
            }
            geofences.push({
                identifier: 'Origin',
                radius: GEOFENCE_RADIUS,
                ...currentLocation,
                notifyOnEntry: true,
                notifyOnExit: true,
            });
            for (const geofence of geofences) {
                await BackgroundGeolocation.addGeofence(geofence);
            }
            this.geofences = geofences;
        }
        this.update();
    }
    public async getOptionalCurrentLocation(timeoutMillis?: number): Promise<GeoLocation> {
        try {
            const timeoutSeconds = timeoutMillis ? timeoutMillis / 1000 : undefined;
            const location = await BackgroundGeolocation.getCurrentPosition({ timeout: timeoutSeconds });
            if (location) {
                console.log('getOptionalCurrentLocation %s', GeoLocationHelper.getGoogleMapsUrl(location.coords));
                return location.coords;
            }
        }
        catch (error) {
            console.warn('Error getting current location %s', error.message, error);
        }
    }
    public handleGeofencesChange(event: GeofencesChangeEvent): void {
        console.info('handleGeofencesChange %j', event);
        if (event.on) {
            for (const geofence of event.on) {
                this.closeGeofences.add(geofence.identifier);
            }
        }
        if (event.off) {
            for (const identifier of event.off) {
                this.closeGeofences.delete(identifier);
            }
        }
        this.update();
    }
    public handleGeofence(event: GeofenceEvent): void {
        console.info('handleGeofence %s %s', event.identifier, event.action);
        const { identifier, action } = event;
        if (action === 'ENTER') {
            this.enteredGeofences.add(identifier);
        }
        if (action === 'EXIT') {
            this.enteredGeofences.delete(identifier);
        }
        this.update();
    }

}
