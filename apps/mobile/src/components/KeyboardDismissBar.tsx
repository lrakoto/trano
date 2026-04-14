import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform,
} from 'react-native';
import { COLORS } from '../constants';

/**
 * Thin bar that floats above the keyboard when it's visible.
 * Place inside the root view of any form screen.
 */
export function KeyboardDismissBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setVisible(false),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={Keyboard.dismiss} hitSlop={8}>
        <Text style={styles.label}>Ferena ▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position:          'absolute',
    bottom:             0,
    left:               0,
    right:              0,
    backgroundColor:   COLORS.surface,
    borderTopWidth:     1,
    borderTopColor:    COLORS.border,
    paddingVertical:    10,
    paddingHorizontal:  20,
    alignItems:        'flex-end',
    zIndex:             999,
  },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
