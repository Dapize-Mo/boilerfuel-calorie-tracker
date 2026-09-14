import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import NutritionMenu from '../../components/menu/NutritionMenu';

describe('NutritionMenu hydration', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ grouped: {} }),
    }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('does not hydrate differently when the server and visitor are on opposite sides of UTC midnight', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-09-14T04:30:00.000Z'));
    const serverMarkup = renderToString(<NutritionMenu />);
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onRecoverableError = jest.fn();

    jest.setSystemTime(Date.parse('2026-09-13T23:30:00.000Z'));
    let root;
    await act(async () => {
      root = hydrateRoot(container, <NutritionMenu />, { onRecoverableError });
      await Promise.resolve();
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
