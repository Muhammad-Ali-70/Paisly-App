/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.useFakeTimers();

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  // Let the splash timer run so no state update lands after the test ends
  await ReactTestRenderer.act(() => {
    jest.runOnlyPendingTimers();
  });
  renderer?.unmount();
});
