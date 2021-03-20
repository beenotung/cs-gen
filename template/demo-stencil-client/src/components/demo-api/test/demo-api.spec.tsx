import { newSpecPage } from '@stencil/core/testing';
import { DemoApi } from '../demo-api';

describe('demo-api', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [DemoApi],
      html: `<demo-api></demo-api>`,
    });
    expect(page.root).toEqualHtml(`
      <demo-api>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </demo-api>
    `);
  });
});
