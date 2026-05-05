const { test, expect } = require('@playwright/test');

const selectors = {
  imageSection: '.image-section',
  toggle: '#theme-toggle',
  manVideo: '#theme-video-man',
  reverseVideo: '#theme-video-reverse'
};

async function mediaContainerHasContent(page) {
  return page.locator(selectors.imageSection).evaluate((section) => {
    const hasVisibleVideo = Array.from(section.querySelectorAll('video')).some((video) => {
      const style = window.getComputedStyle(video);
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '0') > 0;
    });

    const fallback = section.querySelector('.image-section-fallback');
    if (!fallback) {
      return hasVisibleVideo;
    }

    const fallbackStyle = window.getComputedStyle(fallback);
    const hasVisibleFallback = fallbackStyle.display !== 'none'
      && fallbackStyle.visibility !== 'hidden'
      && Number.parseFloat(fallbackStyle.opacity || '1') > 0;

    return hasVisibleVideo || hasVisibleFallback;
  });
}

async function expectContainerNeverEmpty(page, durationMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < durationMs) {
    const hasRenderableContent = await mediaContainerHasContent(page);
    expect(hasRenderableContent).toBe(true);
    await page.waitForTimeout(120);
  }
}

async function registerPlayEventTracking(page) {
  await page.evaluate(() => {
    window.__themeVideoPlayEvents = [];
    const manVideo = document.getElementById('theme-video-man');
    const reverseVideo = document.getElementById('theme-video-reverse');

    manVideo.addEventListener('play', () => {
      window.__themeVideoPlayEvents.push('man');
    });

    reverseVideo.addEventListener('play', () => {
      window.__themeVideoPlayEvents.push('reverse');
    });
  });
}

async function getMediaFlags(page, selector) {
  return page.locator(selector).evaluate((video) => ({
    muted: video.muted,
    defaultMuted: video.defaultMuted,
    controls: video.controls
  }));
}

async function expectTransitionLayering(page, expected) {
  await expect.poll(() => {
    return page.locator(selectors.imageSection).evaluate((section) => {
      const man = section.querySelector('#theme-video-man');
      const reverse = section.querySelector('#theme-video-reverse');
      return {
        state: section.getAttribute('data-media-state'),
        transitionVideo: section.getAttribute('data-transition-video'),
        nextVideo: section.getAttribute('data-next-video'),
        manVisible: man.classList.contains('is-visible'),
        reverseVisible: reverse.classList.contains('is-visible'),
        manTop: man.classList.contains('is-on-top'),
        reverseTop: reverse.classList.contains('is-on-top')
      };
    });
  }).toEqual(expected);
}

test('dark -> light uses man.mp4 and ends on light resting frame', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('theme'));
  await page.goto('/index.html');
  await registerPlayEventTracking(page);

  const root = page.locator('html');
  const imageSection = page.locator(selectors.imageSection);

  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(imageSection).toHaveAttribute('data-media-state', 'resting-dark');

  const manFlags = await getMediaFlags(page, selectors.manVideo);
  const reverseFlags = await getMediaFlags(page, selectors.reverseVideo);
  expect(manFlags.muted).toBe(true);
  expect(manFlags.defaultMuted).toBe(true);
  expect(manFlags.controls).toBe(false);
  expect(reverseFlags.muted).toBe(true);
  expect(reverseFlags.defaultMuted).toBe(true);
  expect(reverseFlags.controls).toBe(false);

  await page.locator(selectors.toggle).click();

  await expect(root).toHaveAttribute('data-theme', 'light');
  await expectTransitionLayering(page, {
    state: 'transitioning-dark-to-light',
    transitionVideo: 'man',
    nextVideo: 'reverse',
    manVisible: true,
    reverseVisible: true,
    manTop: true,
    reverseTop: false
  });
  await expect(imageSection).toHaveAttribute('data-last-transition-video', 'man');
  await expect.poll(() => page.evaluate(() => window.__themeVideoPlayEvents.includes('man'))).toBe(true);
  await expectContainerNeverEmpty(page, 2_000);
  await expect(imageSection).toHaveAttribute('data-media-state', 'resting-light', { timeout: 15_000 });
  await expect(imageSection).toHaveAttribute('data-next-video', '');
  await expect(page.locator(selectors.reverseVideo)).toHaveClass(/is-visible/);
});

test('light -> dark uses reverse.mp4 and ends on dark resting frame', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/index.html');
  await registerPlayEventTracking(page);

  const root = page.locator('html');
  const imageSection = page.locator(selectors.imageSection);

  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(imageSection).toHaveAttribute('data-media-state', 'resting-light');

  await page.locator(selectors.toggle).click();

  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expectTransitionLayering(page, {
    state: 'transitioning-light-to-dark',
    transitionVideo: 'reverse',
    nextVideo: 'man',
    manVisible: true,
    reverseVisible: true,
    manTop: false,
    reverseTop: true
  });
  await expect(imageSection).toHaveAttribute('data-last-transition-video', 'reverse');
  await expect.poll(() => page.evaluate(() => window.__themeVideoPlayEvents.includes('reverse'))).toBe(true);
  await expectContainerNeverEmpty(page, 2_000);
  await expect(imageSection).toHaveAttribute('data-media-state', 'resting-dark', { timeout: 15_000 });
  await expect(imageSection).toHaveAttribute('data-next-video', '');
  await expect(page.locator(selectors.manVideo)).toHaveClass(/is-visible/);
});
