import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

export const useKeyboardInset = () => {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const windowHeight = Dimensions.get('window').height;
      const nextInset = Math.max(0, windowHeight - event.endCoordinates.screenY);
      setKeyboardInset(nextInset);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardInset;
};
