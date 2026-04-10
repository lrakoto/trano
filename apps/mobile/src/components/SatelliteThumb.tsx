import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

interface Props {
  latitude:  number;
  longitude: number;
  width:     number;
  height:    number;
  /** How many degrees to show around the coordinate — smaller = more zoomed in */
  delta?: number;
}

export function SatelliteThumb({ latitude, longitude, width, height, delta = 0.002 }: Props) {
  return (
    <View style={[styles.container, { width, height }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        mapType="satellite"
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta:  delta,
          longitudeDelta: delta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
