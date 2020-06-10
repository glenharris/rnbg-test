/* eslint-disable prettier/prettier */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, Text } from 'react-native';
import { GeofenceTest } from './GeofenceTest';
import { TestComponent } from './Test';


declare const global: { HermesInternal: null | {} };

async function initialise() {
    const geofenceTest = new GeofenceTest();
    await geofenceTest.initialise();
    await geofenceTest.updateGeofences();
    return geofenceTest;
}
const App = () => {
    const [geofenceTest, geofenceTestSet] = useState<GeofenceTest>();
    useEffect(() => {
        initialise().then(geofenceTestSet);
    }, []);
    return (
        <>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView>
                {geofenceTest ?
                    <FlatList
                        data={[]}
                        renderItem={() => null}
                        ListHeaderComponent={
                            <TestComponent geofenceTest={geofenceTest} />
                        }
                    />
                    :
                    <Text>Initialising...</Text>
                }
            </SafeAreaView>
        </>
    );
};

export default App;
