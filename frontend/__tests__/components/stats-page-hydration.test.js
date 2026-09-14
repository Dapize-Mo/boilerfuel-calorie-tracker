import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import StatsPage from '../../pages/stats';
import MyApp from '../../pages/_app';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/stats',
    events: { on: jest.fn(), off: jest.fn() },
  }),
}));

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => children,
}));

describe('stats page hydration', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    window.requestAnimationFrame = jest.fn((callback) => callback());
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('uses identical server and initial client markup across UTC midnight', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-09-14T04:30:00.000Z'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const serverMarkup = renderToString(<MyApp Component={StatsPage} pageProps={{}} />);
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);
    consoleError.mockClear();
    const onRecoverableError = jest.fn();

    jest.setSystemTime(Date.parse('2026-09-13T23:30:00.000Z'));
    let root;
    await act(async () => {
      root = hydrateRoot(container, <MyApp Component={StatsPage} pageProps={{}} />, { onRecoverableError });
      await Promise.resolve();
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
