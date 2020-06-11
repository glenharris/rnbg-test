/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { Geofence } from 'react-native-background-geolocation';
import { interval } from 'rxjs';
import { GeofenceTest } from './GeofenceTest';
import { GeoLocation, GeoLocationHelper } from './GeoLocation';
import { useObservable } from './Observable';

export function GeofenceComponent(props: { geofence: Geofence, referenceLocation?: GeoLocation }) {
    let distance: string;
    const { geofence, referenceLocation } = props;
    if (referenceLocation) {
        const distanceMeters = GeoLocationHelper.getGeoDistanceMeters(geofence, referenceLocation);
        distance = `${Math.round(distanceMeters)}m`;
    }
    return (
        <View key={geofence.identifier}>
            <Text>{geofence.identifier}: {distance}</Text>
        </View>
    );

}

export function TestComponent(props: { geofenceTest: GeofenceTest }) {
    const { geofenceTest } = props;
    const [status] = useObservable(geofenceTest.status);
    const [now, nowDispatch] = useState<Date>(() => new Date());
    console.info('Render at', now.toISOString());
    useEffect(() => {
        const observable = interval(5000);
        const subscription = observable.subscribe(() => nowDispatch(new Date()));
        return () => subscription.unsubscribe();
    }, []);
    if (status) {
        const { geofences, state, enteredGeofences, closeGeofences } = status;
        let shortState;
        if (state) {
            shortState = {
                enabled: state.enabled,
                trackingMode: state.trackingMode,
            };
        }
        return (
            <>
                <Text>{`Current Time: ${now.toISOString()}`}</Text>
                <Button onPress={() => geofenceTest.updateGeofences()} title="Update Geofences" />
                <Button onPress={() => geofenceTest.updateDistances()} title="Update Distances" />
                <Button onPress={() => geofenceTest.updateState()} title="Update State" />
                <View>
                    <Text>Location + Geofence</Text>
                    <Switch
                        onValueChange={(value) => geofenceTest.setLocationGeofenceActive(value)}
                        value={status.active}
                    />
                </View>
                <View>
                    <Text>Geofence</Text>
                    <Switch
                        onValueChange={(value) => geofenceTest.setGeofenceActive(value)}
                        value={status.active}
                    />
                </View>
                {enteredGeofences &&
                    <>
                        <Text style={styles.heading}>{`${enteredGeofences.length} Entered GeoFences:`}</Text>
                        <FlatList
                            listKey="enteredGeofences"
                            data={enteredGeofences}
                            keyExtractor={(item) => item}
                            renderItem={(info) => (
                                <Text >{info.item}</Text>
                            )}
                        />
                    </>
                }
                {closeGeofences &&
                    <>
                        <Text style={styles.heading}>{`${closeGeofences.length} Close GeoFences:`}</Text>
                        <FlatList
                            listKey="closeGeofences"
                            data={closeGeofences}
                            keyExtractor={(item) => item}
                            renderItem={(info) => (
                                <Text>{info.item}</Text>
                            )}
                        />
                    </>
                }
                {geofences &&
                    <>
                        <Text style={styles.heading}>{`${geofences.length} Registered GeoFences:`}</Text>
                        <FlatList
                            listKey="geofences"
                            data={geofences}
                            keyExtractor={(item) => item.identifier}
                            renderItem={(info) => (
                                <GeofenceComponent geofence={info.item} referenceLocation={status.lastLocation} />
                            )}
                        />
                    </>
                }
                {shortState &&
                    <>
                        <Text style={styles.heading}>State Summary:</Text>
                        <Text>{JSON.stringify(shortState, undefined, 2)}</Text>
                    </>
                }
                {state &&
                    <>
                        <Text style={styles.heading}>State:</Text>
                        <Text>{JSON.stringify(state, undefined, 2)}</Text>
                    </>
                }
            </>
        );
    }
    return null;
}


const styles = StyleSheet.create({
    heading: {
        fontWeight: 'bold',
    },
});
