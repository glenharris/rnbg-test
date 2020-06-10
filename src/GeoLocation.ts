/* eslint-disable prettier/prettier */

export interface GeoLocation {
    latitude: number;
    longitude: number;
}


export namespace GeoLocationHelper {
    export function getGoogleMapsUrl(location: GeoLocation): string {
        return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    }
    export function degreesToRadians(degrees: number): number {
        return (degrees * Math.PI) / 180;
    }
    export function getGeoDistanceMeters(first: GeoLocation, second: GeoLocation): number {
        // Check.argumentDefined(first);
        // Check.argumentDefined(second);
        // https://en.wikipedia.org/wiki/Haversine_formula
        const earthRadiusMeters = 6371 * 1000;
        const latitudeDegrees = degreesToRadians(second.latitude - first.latitude);
        const longitudeDegrees = degreesToRadians(second.longitude - first.longitude);
        const sinHalfLatitude = Math.sin(latitudeDegrees / 2);
        const sinHalfLongitude = Math.sin(longitudeDegrees / 2);
        const h = sinHalfLatitude * sinHalfLatitude + Math.cos(degreesToRadians(first.latitude)) * Math.cos(degreesToRadians(second.latitude)) * sinHalfLongitude * sinHalfLongitude;
        const distance = 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
        return distance;
    }

    export function translateLocation(location: GeoLocation, nsMeters: number, ewMeters: number): GeoLocation {
        // Pretty shitty flat-plane approximation, needs updating for poles
        // https://gis.stackexchange.com/questions/5821/calculating-latitude-longitude-x-miles-from-point
        const cosLatitude = Math.cos(GeoLocationHelper.degreesToRadians(location.latitude));
        const latitudeLengthMeters = 111111; // 10^7/90
        const latitudeDelta = nsMeters / latitudeLengthMeters;
        const longitudeLengthMeters = cosLatitude * latitudeLengthMeters;
        const longitudeDelta = ewMeters / longitudeLengthMeters;
        return {
            latitude: location.latitude + latitudeDelta,
            longitude: location.longitude + longitudeDelta,
        };
    }


}
