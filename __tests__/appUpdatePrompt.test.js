import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import apiClient from '../src/services/apiClient';
import { storage } from '../src/services/storage';
import AppUpdatePrompt from '../src/components/common/AppUpdatePrompt';

const textOf = r =>
  r.root
    .findAll(n => typeof n.props.children === 'string')
    .map(n => n.props.children)
    .join(' | ');

const renderWith = async (android, build = '4') => {
  jest.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: { android } } });
  jest.spyOn(DeviceInfo, 'getBuildNumber').mockReturnValue(build);
  let r;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(<AppUpdatePrompt />);
  });
  return r;
};

beforeEach(() => {
  Platform.OS = 'android';
  storage.remove('update_prompt_snooze');
});
afterEach(() => jest.restoreAllMocks());

test('optional prompt when a newer build exists', async () => {
  const r = await renderWith({ latestVersionCode: 5, minVersionCode: 0, message: null });
  expect(textOf(r)).toContain('Update available');
  expect(textOf(r)).toContain('Later');
});

test('forced prompt keeps the warning and adds the custom message', async () => {
  const r = await renderWith({ latestVersionCode: 5, minVersionCode: 5, message: 'Faster sync' });
  const text = textOf(r);
  expect(text).toContain('Update required');
  expect(text).toContain('no longer supported');
  expect(text).toContain('Faster sync');
  expect(text).not.toContain('Later');
});

test('nothing when up to date', async () => {
  const r = await renderWith({ latestVersionCode: 4, minVersionCode: 0, message: null });
  expect(r.toJSON()).toBeNull();
});

test('"Later" snoozes that version', async () => {
  storage.set(
    'update_prompt_snooze',
    JSON.stringify({ version: 5, until: Date.now() + 60000 }),
  );
  const r = await renderWith({ latestVersionCode: 5, minVersionCode: 0, message: null });
  expect(r.toJSON()).toBeNull();
});
