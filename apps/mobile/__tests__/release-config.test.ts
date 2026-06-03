import fs from 'fs';
import path from 'path';

const mobileRoot = path.join(__dirname, '..');

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(mobileRoot, relativePath), 'utf8')
  ) as T;
}

describe('release configuration', () => {
  it('uses production-shaped native application identifiers', () => {
    const appJson = readJson<{
      expo: {
        ios?: { bundleIdentifier?: string };
        android?: { package?: string };
      };
    }>('app.json');

    expect(appJson.expo.ios?.bundleIdentifier).toBe('com.spicesync.app');
    expect(appJson.expo.android?.package).toBe('com.spicesync.app');
    expect(appJson.expo.ios?.bundleIdentifier).not.toContain('anonymous');
    expect(appJson.expo.android?.package).not.toContain('anonymous');
  });

  it('keeps checked-in native project identifiers aligned with app config', () => {
    const iosProject = fs.readFileSync(
      path.join(mobileRoot, 'ios', 'SpiceSync.xcodeproj', 'project.pbxproj'),
      'utf8'
    );
    const iosInfo = fs.readFileSync(
      path.join(mobileRoot, 'ios', 'SpiceSync', 'Info.plist'),
      'utf8'
    );
    const androidGradle = fs.readFileSync(
      path.join(mobileRoot, 'android', 'app', 'build.gradle'),
      'utf8'
    );
    const mainActivity = fs.readFileSync(
      path.join(
        mobileRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'spicesync',
        'app',
        'MainActivity.kt'
      ),
      'utf8'
    );
    const mainApplication = fs.readFileSync(
      path.join(
        mobileRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'spicesync',
        'app',
        'MainApplication.kt'
      ),
      'utf8'
    );

    expect(iosProject).toContain(
      'PRODUCT_BUNDLE_IDENTIFIER = com.spicesync.app;'
    );
    expect(iosInfo).toContain('<string>com.spicesync.app</string>');
    expect(androidGradle).toContain("namespace 'com.spicesync.app'");
    expect(androidGradle).toContain("applicationId 'com.spicesync.app'");
    expect(mainActivity).toContain('package com.spicesync.app');
    expect(mainApplication).toContain('package com.spicesync.app');
  });

  it('defines EAS build profiles for development, preview, and production', () => {
    const easJson = readJson<{
      build?: Record<string, unknown>;
      submit?: Record<string, unknown>;
    }>('eas.json');

    expect(Object.keys(easJson.build ?? {}).sort()).toEqual([
      'development',
      'preview',
      'production',
    ]);
    expect(easJson.submit).toHaveProperty('production');
  });

  it('links app config to a real EAS project id', () => {
    const appJson = readJson<{
      expo: { extra?: { eas?: { projectId?: string } } };
    }>('app.json');
    const projectId = appJson.expo.extra?.eas?.projectId;

    expect(projectId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(projectId).not.toBe('local');
  });

  it('uses the branded splash screen plugin on the dark launch background', () => {
    const appJson = readJson<{
      expo: {
        splash?: { image?: string; backgroundColor?: string };
        plugins?: unknown[];
      };
    }>('app.json');
    const splashPlugin = appJson.expo.plugins?.find((plugin) =>
      Array.isArray(plugin) ? plugin[0] === 'expo-splash-screen' : false
    ) as
      | ['expo-splash-screen', { image?: string; backgroundColor?: string }]
      | undefined;

    expect(appJson.expo.splash).toEqual({
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0D0006',
    });
    expect(splashPlugin?.[1]).toMatchObject({
      image: './assets/splash.png',
      backgroundColor: '#0D0006',
    });
  });
});
