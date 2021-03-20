import { newE2EPage } from '@stencil/core/testing';

describe('demo-api', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<demo-api></demo-api>');

    const element = await page.find('demo-api');
    expect(element).toHaveClass('hydrated');
  });
});
